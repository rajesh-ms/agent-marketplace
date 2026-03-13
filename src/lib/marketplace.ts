import { marketplaceItems } from '../data/marketplace';
import { MarketplaceItem, MarketplaceKind, MarketplaceStatus } from '../types';

export interface MarketplaceFilters {
  kindFilter: MarketplaceKind | 'all';
  searchValue: string;
  activeCapability: string;
  statusFilter: MarketplaceStatus | 'all';
  providerFilter: string;
  categoryFilter: string;
}

export type MarketplaceSort = 'trust' | 'updated' | 'name';
export type MarketplaceFacet = 'provider' | 'category' | 'capability';

const millisecondsInDay = 24 * 60 * 60 * 1000;

export interface MarketplaceViewPreset {
  id: string;
  label: string;
  description: string;
  filters: MarketplaceFilters;
  sortBy: MarketplaceSort;
  selectedId: string;
}

export interface AgentStack {
  agent: MarketplaceItem;
  mcps: MarketplaceItem[];
  averageTrust: number;
}

export interface CompareItemInsight {
  itemId: string;
  trustGap: number;
  latencyGapMs: number;
  freshnessGapDays: number;
  linkGap: number;
  isTrustLeader: boolean;
  isLatencyLeader: boolean;
  isFreshnessLeader: boolean;
  isLinkLeader: boolean;
}

export interface CompareInsights {
  trustLeaderIds: string[];
  latencyLeaderIds: string[];
  freshnessLeaderIds: string[];
  linkLeaderIds: string[];
  itemInsights: CompareItemInsight[];
}

export interface ComparedWorkspaceItem {
  item: MarketplaceItem;
  isVisible: boolean;
}

export interface CompareWorkspaceSummary {
  items: ComparedWorkspaceItem[];
  visibleCount: number;
  hiddenCount: number;
}

export interface MarketplaceSurfaceMapRow {
  item: MarketplaceItem;
  connectedItems: MarketplaceItem[];
}

export interface MarketplaceSurfaceMap {
  agentRows: MarketplaceSurfaceMapRow[];
  mcpRows: MarketplaceSurfaceMapRow[];
}

export interface MarketplaceRelationshipPreview {
  visibleItems: MarketplaceItem[];
  remainingCount: number;
}

export interface MarketplaceRelationshipContext extends MarketplaceRelationshipPreview {
  hiddenCount: number;
  totalCount: number;
}

export interface MarketplaceKindSummary {
  kind: MarketplaceKind;
  count: number;
  averageTrust: number;
  readyCount: number;
  scalingCount: number;
  pilotCount: number;
  liveConnections: number;
  topListing: MarketplaceItem | null;
}

export interface MarketplaceCounterpartPreview {
  counterpartKind: MarketplaceKind;
  visibleItems: MarketplaceItem[];
  remainingCount: number;
}

export interface MarketplaceFacetOptionCount {
  value: string;
  count: number;
}

export interface MarketplaceKindOptionCount {
  value: MarketplaceKind;
  count: number;
}

export interface MarketplaceStatusOptionCount {
  value: MarketplaceStatus;
  count: number;
}

const normalizePresetSearchValue = (value: string) => value.trim().toLowerCase();
const matchesItemSearch = (item: MarketplaceItem, searchValue: string) => {
  const normalizedSearch = searchValue.trim().toLowerCase();

  return (
    normalizedSearch.length === 0 ||
    [item.name, item.category, item.provider, item.description, ...item.tags]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch)
  );
};

const matchesItemCapability = (item: MarketplaceItem, capability: string) =>
  capability === 'All' ||
  item.capabilities.some((entry) => entry.toLowerCase() === capability.toLowerCase());

export const toggleComparedItem = (
  comparedIds: string[],
  itemId: string,
  maxComparedItems = 3
) => {
  if (comparedIds.includes(itemId)) {
    return comparedIds.filter((id) => id !== itemId);
  }

  if (comparedIds.length >= maxComparedItems) {
    return [...comparedIds.slice(1), itemId];
  }

  return [...comparedIds, itemId];
};

