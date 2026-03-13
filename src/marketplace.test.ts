import test from 'node:test';
import assert from 'node:assert/strict';
import { marketplaceItems } from './data/marketplace';
import {
  defaultAgentStacks,
  defaultCapabilities,
  defaultCategories,
  defaultMarketplaceStats,
  defaultProviders,
  filterMarketplaceItems,
  getContextFiltersForItem,
  getContextFiltersForItems,
  getFocusFiltersForItem,
  getFacetOptionCounts,
  getAgentStacks,
  getCompareInsights,
  getCompareWorkspaceSummary,
  getComparedItems,
  getFreshestItem,
  getKindOptionCounts,
  getMatchingMarketplacePreset,
  getMarketplaceCounterpartPreview,
  getMarketplaceKindSummaries,
  getRelationshipContext,
  getRelationshipPreview,
  getMarketplaceStats,
  getMarketplaceSurfaceMap,
  getRelatedItems,
  getStatusOptionCounts,
  isMarketplaceItemVisible,
  marketplaceViewPresets,
  parseLatencyMs,
  parseMarketplaceDate,
  resolveSelectedItem,
  sortMarketplaceItems,
  toggleComparedItem
} from './lib/marketplace';

const baseFilters = {
  kindFilter: 'all' as const,
  searchValue: '',
  activeCapability: 'All',
  statusFilter: 'all' as const,
  providerFilter: 'All providers',
  categoryFilter: 'All categories'
};

test('computes marketplace stats for agents and MCP servers', () => {
  assert.equal(defaultMarketplaceStats.agents, 3);
  assert.equal(defaultMarketplaceStats.mcps, 3);
  assert.equal(defaultMarketplaceStats.averageTrust, 92);
});

test('returns zeroed marketplace stats for an empty result set', () => {
  assert.deepEqual(getMarketplaceStats([]), {
    agents: 0,
    mcps: 0,
    averageTrust: 0,
    liveConnections: 0
  });
});

test('builds per-kind summaries for the current marketplace slice', () => {
  const summaries = getMarketplaceKindSummaries(marketplaceItems);
  const agentSummary = summaries.find((summary) => summary.kind === 'agent');
  const mcpSummary = summaries.find((summary) => summary.kind === 'mcp');

  assert.ok(agentSummary);
  assert.ok(mcpSummary);
  assert.equal(agentSummary.count, 3);
  assert.equal(agentSummary.averageTrust, 91);
  assert.equal(agentSummary.topListing?.name, 'Deal Desk Analyst');
  assert.equal(mcpSummary.count, 3);
  assert.equal(mcpSummary.averageTrust, 92);
  assert.equal(mcpSummary.topListing?.name, 'Salesforce MCP');
});

test('returns empty kind summaries when a filtered slice excludes a kind entirely', () => {
  const mcpOnly = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'mcp',
    providerFilter: 'Marketplace Verified'
  });
  const summaries = getMarketplaceKindSummaries(mcpOnly);
  const agentSummary = summaries.find((summary) => summary.kind === 'agent');
  const mcpSummary = summaries.find((summary) => summary.kind === 'mcp');

  assert.ok(agentSummary);
  assert.ok(mcpSummary);
  assert.equal(agentSummary.count, 0);
  assert.equal(agentSummary.topListing, null);
  assert.equal(mcpSummary.count, 2);
  assert.equal(mcpSummary.readyCount, 1);
});

test('builds a counterpart preview for the hidden kind under the current slice', () => {
  const agentSlice = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'all',
    providerFilter: 'Marketplace Verified'
  });
  const preview = getMarketplaceCounterpartPreview(agentSlice, 'agent', 1);

  assert.ok(preview);
  assert.equal(preview.counterpartKind, 'mcp');
  assert.deepEqual(preview.visibleItems.map((item) => item.name), ['Salesforce MCP']);
  assert.equal(preview.remainingCount, 1);
});

test('returns null counterpart preview for the unified kind view', () => {
  assert.equal(getMarketplaceCounterpartPreview(marketplaceItems, 'all'), null);
});

test('filters listings by kind, text search, and capability', () => {
  const mcpOnly = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'mcp',
    searchValue: 'confluence',
    activeCapability: 'Source citation'
  });

  assert.equal(mcpOnly.length, 1);
  assert.equal(mcpOnly[0]?.name, 'Confluence MCP');
});

