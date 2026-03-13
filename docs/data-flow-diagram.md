# Marketplace Data Flow Diagram

This document describes the detailed AI Marketplace data flow that the repository supports today at the registry layer and the documented application-level integration expected by the issue scope. The implemented code in `src/` is the marketplace registry service. The UI and MCP components shown below are the surrounding application context that consume and contribute marketplace data.

## End-to-End Data Flow

```mermaid
flowchart LR
    user[Marketplace user]
    admin[Agent publisher]
    operator[MCP operator]
    runtime[Registered agent runtime]

    subgraph ui[Marketplace UI]
        dashboard[Catalog dashboard]
        detail[Agent or MCP detail view]
    end

    subgraph api[Marketplace API]
        routes[HTTP routes<br/>src/server.ts]
        overview[Overview and search responses]
    end

    subgraph domain[Registry domain]
        registry[AgentRegistry<br/>src/agent-registry.ts]
        catalog[(Agent catalog Map)]
    end

    subgraph mcp[MCP integration]
        adapter[MCP integration adapter]
        mcpRegistry[MCP registry / MCP servers]
    end

    subgraph runtimes[Callable systems]
        endpoints[Agent endpoints]
    end

    user -->|browse marketplace| dashboard
    dashboard -->|GET /marketplace/overview| routes
    dashboard -->|GET /agents with filters| routes
    detail -->|GET /agents/:name or GET /resolve/:name| routes

    routes -->|parse request, map query params| registry
    registry -->|read visible agent records| catalog
    catalog -->|agent cards, lifecycle, auth, tags| registry
    registry -->|derive overview, search results, resolution| overview
    overview -->|JSON payloads for cards and facets| dashboard
    overview -->|selected record payload| detail

    admin -->|POST /agents register agent card| routes
    routes -->|validated AgentCardInput| registry
    registry -->|create normalized record| catalog

    runtime -->|POST /agents/:name/:version/heartbeat| routes
    routes -->|HeartbeatInput| registry
    registry -->|update status and timestamps| catalog

    operator -->|publish MCP server metadata| mcpRegistry
    adapter -->|fetch or sync MCP metadata| mcpRegistry
    dashboard -->|request visible MCP catalog| adapter
    adapter -->|normalized MCP cards and server capabilities| dashboard

    detail -->|invoke-capable selection| routes
    routes -->|resolve(name, requester, action)| registry
    registry -->|authorized callable endpoint| endpoints
    endpoints -->|runtime execution response| detail
```

## Key Flows

### 1. Catalog display flow

1. The marketplace UI loads the dashboard.
2. The UI requests `/marketplace/overview` for summary counts and facets and `/agents` for paginated agent cards.
3. `src/server.ts` parses query parameters and delegates to `AgentRegistry`.
4. `src/agent-registry.ts` enforces viewer access, reads the in-memory catalog, and builds search or overview payloads.
5. In parallel, the UI reads MCP server metadata through the MCP integration adapter so the screen can display both registered agents and available MCP integrations.

### 2. Agent registration flow

1. A publisher submits an agent card to `POST /agents`.
2. The HTTP layer validates that JSON exists and forwards the payload.
3. The registry normalizes fields, validates URLs, lifecycle state, ACLs, and uniqueness.
4. The normalized record is written to the catalog `Map`.
5. Subsequent overview and search requests immediately expose the new agent if the requester is allowed to view it.

### 3. Health and lifecycle flow

1. A registered agent runtime posts to `/agents/:name/:version/heartbeat`.
2. The registry validates the timestamp, optionally updates lifecycle state, and stores `lastHeartbeat` and `updatedAt`.
3. Dashboard overview responses use this data to highlight degraded or recently updated agents.

### 4. Resolution and invocation flow

1. The UI opens an agent or MCP detail view and requests `/resolve/:name`.
2. The registry filters matching versions by requester authorization, excludes inactive and deprecated entries, and returns the highest callable version.
3. The UI or an orchestrator uses the resolved endpoint and auth requirements to invoke the selected runtime.

## Data Ownership

- The agent registry is the source of truth for registered agent cards, lifecycle metadata, auth requirements, and access policy.
- MCP metadata is sourced from the integrated MCP registry or MCP servers and displayed alongside agent records in the marketplace UI.
- The UI is a read model consumer. It should not infer authorization locally and instead relies on filtered server responses.