export const parseMarketplaceDate = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const parseLatencyMs = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  if (normalized.includes('ms')) {
    return Math.round(parsed);
  }

  return Math.round(parsed * 1000);
};

export const filterMarketplaceItems = (
  items: MarketplaceItem[],
  {
    kindFilter,
    searchValue,
    activeCapability,
    statusFilter,
    providerFilter,
    categoryFilter
  }: MarketplaceFilters
) => {
  return items.filter((item) => {
    const matchesKind = kindFilter === 'all' || item.kind === kindFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProvider = providerFilter === 'All providers' || item.provider === providerFilter;
    const matchesCategory = categoryFilter === 'All categories' || item.category === categoryFilter;
    const matchesSearch = matchesItemSearch(item, searchValue);
    const matchesCapability = matchesItemCapability(item, activeCapability);

    return (
      matchesKind &&
      matchesStatus &&
      matchesProvider &&
      matchesCategory &&
      matchesSearch &&
      matchesCapability
    );
  });
};

export const getFocusFiltersForItem = (
  item: MarketplaceItem,
  filters: MarketplaceFilters
): MarketplaceFilters => {
  const matchesSearch = matchesItemSearch(item, filters.searchValue);
  const matchesCapability = matchesItemCapability(item, filters.activeCapability);

  return {
    kindFilter: filters.kindFilter === 'all' || item.kind === filters.kindFilter ? filters.kindFilter : 'all',
    searchValue: matchesSearch ? filters.searchValue : '',
    activeCapability: matchesCapability ? filters.activeCapability : 'All',
    statusFilter: filters.statusFilter === 'all' || item.status === filters.statusFilter ? filters.statusFilter : 'all',
    providerFilter:
      filters.providerFilter === 'All providers' || item.provider === filters.providerFilter
        ? filters.providerFilter
        : 'All providers',
    categoryFilter:
      filters.categoryFilter === 'All categories' || item.category === filters.categoryFilter
        ? filters.categoryFilter
        : 'All categories'
  };
};

export const getFocusFiltersForItems = (
  items: MarketplaceItem[],
  filters: MarketplaceFilters
): MarketplaceFilters => {
  if (items.length === 0) {
    return filters;
  }

  return {
    kindFilter:
      filters.kindFilter === 'all' || items.every((item) => item.kind === filters.kindFilter)
        ? filters.kindFilter
        : 'all',
    searchValue: items.every((item) => matchesItemSearch(item, filters.searchValue))
      ? filters.searchValue
      : '',
    activeCapability: items.every((item) => matchesItemCapability(item, filters.activeCapability))
      ? filters.activeCapability
      : 'All',
    statusFilter:
      filters.statusFilter === 'all' || items.every((item) => item.status === filters.statusFilter)
        ? filters.statusFilter
        : 'all',
    providerFilter:
      filters.providerFilter === 'All providers' ||
      items.every((item) => item.provider === filters.providerFilter)
        ? filters.providerFilter
        : 'All providers',
    categoryFilter:
      filters.categoryFilter === 'All categories' ||
      items.every((item) => item.category === filters.categoryFilter)
        ? filters.categoryFilter
        : 'All categories'
  };
};

export const getContextFiltersForItem = (
  item: MarketplaceItem,
  filters: MarketplaceFilters,
  overrides: Partial<MarketplaceFilters>
): MarketplaceFilters =>
  getFocusFiltersForItem(item, {
    ...filters,
    ...overrides
  });

export const getContextFiltersForItems = (
  anchorItem: MarketplaceItem,
  items: MarketplaceItem[],
  filters: MarketplaceFilters
): MarketplaceFilters => getContextFiltersForItem(anchorItem, getFocusFiltersForItems(items, filters), {});