test('falls back to the first visible listing when the selected item is not present', () => {
  const supportItems = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'agent',
    searchValue: 'support'
  });
  const resolved = resolveSelectedItem(supportItems, 'missing-id');

  assert.equal(resolved?.name, 'Support Triage Copilot');
});

test('detects whether a navigation target is visible in the current filtered slice', () => {
  const supportItems = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'agent',
    searchValue: 'support'
  });

  assert.equal(isMarketplaceItemVisible(supportItems, 'agent-support-triage'), true);
  assert.equal(isMarketplaceItemVisible(supportItems, 'mcp-docs'), false);
});

test('preserves matching filters when focusing a hidden listing', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'mcp-docs');
  assert.ok(targetItem);

  const nextFilters = getFocusFiltersForItem(targetItem, {
    ...baseFilters,
    kindFilter: 'agent',
    statusFilter: 'Scaling',
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'Knowledge'
  });

  assert.deepEqual(nextFilters, {
    kindFilter: 'all',
    searchValue: '',
    activeCapability: 'All',
    statusFilter: 'Scaling',
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'Knowledge'
  });
});

test('clears only the filters that block the focused listing', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'agent-risk-ops');
  assert.ok(targetItem);

  const nextFilters = getFocusFiltersForItem(targetItem, {
    ...baseFilters,
    searchValue: 'support',
    activeCapability: 'Source citation',
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'Compliance',
    statusFilter: 'Pilot'
  });

  assert.deepEqual(nextFilters, {
    kindFilter: 'all',
    searchValue: '',
    activeCapability: 'All',
    statusFilter: 'Pilot',
    providerFilter: 'All providers',
    categoryFilter: 'Compliance'
  });
});

test('applies a detail pivot while preserving the selected listing when possible', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'mcp-docs');
  assert.ok(targetItem);

  const nextFilters = getContextFiltersForItem(
    targetItem,
    {
      ...baseFilters,
      searchValue: 'confluence',
      statusFilter: 'Scaling',
      providerFilter: 'Symphony Core',
      categoryFilter: 'Support'
    },
    {
      providerFilter: 'Marketplace Verified'
    }
  );

  assert.deepEqual(nextFilters, {
    kindFilter: 'all',
    searchValue: 'confluence',
    activeCapability: 'All',
    statusFilter: 'Scaling',
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'All categories'
  });
});

test('detail pivots clear only the conflicting filters after applying explicit overrides', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'agent-support-triage');
  assert.ok(targetItem);

  const nextFilters = getContextFiltersForItem(
    targetItem,
    {
      ...baseFilters,
      kindFilter: 'mcp',
      searchValue: 'support',
      activeCapability: 'Source citation',
      statusFilter: 'Ready',
      providerFilter: 'Marketplace Verified',
      categoryFilter: 'Support'
    },
    {
      activeCapability: 'Priority prediction'
    }
  );

  assert.deepEqual(nextFilters, {
    kindFilter: 'all',
    searchValue: 'support',
    activeCapability: 'Priority prediction',
    statusFilter: 'Ready',
    providerFilter: 'All providers',
    categoryFilter: 'Support'
  });
});

test('detail status pivots preserve the selected listing while clearing incompatible filters', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'mcp-observability');
  assert.ok(targetItem);

  const nextFilters = getContextFiltersForItem(
    targetItem,
    {
      ...baseFilters,
      kindFilter: 'mcp',
      searchValue: 'datadog',
      activeCapability: 'Alert history',
      statusFilter: 'Ready',
      providerFilter: 'Telemetry Works',
      categoryFilter: 'Observability'
    },
    {
      statusFilter: 'Pilot'
    }
  );

  assert.deepEqual(nextFilters, {
    kindFilter: 'mcp',
    searchValue: 'datadog',
    activeCapability: 'Alert history',
    statusFilter: 'Pilot',
    providerFilter: 'Telemetry Works',
    categoryFilter: 'Observability'
  });
});

test('revealing linked listings clears only filters that conflict with the selected relationship cluster', () => {
  const targetItem = marketplaceItems.find((item) => item.id === 'mcp-docs');
  assert.ok(targetItem);

  const relatedCluster = [targetItem, ...getRelatedItems(marketplaceItems, targetItem)];
  const nextFilters = getContextFiltersForItems(targetItem, relatedCluster, {
    ...baseFilters,
    kindFilter: 'mcp',
    searchValue: 'confluence',
    activeCapability: 'Source citation',
    statusFilter: 'Scaling',
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'Knowledge'
  });

  assert.deepEqual(nextFilters, {
    kindFilter: 'all',
    searchValue: '',
    activeCapability: 'All',
    statusFilter: 'all',
    providerFilter: 'All providers',
    categoryFilter: 'All categories'
  });
});

