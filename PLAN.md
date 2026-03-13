## User story summary

Issue 3 asks for an AI marketplace UI that presents both agents and MCP servers in a single browsable workspace. The implementation should make the catalog usable from the frontend alone, using the static marketplace dataset as the source of truth and the selector library for filtering, sorting, comparison, and detail navigation.

## Acceptance criteria checklist

- [x] create UI for AI Market place to show agents, mcp

## Implementation plan

- `src/data/marketplace.ts`: keep the static marketplace catalog for both agent and MCP listings.
- `src/lib/marketplace.ts`: centralize filtering, sorting, summary, comparison, relationship, and context-pivot logic so UI behavior stays deterministic and testable.
- `src/components/MarketplaceDashboard.tsx`: render the marketplace workspace, including overview metrics, filters, summary lanes, cards, compare tray, and detail panel interactions for agents and MCP servers.
- `src/styles.css`: provide the responsive styling for the dashboard panels, grids, cards, controls, and detail views.
- `src/marketplace.test.ts`: cover selector behavior and regressions for filtering, focus/navigation, summaries, and other catalog interactions.
- Verification: run `npm test` and `npm run build` after confirming whether additional code changes are necessary.

## Assumptions

- The ADO issue body is not available in this session because the provided `ado_api` tool returns `unsupported_tool_call`, so the acceptance criteria are inferred from the issue title supplied in the task.
- The existing uncommitted marketplace changes in the workspace are prior implementation progress for this same issue and should be preserved unless verification shows a defect.
- A static in-memory catalog is acceptable for this issue because the repository instructions explicitly prohibit backend integration unless requested.
