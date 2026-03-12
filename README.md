# Agent Marketplace UI

This project implements Issue 3 for the AI Agent Marketplace. It delivers a responsive TypeScript/React workspace for browsing AI agents and MCP servers, understanding their rollout state, and navigating the links between agents and the MCP surfaces they depend on.

## Features

- Hero section with marketplace metrics and featured launches
- Overview strip for rollout mix, category concentration, and governance posture
- Segmented filter for `All Listings`, `Agents`, and `MCP Servers`
- Free-text search across name, provider, category, description, and tags
- Saved workspace presets for launch-ready, knowledge, and ops-focused slices
- Capability chip filters for common marketplace workflows
- Provider and category facets for narrowing the catalog without search-only matching
- Rollout-status filter and catalog sorting by trust, freshness, or name
- Filter-aware insight cards that summarize trust, rollout mix, top category, and freshest listing for the current slice
- Comparison tray for pinning up to three agents or MCP servers side by side
- Master-detail layout with selectable cards and a live detail panel
- Deployment stack rail that groups each agent with its linked MCP servers
- Detail-pane stack context for the selected agent or MCP
- Related-listing navigation between agents and linked MCP servers
- Governance checklist, ownership metadata, and update timestamps on each listing
- Pure selector utilities with Node-based tests for filtering, sorting, stats, comparison state, selection fallback, related listing resolution, and agent-stack composition

## Tech Stack

- Node.js
- TypeScript
- React 19
- Vite
- Node test runner with `tsx`

## Setup

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Vite serves the marketplace UI locally for interactive development.

## Build

```bash
npm run build
```

This runs TypeScript type-checking for both app and tooling configs, then produces a production bundle.

## Test

```bash
npm test
```

The test suite uses Node's built-in runner to validate selector behavior in `src/lib/marketplace.ts`, including zero-safe stats, compare-tray behavior, provider/category filtering, reusable presets, status filtering, sort order, related listing resolution, and agent-stack composition across linked agents and MCP servers.

## Usage

1. Open the marketplace and review the hero metrics, featured launches, and overview cards.
2. Switch between `All Listings`, `Agents`, and `MCP Servers`.
3. Search by listing name, provider, category, description, or tags.
4. Apply a saved workspace preset such as `Launch-ready` or `Knowledge surfaces` to jump into common operator views.
5. Narrow results with capability chips such as `Workflow routing` or `Source citation`, then refine by provider, category, and rollout status.
6. Reorder the catalog by trust score, recent updates, or alphabetical name.
7. Review the `Deployment stacks` rail to see which MCP servers ship with each agent, then jump directly into the linked records.
8. Use `Compare` on listing cards or `Add to compare` in the detail pane to pin up to three records side by side.
9. Select a card to inspect owner, provider, latency, last-updated date, governance checks, tags, and the deployment stack around that listing.
10. Use `Connected listings` in the detail pane to jump between agents and the MCP servers they integrate with.
