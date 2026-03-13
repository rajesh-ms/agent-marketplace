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
  getFacetOptionCounts,
  getAgentStacks,
  getCompareInsights,
  getComparedItems,
  getFreshestItem,
  getMarketplaceStats,
  getRelatedItems,
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