test('filters listings by rollout status', () => {
  const readyItems = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    statusFilter: 'Ready'
  });

  assert.deepEqual(
    readyItems.map((item) => item.name).sort(),
    ['Salesforce MCP', 'Support Triage Copilot']
  );
});

test('derives the active preset from matching filters and sort mode', () => {
  const preset = marketplaceViewPresets.find((entry) => entry.id === 'knowledge-surfaces');
  assert.ok(preset);

  assert.equal(getMatchingMarketplacePreset(preset.filters, preset.sortBy)?.id, preset.id);
});

test('does not derive a preset when the workspace deviates from preset sort or filters', () => {
  const preset = marketplaceViewPresets.find((entry) => entry.id === 'launch-ready');
  assert.ok(preset);

  assert.equal(getMatchingMarketplacePreset(preset.filters, 'updated'), null);
  assert.equal(
    getMatchingMarketplacePreset(
      {
        ...preset.filters,
        searchValue: 'sales'
      },
      preset.sortBy
    ),
    null
  );
});

test('derives kind counts from the current filtered slice while excluding the active kind itself', () => {
  const kindCounts = getKindOptionCounts(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'agent',
    providerFilter: 'Marketplace Verified'
  });

  assert.deepEqual(kindCounts, [
    { value: 'agent', count: 0 },
    { value: 'mcp', count: 2 }
  ]);
});

test('derives status counts from the current filtered slice while excluding the active status itself', () => {
  const statusCounts = getStatusOptionCounts(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'mcp',
    activeCapability: 'Source citation',
    statusFilter: 'Pilot'
  });

  assert.deepEqual(statusCounts, [
    { value: 'Ready', count: 0 },
    { value: 'Scaling', count: 1 },
    { value: 'Pilot', count: 0 }
  ]);
});

test('returns related MCPs or agents for the selected listing', () => {
  const selectedItem = marketplaceItems.find((item) => item.id === 'agent-support-triage');
  assert.ok(selectedItem);

  const related = getRelatedItems(marketplaceItems, selectedItem);

  assert.deepEqual(
    related.map((item) => item.name).sort(),
    ['Confluence MCP', 'Datadog MCP']
  );
});

test('sorts listings by most recently updated first', () => {
  const sorted = sortMarketplaceItems(marketplaceItems, 'updated');

  assert.equal(sorted[0]?.name, 'Salesforce MCP');
  assert.equal(sorted[1]?.name, 'Support Triage Copilot');
});

test('derives the freshest listing independently of the active catalog sort order', () => {
  const trustSorted = sortMarketplaceItems(marketplaceItems, 'trust');

  assert.equal(trustSorted[0]?.name, 'Salesforce MCP');
  assert.equal(getFreshestItem(trustSorted)?.name, 'Salesforce MCP');

  const nameSorted = sortMarketplaceItems(marketplaceItems, 'name');

  assert.equal(nameSorted[0]?.name, 'Confluence MCP');
  assert.equal(getFreshestItem(nameSorted)?.name, 'Salesforce MCP');
});

test('builds agent stacks with linked MCP servers', () => {
  const stacks = getAgentStacks(marketplaceItems);

  assert.equal(defaultAgentStacks.length, 3);
  assert.equal(stacks[0]?.agent.name, 'Deal Desk Analyst');
  assert.deepEqual(
    stacks[0]?.mcps.map((item) => item.name).sort(),
    ['Confluence MCP', 'Salesforce MCP']
  );
});

test('builds a surface map for both agent dependencies and MCP consumers', () => {
  const surfaceMap = getMarketplaceSurfaceMap(marketplaceItems);

  assert.equal(surfaceMap.agentRows[0]?.item.name, 'Deal Desk Analyst');
  assert.deepEqual(
    surfaceMap.agentRows[0]?.connectedItems.map((item) => item.name),
    ['Salesforce MCP', 'Confluence MCP']
  );
  assert.equal(surfaceMap.mcpRows[0]?.item.name, 'Confluence MCP');
  assert.deepEqual(
    surfaceMap.mcpRows[0]?.connectedItems.map((item) => item.name),
    ['Deal Desk Analyst', 'Support Triage Copilot', 'Risk Ops Sentinel']
  );
});

