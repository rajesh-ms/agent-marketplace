# AGENTS.md

## Repo Map

- `src/App.tsx`: root application component
- `src/components/MarketplaceDashboard.tsx`: marketplace page layout, featured launch rail, deployment stack planner, saved-view presets, filter-aware analytics, comparison tray, linked-listing navigation, filter controls, and local UI state
- `src/lib/marketplace.ts`: pure filtering, sorting, presets, comparison, selection, relationship, stack-composition, and summary-stat helpers
- `src/data/marketplace.ts`: static typed marketplace dataset with governance and connection metadata
- `src/types.ts`: shared marketplace item and kind definitions
- `src/styles.css`: page styling, layout, and responsive rules
- `src/marketplace.test.ts`: Node test coverage for selector behavior
- `docs/architecture.md`: system layers, data flow, concurrency model, invariants
- `docs/decisions.md`: design rationale and alternatives considered

## Key Files

| File | Purpose |
| --- | --- |
| `package.json` | project metadata, dependencies, and npm scripts |
| `vite.config.ts` | Vite React configuration |
| `tsconfig.app.json` | TypeScript settings for browser code |
| `tsconfig.node.json` | TypeScript settings for tooling config |
| `src/components/MarketplaceDashboard.tsx` | main marketplace workspace, including overview cards, saved presets, filtered insight cards, compare tray, provider/category facets, kind/status/sort controls, deployment stacks, card grid, detail panel, stack context, and linked-item jumps |
| `src/lib/marketplace.ts` | deterministic selector logic for stats, filtering, presets, sorting, compare-tray state, featured items, agent stacks, and related listing resolution |
| `src/marketplace.test.ts` | regression coverage for stats, empty-result handling, filtering, provider/category facets, presets, status filtering, sorting, compare-tray behavior, fallback selection, agent stacks, and related listing resolution |

## Build And Test

- `npm install`: install dependencies
- `npm run dev`: start the Vite development server
- `npm run build`: run TypeScript checks and build the production bundle
- `npm test`: run the Node test suite through `tsx`
- `npm run test:watch`: re-run tests on change

## Architecture Summary

- The app is a client-rendered React single page with a static in-memory catalog.
- `MarketplaceDashboard` owns transient UI state for kind filter, search text, capability chip, provider/category facets, rollout status, sort mode, active preset, compared items, and selected card.
- `src/lib/marketplace.ts` centralizes selector logic so filtering, presets, sorting, compare-tray updates, featured-item ranking, stack composition, and relationship navigation stay testable outside the UI.
- No routing, server calls, global stores, or background jobs are used in this implementation.

## Constraints

- Keep the implementation in TypeScript/Node.js.
- Preserve the static dataset approach unless backend integration is explicitly requested.
- Treat `src/data/marketplace.ts` as the source of truth for rendered listings.
- Use `src/lib/marketplace.ts` for filtering, sorting, and selection rules instead of duplicating that logic in new components.
