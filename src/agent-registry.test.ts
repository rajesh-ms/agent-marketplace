import assert from "node:assert/strict";
import test from "node:test";

import { AccessDeniedError, AgentRegistry, NotFoundError, ValidationError } from "./agent-registry.js";
import type { AgentCardInput } from "./models.js";

function buildAgent(overrides: Partial<AgentCardInput> = {}): AgentCardInput {
  return {
    name: "summarizer",
    version: "1.0.0",
    endpoint: "https://agents.internal/summarizer",
    supportedProtocols: ["http", "grpc"],
    inputTypes: ["application/json"],
    outputTypes: ["application/json"],
    capabilities: ["summarization", "classification"],
    tags: ["nlp", "internal"],
    useCases: ["support", "knowledge-base"],
    ownerTeam: "platform-ai",
    authRequirements: {
      type: "oauth2",
      scopes: ["agents.invoke"],
    },
    status: "active",
    deprecated: false,
    accessPolicy: {
      viewers: ["*", "sales"],
      invokers: ["platform-ai", "sales"],
    },
    ...overrides,
  };
}

test("registers agents, searches with pagination, metadata filters, and visibility policies", () => {
  const registry = new AgentRegistry();

  registry.register(buildAgent());
  registry.register(
    buildAgent({
      name: "planner",
      version: "2.1.0",
      endpoint: "https://agents.internal/planner",
      capabilities: ["planning"],
      tags: ["automation"],
      useCases: ["operations"],
      ownerTeam: "workflow-ai",
      accessPolicy: {
        viewers: ["workflow-ai"],
        invokers: ["workflow-ai"],
      },
    }),
  );

  const publicSearch = registry.search({
    tag: "nlp",
    capability: "summarization",
    useCase: "support",
    owner: "platform-ai",
    protocol: "grpc",
    inputType: "application/json",
    outputType: "application/json",
    requester: "sales",
    page: 1,
    pageSize: 1,
  });

  assert.equal(publicSearch.total, 1);
  assert.equal(publicSearch.totalPages, 1);
  assert.equal(publicSearch.items[0]?.name, "summarizer");

  const hiddenSearch = registry.search({ requester: "sales" });
  assert.equal(hiddenSearch.total, 1);
  assert.equal(hiddenSearch.items[0]?.name, "summarizer");
});

test("resolves latest callable agent version and excludes inactive or deprecated variants", () => {
  const registry = new AgentRegistry();

  registry.register(buildAgent({ version: "1.0.0", deprecated: true }));
  registry.register(buildAgent({ version: "1.1.0", status: "inactive" }));
  registry.register(buildAgent({ version: "1.2.0", endpoint: "https://agents.internal/summarizer-v1-2" }));

  const resolved = registry.resolve("summarizer", { requester: "sales" });

  assert.equal(resolved.version, "1.2.0");
  assert.equal(resolved.endpoint, "https://agents.internal/summarizer-v1-2");
  assert.deepEqual(resolved.supportedProtocols, ["http", "grpc"]);
  assert.throws(() => registry.resolve("summarizer", { requester: "anonymous" }), AccessDeniedError);
});

test("returns not found when visible agents exist but no version is callable", () => {
  const registry = new AgentRegistry();

  registry.register(buildAgent({ version: "1.0.0", deprecated: true }));
  registry.register(buildAgent({ version: "1.1.0", status: "inactive" }));

  assert.throws(
    () => registry.resolve("summarizer", { requester: "sales" }),
    (error: unknown) => error instanceof NotFoundError && /No callable agent found/.test(error.message),
  );
});

test("updates lifecycle metadata from heartbeat events", () => {
  const registry = new AgentRegistry();
  registry.register(buildAgent({ lastHeartbeat: "2026-03-10T00:00:00.000Z" }));

  const updated = registry.recordHeartbeat("summarizer", "1.0.0", {
    timestamp: "2026-03-12T10:15:30.000Z",
    status: "degraded",
  });

  assert.equal(updated.lastHeartbeat, "2026-03-12T10:15:30.000Z");
  assert.equal(updated.status, "degraded");
});

test("validates registration payloads and missing agents", () => {
  const registry = new AgentRegistry();

  assert.throws(
    () =>
      registry.register(
        buildAgent({
          endpoint: "ftp://not-allowed",
        }),
      ),
    ValidationError,
  );

  assert.throws(() => registry.get("missing", "1.0.0"), NotFoundError);
});

test("allows anonymous discovery for public agents and rejects malformed filters", () => {
  const registry = new AgentRegistry();

  registry.register(buildAgent());
  registry.register(
    buildAgent({
      name: "planner",
      version: "2.0.0",
      endpoint: "https://agents.internal/planner",
      capabilities: ["planning"],
      tags: ["automation"],
      useCases: ["operations"],
      ownerTeam: "workflow-ai",
      accessPolicy: {
        viewers: ["workflow-ai"],
        invokers: ["workflow-ai"],
      },
    }),
  );

  const anonymousSearch = registry.search();
  assert.equal(anonymousSearch.total, 1);
  assert.equal(anonymousSearch.items[0]?.name, "summarizer");

  assert.throws(() => registry.search({ status: "broken" as never }), ValidationError);
  assert.throws(() => registry.search({ page: 0 }), ValidationError);
  assert.throws(() => registry.search({ pageSize: Number.NaN }), ValidationError);
});

test("rejects non-string or non-ISO heartbeat timestamps", () => {
  const registry = new AgentRegistry();
  registry.register(buildAgent());

  assert.throws(
    () => registry.recordHeartbeat("summarizer", "1.0.0", { timestamp: 123 as unknown as string }),
    ValidationError,
  );
  assert.throws(
    () => registry.recordHeartbeat("summarizer", "1.0.0", { timestamp: "2026-03-12 10:15:30" }),
    ValidationError,
  );
});

test("builds marketplace overview facets and recency ordering", () => {
  const registry = new AgentRegistry();

  registry.register(
    buildAgent({
      version: "1.0.0",
      lastHeartbeat: "2026-03-11T09:00:00.000Z",
    }),
  );
  registry.register(
    buildAgent({
      name: "planner",
      version: "2.0.0",
      endpoint: "https://agents.internal/planner",
      supportedProtocols: ["http"],
      inputTypes: ["application/json"],
      outputTypes: ["application/json"],
      capabilities: ["planning"],
      tags: ["automation"],
      useCases: ["operations"],
      ownerTeam: "workflow-ai",
      status: "degraded",
      accessPolicy: {
        viewers: ["*"],
        invokers: ["workflow-ai"],
      },
      lastHeartbeat: "2026-03-12T09:00:00.000Z",
    }),
  );

  const overview = registry.getMarketplaceOverview("sales", 2);

  assert.equal(overview.visibleAgents, 2);
  assert.equal(overview.callableAgents, 1);
  assert.equal(overview.degradedAgents, 1);
  assert.equal(overview.deprecatedAgents, 0);
  assert.deepEqual(
    overview.byCapability.find((facet) => facet.value === "planning"),
    { value: "planning", count: 1 },
  );
  assert.equal(overview.recentlyUpdated[0]?.name, "planner");
  assert.equal(overview.recentlyUpdated[1]?.name, "summarizer");
});