export const matchesMarketplacePreset = (
  filters: MarketplaceFilters,
  sortBy: MarketplaceSort,
  preset: MarketplaceViewPreset
) =>
  filters.kindFilter === preset.filters.kindFilter &&
  normalizePresetSearchValue(filters.searchValue) ===
    normalizePresetSearchValue(preset.filters.searchValue) &&
  filters.activeCapability === preset.filters.activeCapability &&
  filters.statusFilter === preset.filters.statusFilter &&
  filters.providerFilter === preset.filters.providerFilter &&
  filters.categoryFilter === preset.filters.categoryFilter &&
  sortBy === preset.sortBy;

export const getMatchingMarketplacePreset = (
  filters: MarketplaceFilters,
  sortBy: MarketplaceSort,
  presets: MarketplaceViewPreset[] = marketplaceViewPresets
) => presets.find((preset) => matchesMarketplacePreset(filters, sortBy, preset)) ?? null;

export const sortMarketplaceItems = (items: MarketplaceItem[], sortBy: MarketplaceSort) => {
  const sorted = [...items];

  sorted.sort((left, right) => {
    if (sortBy === 'trust') {
      return right.trustScore - left.trustScore || left.name.localeCompare(right.name);
    }

    if (sortBy === 'updated') {
      return (
        parseMarketplaceDate(right.lastUpdated) - parseMarketplaceDate(left.lastUpdated) ||
        right.trustScore - left.trustScore
      );
    }

    return left.name.localeCompare(right.name);
  });

  return sorted;
};

export const resolveSelectedItem = (
  items: MarketplaceItem[],
  selectedId: string
) => items.find((item) => item.id === selectedId) ?? items[0] ?? null;

export const isMarketplaceItemVisible = (items: MarketplaceItem[], itemId: string) =>
  items.some((item) => item.id === itemId);

export const getMarketplaceStats = (items: MarketplaceItem[]) => {
  const agents = items.filter((item) => item.kind === 'agent').length;
  const mcps = items.filter((item) => item.kind === 'mcp').length;
  const averageTrust =
    items.length === 0
      ? 0
      : Math.round(items.reduce((sum, item) => sum + item.trustScore, 0) / items.length);
  const liveConnections = items.reduce((sum, item) => sum + item.linkedItemIds.length, 0);

  return { agents, mcps, averageTrust, liveConnections };
};

export const getMarketplaceKindSummaries = (
  items: MarketplaceItem[]
): MarketplaceKindSummary[] =>
  (['agent', 'mcp'] as const).map((kind) => {
    const kindItems = items.filter((item) => item.kind === kind);
    const stats = getMarketplaceStats(kindItems);
    const statuses = getStatusSummary(kindItems);
    const topListing = sortMarketplaceItems(kindItems, 'trust')[0] ?? null;

    return {
      kind,
      count: kindItems.length,
      averageTrust: stats.averageTrust,
      readyCount: statuses.ready,
      scalingCount: statuses.scaling,
      pilotCount: statuses.pilot,
      liveConnections: stats.liveConnections,
      topListing
    };
  });

export const getStatusSummary = (items: MarketplaceItem[]) => ({
  ready: items.filter((item) => item.status === 'Ready').length,
  pilot: items.filter((item) => item.status === 'Pilot').length,
  scaling: items.filter((item) => item.status === 'Scaling').length
});

export const getTopCategories = (items: MarketplaceItem[]) =>
  Object.entries(
    items.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));

export const getFreshestItem = (items: MarketplaceItem[]) =>
  items.reduce<MarketplaceItem | null>((freshestItem, item) => {
    if (!freshestItem) {
      return item;
    }

    const freshnessDelta =
      parseMarketplaceDate(item.lastUpdated) - parseMarketplaceDate(freshestItem.lastUpdated);

    if (freshnessDelta > 0) {
      return item;
    }

    if (freshnessDelta === 0 && item.trustScore > freshestItem.trustScore) {
      return item;
    }

    return freshestItem;
  }, null);

export const getUniqueProviders = (items: MarketplaceItem[]) =>
  Array.from(new Set(items.map((item) => item.provider))).sort((left, right) =>
    left.localeCompare(right)
  );

