# Architecture

## System Layers

### 1. HTTP Layer

- Implemented in `src/server.ts`.
- Accepts JSON requests, parses query parameters, routes to domain operations, and maps domain errors to HTTP status codes.
- Keeps transport concerns isolated from marketplace rules.

### 2. Domain Layer

- Implemented in `src/agent-registry.ts`.
- Owns registration validation, uniqueness checks, access policy enforcement, search filtering, version resolution, heartbeat updates, and overview aggregation.
- Returns cloned records so callers cannot mutate internal state.

### 3. Runtime Layer

- Implemented in `src/index.ts`.
- Boots the HTTP server and binds the port.

## Data Flow

```text
Client
  |
  v
HTTP route in server.ts
  |
  v
AgentRegistry method
  |
  +--> validate payload / query
  +--> enforce access policy
  +--> read or mutate in-memory Map
  +--> derive response model
  |
  v
JSON response
```

## Detailed Marketplace Diagram

The implemented code in this repository is the registry service. The broader application requested by Issue 5 also includes a marketplace UI and an MCP integration surface that displays agent and MCP metadata together. The detailed end-to-end diagram lives in `docs/data-flow-diagram.md`.

At a high level:

- The marketplace UI reads `/marketplace/overview`, `/agents`, `/agents/:name`, and `/resolve/:name` to render dashboard and detail views.
- `src/server.ts` translates HTTP requests into typed registry operations.
- `src/agent-registry.ts` remains the source of truth for agent registration, access-controlled discovery, heartbeat updates, and runtime resolution.
- MCP metadata is modeled as an adjacent integration boundary so the UI can display available MCP servers alongside agent cards without moving authorization rules into the client.
- The catalog read path is synchronous over the in-memory registry state, while MCP metadata is treated as an external feed or adapter-owned read source.

## Concurrency Model

- Single Node.js process using the event loop.
- Registry state lives in one in-memory `Map`, so operations are effectively serialized by the JavaScript runtime.
- No cross-process coordination exists in this issue scope.
- Reads derive overview and search results from current in-memory state synchronously.

## Data Model

- Primary key: normalized `name@@version`.
- Agent card fields capture:
  - endpoint and protocols
  - input and output MIME types
  - capabilities, tags, and use cases
  - owner team and auth requirements
  - lifecycle status, deprecation, timestamps
  - access policy for viewers and invokers

## Key Invariants

- Registration requires non-empty metadata arrays for supported protocols, IO types, capabilities, tags, use cases, and access principals.
- Endpoints must be valid `http` or `https` URLs.
- Each `name + version` pair is unique.
- Search results only include records the requester is allowed to view.
- Resolution only returns records the requester can invoke and that are not inactive or deprecated.
- Heartbeat timestamps must parse as ISO-8601 timestamps.
- Marketplace overview only reflects agents visible to the requester.
- Returned objects are cloned before leaving the registry to prevent external mutation of internal state.

## Error Mapping

- `400`: malformed payloads or invalid filter values.
- `403`: requester lacks permission for the requested action.
- `404`: route missing, agent missing, or no callable version remains after lifecycle filtering.
- `409`: duplicate registration attempt.
- `500`: unexpected internal failure.

## Future Evolution

- Introduce a repository interface and durable backing store.
- Add authenticated write APIs and audit logging.
- Split overview aggregation into a cached read model if catalog size grows materially.
- Replace the documented MCP integration boundary with a first-class implementation once MCP registry contracts are finalized.
