# AGENTS.md

## Repo Map

- `src/models.ts`: shared types for agent cards, search filters, resolution, heartbeat, and marketplace overview.
- `src/agent-registry.ts`: core domain service, validation, filtering, access control, and overview aggregation.
- `src/server.ts`: HTTP route handling and request/response serialization.
- `src/index.ts`: process entrypoint that starts the HTTP server.
- `src/agent-registry.test.ts`: unit tests for registry behavior.
- `src/server.test.ts`: HTTP integration tests for end-to-end API coverage.
- `docs/architecture.md`: architecture summary, data flow, invariants, concurrency model.
- `docs/data-flow-diagram.md`: detailed marketplace-level data flow across UI, MCP integration, registry, and runtime endpoints.
- `docs/decisions.md`: design tradeoffs and alternatives considered.

## Key Files

| File | Purpose | Change Risk |
| --- | --- | --- |
| `src/agent-registry.ts` | Business logic for registration, search, resolve, heartbeat, overview | High |
| `src/server.ts` | Route parsing and API contract | High |
| `src/models.ts` | Shared type contract across the service | Medium |
| `src/*.test.ts` | Regression protection for domain and HTTP behavior | Medium |

## Build And Test

- Install: `npm install`
- Type-check: `npm run check`
- Test: `npm test`
- Build: `npm run build`
- Run locally: `npm run dev`

## Architecture Summary

- Single-process Node HTTP service.
- In-memory `Map` keyed by normalized `name@@version`.
- Domain layer owns validation and authorization decisions.
- HTTP layer stays thin and only translates query params, request bodies, and errors.
- Marketplace overview is a derived read model built on demand from current in-memory records.
- `docs/data-flow-diagram.md` documents the broader application context around the implemented service, including marketplace UI and MCP integration boundaries.

## Agent Constraints

- Keep the service dependency-light unless persistence or framework-level middleware becomes necessary.
- Preserve strict TypeScript settings.
- Use `apply_patch` for file edits.
- Do not bypass access policy checks when adding new read or resolve behavior.
- Preserve the distinction between:
  - `403`: agent exists but requester cannot perform the action.
  - `404`: no matching agent exists or no callable version remains after lifecycle filtering.

## Extension Points

- Replace the in-memory registry with a repository interface if persistence is added.
- Add richer ranking or trust signals to `getMarketplaceOverview()` if marketplace curation becomes a requirement.
- Add write-side authentication and audit events before exposing this beyond internal development use.