export const getUniqueCategories = (items: MarketplaceItem[]) =>
  Array.from(new Set(items.map((item) => item.category))).sort((left, right) =>
    left.localeCompare(right)
  );

export const getUniqueCapabilities = (items: MarketplaceItem[]) =>
  Array.from(new Set(items.flatMap((item) => item.capabilities))).sort((left, right) =>
    left.localeCompare(right)
  );

export const getFacetOptionCounts = (
  items: MarketplaceItem[],
  filters: MarketplaceFilters,
  facet: MarketplaceFacet
): MarketplaceFacetOptionCount[] => {
  const itemsMatchingOtherFilters = filterMarketplaceItems(items, {
    ...filters,
    activeCapability: facet === 'capability' ? 'All' : filters.activeCapability,
    providerFilter: facet === 'provider' ? 'All providers' : filters.providerFilter,
    categoryFilter: facet === 'category' ? 'All categories' : filters.categoryFilter
  });

  const allValues =
    facet === 'provider'
      ? getUniqueProviders(items)
      : facet === 'category'
        ? getUniqueCategories(items)
        : getUniqueCapabilities(items);

  return allValues.map((value) => ({
    value,
    count: itemsMatchingOtherFilters.filter((item) =>
      facet === 'provider'
        ? item.provider === value
        : facet === 'category'
          ? item.category === value
          : item.capabilities.includes(value)
    ).length
  }));
};

export const getKindOptionCounts = (
  items: MarketplaceItem[],
  filters: MarketplaceFilters
): MarketplaceKindOptionCount[] => {
  const itemsMatchingOtherFilters = filterMarketplaceItems(items, {
    ...filters,
    kindFilter: 'all'
  });

  return (['agent', 'mcp'] as const).map((value) => ({
    value,
    count: itemsMatchingOtherFilters.filter((item) => item.kind === value).length
  }));
};

export const getStatusOptionCounts = (
  items: MarketplaceItem[],
  filters: MarketplaceFilters
): MarketplaceStatusOptionCount[] => {
  const itemsMatchingOtherFilters = filterMarketplaceItems(items, {
    ...filters,
    statusFilter: 'all'
  });

  return (['Ready', 'Scaling', 'Pilot'] as const).map((value) => ({
    value,
    count: itemsMatchingOtherFilters.filter((item) => item.status === value).length
  }));
};

export const getFeaturedItems = (items: MarketplaceItem[]) =>
  (['agent', 'mcp'] as const)
    .map((kind) =>
      items
        .filter((item) => item.kind === kind)
        .sort((left, right) => right.trustScore - left.trustScore)[0]
    )
    .filter((item): item is MarketplaceItem => Boolean(item));

export const getRelatedItems = (items: MarketplaceItem[], selectedItem: MarketplaceItem) =>
  items.filter(
    (item) =>
      item.id !== selectedItem.id &&
      (selectedItem.linkedItemIds.includes(item.id) || item.linkedItemIds.includes(selectedItem.id))
  );

export const getRelationshipPreview = (
  items: MarketplaceItem[],
  selectedItem: MarketplaceItem,
  maxVisibleItems = 2
): MarketplaceRelationshipPreview => {
  const relatedItems = getRelatedItems(items, selectedItem).sort(
    (left, right) => right.trustScore - left.trustScore || left.name.localeCompare(right.name)
  );

  return {
    visibleItems: relatedItems.slice(0, maxVisibleItems),
    remainingCount: Math.max(0, relatedItems.length - maxVisibleItems)
  };
};

export const getRelationshipContext = (
  allItems: MarketplaceItem[],
  visibleItems: MarketplaceItem[],
  selectedItem: MarketplaceItem,
  maxVisibleItems = 2
): MarketplaceRelationshipContext => {
  const relatedItems = getRelatedItems(allItems, selectedItem).sort(
    (left, right) => right.trustScore - left.trustScore || left.name.localeCompare(right.name)
  );
  const visibleItemIds = new Set(visibleItems.map((item) => item.id));
  const visibleRelatedItems = relatedItems.filter((item) => visibleItemIds.has(item.id));

  return {
    visibleItems: visibleRelatedItems.slice(0, maxVisibleItems),
    remainingCount: Math.max(0, visibleRelatedItems.length - maxVisibleItems),
    hiddenCount: Math.max(0, relatedItems.length - visibleRelatedItems.length),
    totalCount: relatedItems.length
  };
};

