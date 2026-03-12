# Architecture

## System Layers

1. Presentation layer
   React components render the marketplace hero, featured launch rail, overview strip, deployment stack rail, saved-view preset cards, filter-aware insight cards, comparison tray, segmented controls, provider/category facets, capability chips, card grid, and detail pane.
2. State layer
   `MarketplaceDashboard` stores the current kind filter, search text, capability filter, provider/category facets, rollout-status filter, sort mode, active preset, compared item ids, and selected card in local React state.
3. Domain helper layer
   `src/lib/marketplace.ts` computes aggregate stats, featured listings, agent deployment stacks, unique provider/category options, reusable presets, related connections, filtered result sets, sorted catalog output, compare-tray state transitions, and the selected-item fallback.
4. Data layer
   A static TypeScript dataset provides marketplace listings for agents and MCP servers, including governance rules, ownership, and cross-listing links.

## Data Flow

```text
marketplaceItems
      |
      +--> getMarketplaceStats --------------------> hero metrics
      |
      +--> getFeaturedItems -----------------------> featured launch rail
      |
      +--> getAgentStacks -------------------------> deployment stack rail
      |
      +--> defaultProviders/defaultCategories ----> facet controls
      |
      +--> marketplaceViewPresets ----------------> saved-view preset cards
      |
      +--> getStatusSummary/getTopCategories ------> overview strip
      |
      +--> MarketplaceDashboard state
             - kindFilter
             - searchValue
             - activeCapability
             - providerFilter
             - categoryFilter
             - statusFilter
             - sortBy
             - activePresetId
             - comparedIds
             - selectedId
                    |
                    v
           filterMarketplaceItems
                    |
                    v
            sortMarketplaceItems
                    |
                    +--> getMarketplaceStats/getStatusSummary/getTopCategories ---> filtered insight cards
                    |
                    +--> getComparedItems ---------------------------------------> comparison tray
                    |
                    +--> catalog card grid
                    |
                    +--> resolveSelectedItem
                              |
                              +--> activeStack -------> detail stack context
                              |
                              +--> getRelatedItems ---> connected listings
                              |
                              v
                         detail panel
```

## Concurrency Model

- The UI is fully client-side and single-threaded in the browser event loop.
- React batches state updates from user interactions such as tab clicks, search changes, and card selection.
- Selector helpers are synchronous and side-effect free, so renders remain deterministic.
- No background polling, server fetches, or worker threads are used in this implementation.

## Key Invariants

- Every listing must be either `agent` or `mcp`.
- Aggregate hero metrics are derived from the same source dataset as the catalog.
- Featured launches, deployment stacks, and connected listings are derived from the same source dataset as the catalog.
- The detail panel should always show the selected listing if it is still present in the filtered result set.
- If a filter removes the selected listing, the detail panel falls back to the first visible result.
- Search, capability, and rollout-status filters must apply consistently to both agents and MCP listings.
- Provider and category facets must behave as exact-match filters on the same source dataset as the rest of the catalog controls.
- Each deployment stack must contain exactly one agent and only the MCP records linked from that agent.
- The compare tray preserves insertion order and caps the pinned set at three listings.
