# Design Decisions

## 1. React + Vite for a Greenfield UI

Chosen because the workspace started nearly empty and the requirement was a TypeScript/Node.js implementation. Vite provides a minimal setup with fast local iteration and a straightforward production build for a single-page React interface.

Alternatives considered:

- Plain TypeScript with DOM APIs: lower dependency count, but slower to extend and maintain for an interactive UI.
- Next.js: heavier than required for a single-page marketplace prototype without routing or server rendering needs.

## 2. Static Marketplace Dataset

Chosen to keep the feature self-contained and working without an API dependency. This keeps the repository runnable in isolation and makes tests deterministic.

Alternatives considered:

- Mock fetch layer: closer to production integration, but unnecessary complexity for the issue scope.
- JSON fixtures outside TypeScript: workable, but weaker type safety for a greenfield setup.

## 3. Local UI State With Extracted Selector Helpers

Chosen because the interaction model is limited to filter, sort, search, and select. `MarketplaceDashboard` owns transient UI state, while `src/lib/marketplace.ts` keeps filtering, sorting, summary, and fallback-selection logic pure and directly testable.

Alternatives considered:

- Keeping all logic inside the component: workable, but harder to test and easier to duplicate.
- Global state store: unnecessary overhead with no cross-page state or deep component tree.
- Route-based detail views: useful for sharable URLs, but not required by the current task.

## 4. Node Test Runner Instead Of Browser-Centric UI Tests

Chosen because the main regression surface for this issue is marketplace selector behavior, not complex DOM integration. Node's built-in test runner plus `tsx` keeps the test stack small and validates the core business rules directly, including status-filter and sort-order behavior.

Alternatives considered:

- Vitest and Testing Library: stronger for browser interaction tests, but added tooling without improving coverage for the current issue's main logic.
- No tests: faster initially, but weakens confidence around filter combinations and selection fallback rules.

## 5. Marketplace View Focused on Trust and Capability Signals

Chosen because AI marketplace decisions usually depend on operational characteristics beyond a name and description. Trust score, latency, status, capability chips, and governance checks make the catalog more useful than a plain list.

Alternatives considered:

- Minimal card grid only: simpler, but materially weaker for comparing listings.
- Table-only layout: denser, but less effective for a mixed marketplace of agents and MCP surfaces.

## 6. Explicit Agent-to-MCP Relationship Modeling

Chosen because the issue asks for a marketplace that shows both agents and MCPs, and the most useful UI explains how those listings fit together. Storing `linkedItemIds` directly in the dataset enables connected-listing navigation and keeps the relationship model trivial to understand.

Alternatives considered:

- Separate relationship table: more normalized, but unnecessary for a small static catalog.
- No relationship model: easier to implement, but it misses the most important cross-entity context in an agent marketplace.

## 7. Dedicated Deployment Stack View

Chosen because catalog browsing alone does not answer a common operator question: which MCP surfaces ship with a given agent. A dedicated stack rail exposes those bundles directly, lets users jump into either side of the relationship, and reuses the same typed linkage model already present in the dataset.

Alternatives considered:

- Showing stacks only inside the detail panel: saves space, but hides useful composition context until after selection.
- Separate page for stacks: clearer information architecture, but unnecessary overhead for a single-screen marketplace.

## 8. Filter-Aware Insight Strip Inside The Catalog

Chosen because once the user narrows the marketplace, the global hero metrics stop being the most relevant frame of reference. Deriving trust, rollout mix, top category, and freshest listing from the filtered slice makes the UI explain the current result set instead of only the full dataset.

Alternatives considered:

- Global-only metrics: simpler, but weaker when filters materially change the slice.
- No slice analytics: acceptable for a tiny catalog, but it misses one of the main benefits of keeping selector logic pure and reusable.

## 9. Bounded Comparison Tray

Chosen because marketplace browsing often ends in a decision between a small number of viable candidates. A capped compare tray keeps that workflow on the same screen, avoids a separate page, and fits naturally with the existing card and detail interactions.

Alternatives considered:

- Unlimited compare list: flexible, but harder to scan and more awkward on smaller screens.
- Dedicated compare page: clearer for very large catalogs, but unnecessary friction for this issue's compact marketplace.

## 10. Preset-Driven Marketplace Slices

Chosen because operator workflows in an AI marketplace are often repetitive: launch review, knowledge validation, and observability-driven triage are common starting points. Exposing reusable presets in the UI turns those slices into one-click entry points while still keeping the underlying filter logic explicit and testable.

Alternatives considered:

- Manual filters only: simpler UI, but slower for recurring workflows.
- Hard-coded tabs with custom logic: workable, but duplicates behavior that is cleaner as typed preset definitions.

## 11. Exact-Match Provider And Category Facets

Chosen because marketplace users often need to answer inventory questions like "show me everything from Marketplace Verified" or "show me all knowledge surfaces" without relying on fuzzy search terms. Exact-match facets make those slices deterministic, compose cleanly with presets and status filters, and fit naturally inside the existing selector layer.

Alternatives considered:

- Search-only filtering: simpler, but inconsistent for repeated operational checks and easy to miss due to wording differences.
- Multi-select faceting: more flexible, but unnecessary complexity for the current static catalog size.