export const getMarketplaceCounterpartPreview = (
  items: MarketplaceItem[],
  activeKind: MarketplaceKind | 'all',
  maxVisibleItems = 3
): MarketplaceCounterpartPreview | null => {
  if (activeKind === 'all') {
    return null;
  }

  const counterpartKind: MarketplaceKind = activeKind === 'agent' ? 'mcp' : 'agent';
  const counterpartItems = sortMarketplaceItems(
    items.filter((item) => item.kind === counterpartKind),
    'trust'
  );

  return {
    counterpartKind,
    visibleItems: counterpartItems.slice(0, maxVisibleItems),
    remainingCount: Math.max(0, counterpartItems.length - maxVisibleItems)
  };
};

export const getComparedItems = (items: MarketplaceItem[], comparedIds: string[]) =>
  comparedIds
    .map((id) => items.find((item) => item.id === id) ?? null)
    .filter((item): item is MarketplaceItem => Boolean(item));

export const getCompareWorkspaceSummary = (
  visibleItems: MarketplaceItem[],
  comparedItems: MarketplaceItem[]
): CompareWorkspaceSummary => {
  const visibleIds = new Set(visibleItems.map((item) => item.id));
  const items = comparedItems.map((item) => ({
    item,
    isVisible: visibleIds.has(item.id)
  }));
  const visibleCount = items.filter((entry) => entry.isVisible).length;

  return {
    items,
    visibleCount,
    hiddenCount: Math.max(0, items.length - visibleCount)
  };
};

export const getCompareInsights = (items: MarketplaceItem[]): CompareInsights => {
  if (items.length === 0) {
    return {
      trustLeaderIds: [],
      latencyLeaderIds: [],
      freshnessLeaderIds: [],
      linkLeaderIds: [],
      itemInsights: []
    };
  }

  const maxTrust = Math.max(...items.map((item) => item.trustScore));
  const minLatency = Math.min(...items.map((item) => parseLatencyMs(item.latency)));
  const maxUpdated = Math.max(...items.map((item) => parseMarketplaceDate(item.lastUpdated)));
  const maxLinks = Math.max(...items.map((item) => item.linkedItemIds.length));

  return {
    trustLeaderIds: items.filter((item) => item.trustScore === maxTrust).map((item) => item.id),
    latencyLeaderIds: items
      .filter((item) => parseLatencyMs(item.latency) === minLatency)
      .map((item) => item.id),
    freshnessLeaderIds: items
      .filter((item) => parseMarketplaceDate(item.lastUpdated) === maxUpdated)
      .map((item) => item.id),
    linkLeaderIds: items
      .filter((item) => item.linkedItemIds.length === maxLinks)
      .map((item) => item.id),
    itemInsights: items.map((item) => {
      const latencyMs = parseLatencyMs(item.latency);
      const updatedAt = parseMarketplaceDate(item.lastUpdated);

      return {
        itemId: item.id,
        trustGap: maxTrust - item.trustScore,
        latencyGapMs: latencyMs - minLatency,
        freshnessGapDays: Math.round((maxUpdated - updatedAt) / millisecondsInDay),
        linkGap: maxLinks - item.linkedItemIds.length,
        isTrustLeader: item.trustScore === maxTrust,
        isLatencyLeader: latencyMs === minLatency,
        isFreshnessLeader: updatedAt === maxUpdated,
        isLinkLeader: item.linkedItemIds.length === maxLinks
      };
    })
  };
};

