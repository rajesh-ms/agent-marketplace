import { randomUUID } from "node:crypto";

import {
  type AgentCardInput,
  type AgentRecord,
  type HeartbeatInput,
  type MarketplaceAgentSummary,
  type MarketplaceOverview,
  type PaginatedResult,
  type ResolveOptions,
  type ResolveResult,
  type SearchFilters,
} from "./models.js";

const LIFECYCLE_STATUSES = new Set(["active", "inactive", "degraded", "deprecated"]);
const ISO_8601_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

class RegistryError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends RegistryError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends RegistryError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class NotFoundError extends RegistryError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class AccessDeniedError extends RegistryError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentRecord>();

  register(input: AgentCardInput): AgentRecord {
    const record = normalizeRegistration(input);
    const key = this.keyFor(record.name, record.version);

    if (this.agents.has(key)) {
      throw new ConflictError(`Agent ${record.name}@${record.version} is already registered.`);
    }

    this.agents.set(key, record);
    return clone(record);
  }

  getByName(name: string, requester?: string): AgentRecord[] {
    const normalizedName = normalizeToken(name);
    const matches = this.records()
      .filter((record) => normalizeToken(record.name) === normalizedName)
      .filter((record) => this.isAllowed(record, requester, "view"))
      .sort((left, right) => compareVersions(right.version, left.version));

    return matches.map(clone);
  }

  get(name: string, version: string, requester?: string): AgentRecord {
    const record = this.agents.get(this.keyFor(name, version));

    if (!record) {
      throw new NotFoundError(`Agent ${name}@${version} was not found.`);
    }

    if (!this.isAllowed(record, requester, "view")) {
      throw new AccessDeniedError(`Requester ${requester ?? "anonymous"} cannot view ${name}@${version}.`);
    }

    return clone(record);
  }

  search(filters: SearchFilters = {}): PaginatedResult<AgentRecord> {
    const page = parsePositiveInteger(filters.page, "page", 1);
    const pageSize = parsePositiveInteger(filters.pageSize, "pageSize", 10);
    const action = filters.action ?? "view";

    if (filters.status) {
      validateLifecycleStatus(filters.status, "status");
    }

    const filtered = this.records()
      .filter((record) => this.isAllowed(record, filters.requester, action))
      .filter((record) => !filters.tag || includesToken(record.tags, filters.tag))
      .filter((record) => !filters.capability || includesToken(record.capabilities, filters.capability))
      .filter((record) => !filters.useCase || includesToken(record.useCases, filters.useCase))
      .filter((record) => !filters.owner || normalizeToken(record.ownerTeam) === normalizeToken(filters.owner))
      .filter((record) => !filters.protocol || includesToken(record.supportedProtocols, filters.protocol))
      .filter((record) => !filters.inputType || includesToken(record.inputTypes, filters.inputType))
      .filter((record) => !filters.outputType || includesToken(record.outputTypes, filters.outputType))
      .filter((record) => !filters.status || record.status === filters.status)
      .filter((record) => filters.deprecated === undefined || record.deprecated === filters.deprecated)
      .sort((left, right) => {
        const nameOrder = left.name.localeCompare(right.name);
        return nameOrder !== 0 ? nameOrder : compareVersions(right.version, left.version);
      });

    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map(clone);

    return { items, total, page, pageSize, totalPages };
  }

  resolve(name: string, options: ResolveOptions = {}): ResolveResult {
    const action = options.action ?? "invoke";
    const allCandidates = this.records()
      .filter((record) => normalizeToken(record.name) === normalizeToken(name))
      .filter((record) => !options.version || record.version === options.version);

    const authorizedCandidates = allCandidates.filter((record) => this.isAllowed(record, options.requester, action));
    const candidates = authorizedCandidates
      .filter((record) => record.status !== "inactive")
      .filter((record) => !record.deprecated)
      .sort((left, right) => compareVersions(right.version, left.version));

    const match = candidates[0];

    if (!match) {
      if (authorizedCandidates.length > 0) {
        throw new NotFoundError(`No callable agent found for ${name}${options.version ? `@${options.version}` : ""}.`);
      }

      if (allCandidates.length > 0) {
        throw new AccessDeniedError(`Requester ${options.requester ?? "anonymous"} cannot ${action} ${name}.`);
      }

      throw new NotFoundError(`No callable agent found for ${name}${options.version ? `@${options.version}` : ""}.`);
    }

    return {
      name: match.name,
      version: match.version,
      endpoint: match.endpoint,
      supportedProtocols: [...match.supportedProtocols],
      authRequirements: clone(match.authRequirements),
      inputTypes: [...match.inputTypes],
      outputTypes: [...match.outputTypes],
      status: match.status,
      deprecated: match.deprecated,
    };
  }

  getMarketplaceOverview(requester?: string, limit = 5): MarketplaceOverview {
    const cappedLimit = parsePositiveInteger(limit, "limit", 5);
    const visible = this.records()
      .filter((record) => this.isAllowed(record, requester, "view"))
      .sort((left, right) => compareRecency(right, left));
    const callable = visible.filter(
      (record) => this.isAllowed(record, requester, "invoke") && record.status !== "inactive" && !record.deprecated,
    );

    return {
      visibleAgents: visible.length,
      callableAgents: callable.length,
      degradedAgents: visible.filter((record) => record.status === "degraded").length,
      deprecatedAgents: visible.filter((record) => record.deprecated).length,
      byCapability: buildFacetCounts(visible.flatMap((record) => record.capabilities)),
      byTag: buildFacetCounts(visible.flatMap((record) => record.tags)),
      byOwner: buildFacetCounts(visible.map((record) => record.ownerTeam)),
      recentlyUpdated: visible.slice(0, cappedLimit).map(toMarketplaceSummary),
    };
  }

  recordHeartbeat(name: string, version: string, heartbeat: HeartbeatInput = {}): AgentRecord {
    const key = this.keyFor(name, version);
    const record = this.agents.get(key);

    if (!record) {
      throw new NotFoundError(`Agent ${name}@${version} was not found.`);
    }

    const timestamp = heartbeat.timestamp ?? new Date().toISOString();
    assertIsoDate(timestamp, "timestamp");

    if (heartbeat.status) {
      validateLifecycleStatus(heartbeat.status, "status");
      record.status = heartbeat.status;
    }

    record.lastHeartbeat = timestamp;
    record.updatedAt = new Date().toISOString();

    return clone(record);
  }

  private keyFor(name: string, version: string): string {
    return `${normalizeToken(name)}@@${version.trim()}`;
  }

  private records(): AgentRecord[] {
    return [...this.agents.values()];
  }

  private isAllowed(record: AgentRecord, requester: string | undefined, action: "view" | "invoke"): boolean {
    const policy = action === "invoke" ? record.accessPolicy.invokers : record.accessPolicy.viewers;
    const normalizedRequester = requester ? normalizeToken(requester) : undefined;

    if (normalizedRequester && normalizeToken(record.ownerTeam) === normalizedRequester) {
      return true;
    }

    return policy.some((entry) => {
      const normalizedEntry = normalizeToken(entry);
      return normalizedEntry === "*" || (!!normalizedRequester && normalizedEntry === normalizedRequester);
    });
  }
}

