# Agent Marketplace
Managed by Symphony orchestrator

## Agent Registry

TypeScript/Node.js service that maintains agent cards, governance metadata, and runtime resolution for the marketplace orchestration layer.

### API surface

- `POST /agents`: register an agent card with endpoint, protocols, IO types, capabilities, owner, auth, lifecycle, and access policy metadata
- `GET /agents`: search by `tag`, `capability`, `useCase`, `owner`, `status`, and `deprecated` with `page` and `pageSize`
- `GET /agents/:name?version=x.y.z`: fetch a single agent version or all visible versions for a name
- `POST /agents/:name/:version/heartbeat`: update lifecycle heartbeat and optional status
- `GET /resolve/:name?version=x.y.z&requester=team`: resolve a name to callable runtime config

### Local usage

```bash
npm install
npm test
npm run build
npm start
```