export const getAgentStacks = (items: MarketplaceItem[]): AgentStack[] =>
  items
    .filter((item) => item.kind === 'agent')
    .map((agent) => {
      const mcps = items.filter((item) => item.kind === 'mcp' && agent.linkedItemIds.includes(item.id));
      const averageTrust = Math.round(
        (agent.trustScore + mcps.reduce((sum, item) => sum + item.trustScore, 0)) / (mcps.length + 1)
      );

      return {
        agent,
        mcps,
        averageTrust
      };
    })
    .sort((left, right) => right.averageTrust - left.averageTrust || left.agent.name.localeCompare(right.agent.name));

export const getMarketplaceSurfaceMap = (items: MarketplaceItem[]): MarketplaceSurfaceMap => {
  const itemsById = new Map(items.map((item) => [item.id, item] as const));
  const agents = items.filter((item) => item.kind === 'agent');
  const mcps = items.filter((item) => item.kind === 'mcp');

  const agentRows = agents
    .map((agent) => ({
      item: agent,
      connectedItems: agent.linkedItemIds
        .map((itemId) => itemsById.get(itemId) ?? null)
        .filter((item): item is MarketplaceItem => item !== null && item.kind === 'mcp')
        .sort((left, right) => right.trustScore - left.trustScore || left.name.localeCompare(right.name))
    }))
    .sort(
      (left, right) =>
        right.connectedItems.length - left.connectedItems.length ||
        right.item.trustScore - left.item.trustScore ||
        left.item.name.localeCompare(right.item.name)
    );

  const mcpRows = mcps
    .map((mcp) => ({
      item: mcp,
      connectedItems: agents
        .filter((agent) => agent.linkedItemIds.includes(mcp.id))
        .sort((left, right) => right.trustScore - left.trustScore || left.name.localeCompare(right.name))
    }))
    .sort(
      (left, right) =>
        right.connectedItems.length - left.connectedItems.length ||
        right.item.trustScore - left.item.trustScore ||
        left.item.name.localeCompare(right.item.name)
    );

  return { agentRows, mcpRows };
};

export const marketplaceViewPresets: MarketplaceViewPreset[] = [
  {
    id: 'launch-ready',
    label: 'Launch-ready',
    description: 'Focus on production-capable listings with the strongest trust posture.',
    filters: {
      kindFilter: 'all',
      searchValue: '',
      activeCapability: 'All',
      statusFilter: 'Ready',
      providerFilter: 'All providers',
      categoryFilter: 'All categories'
    },
    sortBy: 'trust',
    selectedId: 'mcp-crm'
  },
  {
    id: 'knowledge-surfaces',
    label: 'Knowledge surfaces',
    description: 'Inspect grounded retrieval agents and MCP servers connected to documentation.',
    filters: {
      kindFilter: 'all',
      searchValue: '',
      activeCapability: 'Source citation',
      statusFilter: 'all',
      providerFilter: 'All providers',
      categoryFilter: 'Knowledge'
    },
    sortBy: 'updated',
    selectedId: 'mcp-docs'
  },
  {
    id: 'ops-watch',
    label: 'Ops watch',
    description: 'Review support and compliance flows that depend on observability-linked MCPs.',
    filters: {
      kindFilter: 'all',
      searchValue: '',
      activeCapability: 'Alert history',
      statusFilter: 'all',
      providerFilter: 'All providers',
      categoryFilter: 'Observability'
    },
    sortBy: 'updated',
    selectedId: 'mcp-observability'
  }
];

export const defaultMarketplaceStats = getMarketplaceStats(marketplaceItems);
export const defaultStatusSummary = getStatusSummary(marketplaceItems);
export const defaultTopCategories = getTopCategories(marketplaceItems);
export const defaultFeaturedItems = getFeaturedItems(marketplaceItems);
export const defaultAgentStacks = getAgentStacks(marketplaceItems);
export const defaultProviders = getUniqueProviders(marketplaceItems);
export const defaultCategories = getUniqueCategories(marketplaceItems);
export const defaultCapabilities = getUniqueCapabilities(marketplaceItems);