function normalizeRegistration(input: AgentCardInput): AgentRecord {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Agent registration payload is required.");
  }

  const name = requireText(input.name, "name");
  const version = requireText(input.version, "version");
  const endpoint = requireUrl(input.endpoint, "endpoint");
  const ownerTeam = requireText(input.ownerTeam, "ownerTeam");
  const supportedProtocols = normalizeStringList(input.supportedProtocols, "supportedProtocols");
  const inputTypes = normalizeStringList(input.inputTypes, "inputTypes");
  const outputTypes = normalizeStringList(input.outputTypes, "outputTypes");
  const capabilities = normalizeStringList(input.capabilities, "capabilities");
  const tags = normalizeStringList(input.tags, "tags");
  const useCases = normalizeStringList(input.useCases, "useCases");
  const authRequirements = normalizeAuth(input.authRequirements);
  const accessPolicy = normalizeAccessPolicy(input.accessPolicy);
  const status = input.status ?? "active";
  const deprecated = input.deprecated ?? false;
  const now = new Date().toISOString();

  validateLifecycleStatus(status, "status");

  if (input.lastHeartbeat) {
    assertIsoDate(input.lastHeartbeat, "lastHeartbeat");
  }

  return {
    id: randomUUID(),
    name,
    version,
    endpoint,
    supportedProtocols,
    inputTypes,
    outputTypes,
    capabilities,
    tags,
    useCases,
    ownerTeam,
    authRequirements,
    status,
    deprecated,
    accessPolicy,
    createdAt: now,
    updatedAt: now,
    ...(input.lastHeartbeat ? { lastHeartbeat: input.lastHeartbeat } : {}),
  };
}

