# AI Marketplace

Lightweight TypeScript/Node.js service for registering AI agents, enforcing marketplace access policies, searching the catalog, recording health heartbeats, and resolving a logical agent name to a callable runtime endpoint.

## What It Does

- Registers agent cards with endpoint, protocol, IO, capability, ownership, auth, and access metadata.
- Searches the marketplace with filters for capability, tag, use case, owner, protocol, input type, output type, lifecycle state, and deprecation.
- Resolves the latest callable version for a requester while excluding inactive or deprecated variants.
- Records heartbeat events so the marketplace can surface freshness and degraded agents.
- Exposes a marketplace overview endpoint with summary metrics, facets, and recently updated agents.

## Project Structure

```text
src/
  agent-registry.ts   In-memory domain service and validation
  models.ts           Shared marketplace types
  server.ts           HTTP routing and request parsing
  index.ts            Runtime entrypoint
docs/
  architecture.md     System design and invariants
  decisions.md        Design rationale and alternatives
AGENTS.md             Repo navigation guide for AI agents
```

## Setup

```bash
npm install
npm test
npm run build
```

Run locally:

```bash
npm run dev
```

Or run the compiled server:

```bash
npm run build
npm start
```

The server listens on `PORT`, defaulting to `3000`.

## API

### Register an Agent

```bash
curl -X POST http://localhost:3000/agents \
  -H 'content-type: application/json' \
  -d '{
    "name": "translator",
    "version": "3.0.0",
    "endpoint": "https://agents.internal/translator",
    "supportedProtocols": ["http"],
    "inputTypes": ["text/plain"],
    "outputTypes": ["text/plain"],
    "capabilities": ["translation"],
    "tags": ["language", "public"],
    "useCases": ["customer-support"],
    "ownerTeam": "language-ai",
    "authRequirements": {
      "type": "apiKey",
      "audience": ["marketplace-clients"]
    },
    "status": "active",
    "deprecated": false,
    "accessPolicy": {
      "viewers": ["*"],
      "invokers": ["support-app", "language-ai"]
    }
  }'
```

### Search the Marketplace

```bash
curl 'http://localhost:3000/agents?capability=translation&protocol=http&requester=support-app'
```

### Resolve a Callable Agent

```bash
curl 'http://localhost:3000/resolve/translator?requester=support-app'
```

### Record a Heartbeat

```bash
curl -X POST http://localhost:3000/agents/translator/3.0.0/heartbeat \
  -H 'content-type: application/json' \
  -d '{
    "timestamp": "2026-03-12T11:00:00.000Z",
    "status": "active"
  }'
```

### Get Marketplace Overview

```bash
curl 'http://localhost:3000/marketplace/overview?requester=support-app&limit=5'
```

Example response shape:

```json
{
  "visibleAgents": 4,
  "callableAgents": 3,
  "degradedAgents": 1,
  "deprecatedAgents": 0,
  "byCapability": [{ "value": "translation", "count": 2 }],
  "byTag": [{ "value": "public", "count": 3 }],
  "byOwner": [{ "value": "language-ai", "count": 2 }],
  "recentlyUpdated": [
    {
      "name": "translator",
      "version": "3.0.0",
      "ownerTeam": "language-ai",
      "status": "active",
      "capabilities": ["translation"],
      "tags": ["language", "public"],
      "updatedAt": "2026-03-12T11:00:00.000Z",
      "lastHeartbeat": "2026-03-12T11:00:00.000Z"
    }
  ]
}
```

## Quality Gates

- `npm test`: unit and HTTP integration coverage using the Node test runner.
- `npm run check`: TypeScript static validation without emitting build output.
- `npm run build`: compile to `dist/`.

## Notes

- Storage is intentionally in-memory for this issue scope.
- Access policy evaluation is enforced for both search visibility and runtime resolution.
- Resolution distinguishes between authorization failures and agents that exist but have no callable active version.