test('limits the surface map to connections that remain visible in the current slice', () => {
  const knowledgeSlice = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'all',
    activeCapability: 'Source citation'
  });
  const surfaceMap = getMarketplaceSurfaceMap(knowledgeSlice);

  assert.equal(surfaceMap.agentRows.length, 0);
  assert.equal(surfaceMap.mcpRows.length, 1);
  assert.equal(surfaceMap.mcpRows[0]?.item.name, 'Confluence MCP');
  assert.deepEqual(surfaceMap.mcpRows[0]?.connectedItems, []);
});

test('builds relationship previews with a visible limit and overflow count', () => {
  const selectedItem = marketplaceItems.find((item) => item.id === 'mcp-docs');
  assert.ok(selectedItem);

  const preview = getRelationshipPreview(marketplaceItems, selectedItem, 2);

  assert.deepEqual(
    preview.visibleItems.map((item) => item.name),
    ['Deal Desk Analyst', 'Support Triage Copilot']
  );
  assert.equal(preview.remainingCount, 1);
});

test('returns an empty relationship preview when a listing has no connections in the slice', () => {
  const isolatedItem = {
    ...marketplaceItems[0],
    id: 'agent-isolated',
    name: 'Isolated Agent',
    linkedItemIds: []
  };

  const preview = getRelationshipPreview([isolatedItem], isolatedItem);

  assert.deepEqual(preview, {
    visibleItems: [],
    remainingCount: 0
  });
});

test('builds relationship context with visible and hidden linked listings', () => {
  const selectedItem = marketplaceItems.find((item) => item.id === 'mcp-docs');
  assert.ok(selectedItem);

  const visibleItems = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'all',
    searchValue: 'support'
  });
  const context = getRelationshipContext(marketplaceItems, visibleItems, selectedItem, 2);

  assert.deepEqual(context.visibleItems.map((item) => item.name), ['Support Triage Copilot']);
  assert.equal(context.remainingCount, 0);
  assert.equal(context.hiddenCount, 2);
  assert.equal(context.totalCount, 3);
});

test('returns zero hidden linked listings when every connection is visible in the workspace', () => {
  const selectedItem = marketplaceItems.find((item) => item.id === 'agent-deal-desk');
  assert.ok(selectedItem);

  const context = getRelationshipContext(marketplaceItems, marketplaceItems, selectedItem, 1);

  assert.deepEqual(context.visibleItems.map((item) => item.name), ['Salesforce MCP']);
  assert.equal(context.remainingCount, 1);
  assert.equal(context.hiddenCount, 0);
  assert.equal(context.totalCount, 2);
});

test('toggles compared items and evicts the oldest when the tray is full', () => {
  const compared = toggleComparedItem(
    ['agent-deal-desk', 'agent-support-triage', 'mcp-crm'],
    'mcp-docs'
  );

  assert.deepEqual(compared, ['agent-support-triage', 'mcp-crm', 'mcp-docs']);
  assert.deepEqual(toggleComparedItem(compared, 'mcp-crm'), ['agent-support-triage', 'mcp-docs']);
});

test('resolves compared items in the same order as the compare tray', () => {
  const compared = getComparedItems(marketplaceItems, ['mcp-docs', 'agent-risk-ops']);

  assert.deepEqual(compared.map((item) => item.name), ['Confluence MCP', 'Risk Ops Sentinel']);
});

test('tracks which compared items remain visible in the current workspace slice', () => {
  const compared = getComparedItems(marketplaceItems, [
    'mcp-docs',
    'agent-risk-ops',
    'mcp-crm'
  ]);
  const visibleItems = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    kindFilter: 'mcp',
    providerFilter: 'Marketplace Verified'
  });
  const summary = getCompareWorkspaceSummary(visibleItems, compared);

  assert.deepEqual(
    summary.items.map((entry) => [entry.item.id, entry.isVisible]),
    [
      ['mcp-docs', true],
      ['agent-risk-ops', false],
      ['mcp-crm', true]
    ]
  );
  assert.equal(summary.visibleCount, 2);
  assert.equal(summary.hiddenCount, 1);
});

test('filters listings by provider and category', () => {
  const filtered = filterMarketplaceItems(marketplaceItems, {
    ...baseFilters,
    providerFilter: 'Marketplace Verified',
    categoryFilter: 'Knowledge'
  });

  assert.deepEqual(filtered.map((item) => item.name), ['Confluence MCP']);
});