function normalizeAuth(input: AgentCardInput["authRequirements"]): AgentRecord["authRequirements"] {
  if (!input || typeof input !== "object") {
    throw new ValidationError("authRequirements is required.");
  }

  const allowedTypes = new Set(["none", "apiKey", "oauth2", "mtls"]);
  if (!allowedTypes.has(input.type)) {
    throw new ValidationError("authRequirements.type must be one of none, apiKey, oauth2, or mtls.");
  }

  return {
    type: input.type,
    ...(input.audience ? { audience: normalizeStringList(input.audience, "authRequirements.audience") } : {}),
    ...(input.scopes ? { scopes: normalizeStringList(input.scopes, "authRequirements.scopes") } : {}),
  };
}

function normalizeAccessPolicy(input: AgentCardInput["accessPolicy"]): AgentRecord["accessPolicy"] {
  if (!input || typeof input !== "object") {
    throw new ValidationError("accessPolicy is required.");
  }

  const viewers = normalizePrincipalList(input.viewers, "accessPolicy.viewers");
  const invokers = normalizePrincipalList(input.invokers, "accessPolicy.invokers");

  return { viewers, invokers };
}

function normalizePrincipalList(values: string[], field: string): string[] {
  const items = normalizeStringList(values, field);
  if (items.length === 0) {
    throw new ValidationError(`${field} must contain at least one principal or *.`);
  }

  return items;
}

function normalizeStringList(values: string[], field: string): string[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new ValidationError(`${field} must be a non-empty array.`);
  }

  const normalized = [...new Set(values.map((value) => requireText(value, field)))];

  if (normalized.length === 0) {
    throw new ValidationError(`${field} must contain at least one item.`);
  }

  return normalized;
}

function requireText(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required.`);
  }

  return value.trim();
}

function requireUrl(value: string, field: string): string {
  const urlText = requireText(value, field);

  try {
    const url = new URL(urlText);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new ValidationError(`${field} must use http or https.`);
    }
    return url.toString();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(`${field} must be a valid URL.`);
  }
}

function validateLifecycleStatus(value: string, field: string): void {
  if (!LIFECYCLE_STATUSES.has(value)) {
    throw new ValidationError(`${field} must be one of active, inactive, degraded, or deprecated.`);
  }
}

function parsePositiveInteger(value: number | undefined, field: string, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive integer.`);
  }

  return value;
}

function includesToken(values: string[], query: string): boolean {
  const normalizedQuery = normalizeToken(query);
  return values.some((value) => normalizeToken(value) === normalizedQuery);
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function assertIsoDate(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a valid ISO-8601 timestamp.`);
  }

  if (!ISO_8601_UTC_PATTERN.test(value)) {
    throw new ValidationError(`${field} must be a valid ISO-8601 timestamp.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} must be a valid ISO-8601 timestamp.`);
  }
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    const numericDiff = leftPart - rightPart;
    if (!Number.isNaN(numericDiff) && numericDiff !== 0) {
      return numericDiff;
    }

    const leftRaw = left.split(".")[index] ?? "";
    const rightRaw = right.split(".")[index] ?? "";
    const lexicalDiff = leftRaw.localeCompare(rightRaw);
    if (Number.isNaN(leftPart) || Number.isNaN(rightPart)) {
      if (lexicalDiff !== 0) {
        return lexicalDiff;
      }
    }
  }

  return left.localeCompare(right);
}

function compareRecency(left: AgentRecord, right: AgentRecord): number {
  return recencyValue(left) - recencyValue(right);
}

function recencyValue(record: AgentRecord): number {
  return Date.parse(record.lastHeartbeat ?? record.updatedAt);
}

function buildFacetCounts(values: string[]): Array<{ value: string; count: number }> {
  const counts = new Map<string, { value: string; count: number }>();

  for (const value of values) {
    const existing = counts.get(normalizeToken(value));
    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(normalizeToken(value), {
      value,
      count: 1,
    });
  }

  return [...counts.values()].sort((left, right) => {
    const countDiff = right.count - left.count;
    return countDiff !== 0 ? countDiff : left.value.localeCompare(right.value);
  });
}

function toMarketplaceSummary(record: AgentRecord): MarketplaceAgentSummary {
  return {
    name: record.name,
    version: record.version,
    ownerTeam: record.ownerTeam,
    status: record.status,
    capabilities: [...record.capabilities],
    tags: [...record.tags],
    updatedAt: record.updatedAt,
    ...(record.lastHeartbeat ? { lastHeartbeat: record.lastHeartbeat } : {}),
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
