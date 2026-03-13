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

export interface MarketplaceFacetOptionCount {
  value: string;
  count: number;
}

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
  const normalizedSearch = searchValue.trim().toLowerCase();

  return items.filter((item) => {
    const matchesKind = kindFilter === 'all' || item.kind === kindFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesProvider = providerFilter === 'All providers' || item.provider === providerFilter;
    const matchesCategory = categoryFilter === 'All categories' || item.category === categoryFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [item.name, item.category, item.provider, item.description, ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    const matchesCapability =
      activeCapability === 'All' ||
      item.capabilities.some((entry) => entry.toLowerCase() === activeCapability.toLowerCase());

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

export const getComparedItems = (items: MarketplaceItem[], comparedIds: string[]) =>
  comparedIds
    .map((id) => items.find((item) => item.id === id) ?? null)
    .filter((item): item is MarketplaceItem => Boolean(item));

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