test('derives facet counts from the current filtered slice while excluding the active facet itself', () => {
  const providerCounts = getFacetOptionCounts(
    marketplaceItems,
    {
      ...baseFilters,
      kindFilter: 'agent',
      categoryFilter: 'Support'
    },
    'provider'
  );
  const categoryCounts = getFacetOptionCounts(
    marketplaceItems,
    {
      ...baseFilters,
      providerFilter: 'Marketplace Verified'
    },
    'category'
  );

  assert.deepEqual(providerCounts, [
    { value: 'Assist Labs', count: 1 },
    { value: 'Marketplace Verified', count: 0 },
    { value: 'Northstar AI', count: 0 },
    { value: 'Symphony Core', count: 0 },
    { value: 'Telemetry Works', count: 0 }
  ]);
  assert.deepEqual(categoryCounts, [
    { value: 'Compliance', count: 0 },
    { value: 'CRM', count: 1 },
    { value: 'Knowledge', count: 1 },
    { value: 'Observability', count: 0 },
    { value: 'Revenue', count: 0 },
    { value: 'Support', count: 0 }
  ]);
});

test('derives capability counts from the current filtered slice while excluding the active capability itself', () => {
  const capabilityCounts = getFacetOptionCounts(
    marketplaceItems,
    {
      ...baseFilters,
      kindFilter: 'mcp',
      providerFilter: 'Marketplace Verified',
      activeCapability: 'Source citation'
    },
    'capability'
  );

  assert.deepEqual(
    capabilityCounts.filter(({ count }) => count > 0),
    [
      { value: 'Page retrieval', count: 1 },
      { value: 'Read records', count: 1 },
      { value: 'Schema discovery', count: 1 },
      { value: 'Search', count: 1 },
      { value: 'Source citation', count: 1 },
      { value: 'Write notes', count: 1 }
    ]
  );
});

test('derives sorted provider and category filter options', () => {
  assert.deepEqual(defaultProviders, [
    'Assist Labs',
    'Marketplace Verified',
    'Northstar AI',
    'Symphony Core',
    'Telemetry Works'
  ]);
  assert.deepEqual(defaultCategories, [
    'Compliance',
    'CRM',
    'Knowledge',
    'Observability',
    'Revenue',
    'Support'
  ]);
});

test('derives sorted capability filter options from the dataset', () => {
  assert.deepEqual(defaultCapabilities, [
    'Alert history',
    'Context summarization',
    'Drift detection',
    'Evidence packaging',
    'Metric queries',
    'Page retrieval',
    'Policy checks',
    'Priority prediction',
    'Read records',
    'Schema discovery',
    'Search',
    'Source citation',
    'Suggested response',
    'Ticket enrichment',
    'Timeline generation',
    'Trace lookups',
    'Workflow routing',
    'Write notes'
  ]);
});

test('defines reusable marketplace presets with valid selected listings', () => {
  assert.equal(marketplaceViewPresets.length, 3);

  for (const preset of marketplaceViewPresets) {
    assert.ok(marketplaceItems.some((item) => item.id === preset.selectedId));
  }

  assert.equal(marketplaceViewPresets[1]?.filters.categoryFilter, 'Knowledge');
  assert.equal(marketplaceViewPresets[2]?.filters.activeCapability, 'Alert history');
});

test('parses marketplace latency and update dates into comparable numeric values', () => {
  assert.equal(parseLatencyMs('2.1s median'), 2100);
  assert.equal(parseLatencyMs('280ms median'), 280);
  assert.equal(parseMarketplaceDate('March 11, 2026') > parseMarketplaceDate('March 8, 2026'), true);
});

test('derives comparison leaders and gaps for pinned listings', () => {
  const compared = getComparedItems(marketplaceItems, ['agent-deal-desk', 'mcp-crm', 'mcp-docs']);
  const insights = getCompareInsights(compared);
  const agentInsight = insights.itemInsights.find((item) => item.itemId === 'agent-deal-desk');
  const docsInsight = insights.itemInsights.find((item) => item.itemId === 'mcp-docs');

  assert.deepEqual(insights.trustLeaderIds, ['mcp-crm']);
  assert.deepEqual(insights.latencyLeaderIds, ['mcp-crm']);
  assert.deepEqual(insights.freshnessLeaderIds, ['mcp-crm']);
  assert.deepEqual(insights.linkLeaderIds, ['mcp-docs']);
  assert.equal(agentInsight?.trustGap, 2);
  assert.equal(agentInsight?.latencyGapMs, 1820);
  assert.equal(docsInsight?.linkGap, 0);
  assert.equal(docsInsight?.isLinkLeader, true);
});
