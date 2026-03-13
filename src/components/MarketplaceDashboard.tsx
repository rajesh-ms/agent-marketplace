import { useMemo, useState, type CSSProperties } from 'react';
import { marketplaceItems } from '../data/marketplace';
import {
  defaultAgentStacks,
  defaultFeaturedItems,
  defaultMarketplaceStats,
  defaultStatusSummary,
  defaultTopCategories,
  filterMarketplaceItems,
  getContextFiltersForItem,
  getContextFiltersForItems,
  getFocusFiltersForItem,
  getFacetOptionCounts,
  getCompareInsights,
  getCompareWorkspaceSummary,
  getComparedItems,
  getMarketplaceCounterpartPreview,
  getFreshestItem,
  getKindOptionCounts,
  getMatchingMarketplacePreset,
  isMarketplaceItemVisible,
  getMarketplaceKindSummaries,
  getRelationshipContext,
  getMarketplaceStats,
  getMarketplaceSurfaceMap,
  getRelatedItems,
  getStatusOptionCounts,
  getStatusSummary,
  getTopCategories,
  marketplaceViewPresets,
  resolveSelectedItem,
  sortMarketplaceItems,
  toggleComparedItem
} from '../lib/marketplace';
import { MarketplaceKind, MarketplaceStatus } from '../types';

const kindOptions: Array<{ label: string; value: MarketplaceKind | 'all' }> = [
  { label: 'All Listings', value: 'all' },
  { label: 'Agents', value: 'agent' },
  { label: 'MCP Servers', value: 'mcp' }
];

const statusOptions: Array<{ label: string; value: MarketplaceStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Ready', value: 'Ready' },
  { label: 'Scaling', value: 'Scaling' },
  { label: 'Pilot', value: 'Pilot' }
];

const sortOptions = [
  { label: 'Trust score', value: 'trust' },
  { label: 'Recently updated', value: 'updated' },
  { label: 'Name', value: 'name' }
] as const;

const defaultFilters = {
  kindFilter: 'all' as const,
  searchValue: '',
  activeCapability: 'All',
  statusFilter: 'all' as const,
  providerFilter: 'All providers',
  categoryFilter: 'All categories'
};

export function MarketplaceDashboard() {
  const maxComparedItems = 3;
  const [kindFilter, setKindFilter] = useState<MarketplaceKind | 'all'>(defaultFilters.kindFilter);
  const [searchValue, setSearchValue] = useState(defaultFilters.searchValue);
  const [activeCapability, setActiveCapability] = useState<string>(defaultFilters.activeCapability);
  const [statusFilter, setStatusFilter] = useState<MarketplaceStatus | 'all'>(defaultFilters.statusFilter);
  const [providerFilter, setProviderFilter] = useState(defaultFilters.providerFilter);
  const [categoryFilter, setCategoryFilter] = useState(defaultFilters.categoryFilter);
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('trust');
  const [selectedId, setSelectedId] = useState<string>(marketplaceItems[0].id);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    const visibleItems = filterMarketplaceItems(marketplaceItems, {
      kindFilter,
      searchValue,
      activeCapability,
      statusFilter,
      providerFilter,
      categoryFilter
    });

    return sortMarketplaceItems(visibleItems, sortBy);
  }, [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, sortBy, statusFilter]);
  const kindFacetCounts = useMemo(
    () =>
      getKindOptionCounts(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter
      }),
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const statusFacetCounts = useMemo(
    () =>
      getStatusOptionCounts(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter
      }),
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const capabilityScopeCount = useMemo(
    () =>
      filterMarketplaceItems(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability: 'All',
        statusFilter,
        providerFilter,
        categoryFilter
      }).length,
    [categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const statusScopeCount = useMemo(
    () =>
      filterMarketplaceItems(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter: 'all',
        providerFilter,
        categoryFilter
      }).length,
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue]
  );
  const providerScopeCount = useMemo(
    () =>
      filterMarketplaceItems(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter: 'All providers',
        categoryFilter
      }).length,
    [activeCapability, categoryFilter, kindFilter, searchValue, statusFilter]
  );
  const categoryScopeCount = useMemo(
    () =>
      filterMarketplaceItems(marketplaceItems, {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter: 'All categories'
      }).length,
    [activeCapability, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const providerFacetCounts = useMemo(
    () =>
      getFacetOptionCounts(
        marketplaceItems,
        {
          kindFilter,
          searchValue,
          activeCapability,
          statusFilter,
          providerFilter,
          categoryFilter
        },
        'provider'
      ),
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const capabilityFacetCounts = useMemo(
    () =>
      getFacetOptionCounts(
        marketplaceItems,
        {
          kindFilter,
          searchValue,
          activeCapability,
          statusFilter,
          providerFilter,
          categoryFilter
        },
        'capability'
      ),
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const categoryFacetCounts = useMemo(
    () =>
      getFacetOptionCounts(
        marketplaceItems,
        {
          kindFilter,
          searchValue,
          activeCapability,
          statusFilter,
          providerFilter,
          categoryFilter
        },
        'category'
      ),
    [activeCapability, categoryFilter, kindFilter, providerFilter, searchValue, statusFilter]
  );
  const crossKindSurfaceItems = useMemo(
    () =>
      filterMarketplaceItems(marketplaceItems, {
        kindFilter: 'all',
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter
      }),
    [activeCapability, categoryFilter, providerFilter, searchValue, statusFilter]
  );
  const surfaceMap = useMemo(
    () => getMarketplaceSurfaceMap(crossKindSurfaceItems),
    [crossKindSurfaceItems]
  );
  const crossKindSummaries = useMemo(
    () => getMarketplaceKindSummaries(crossKindSurfaceItems),
    [crossKindSurfaceItems]
  );
  const counterpartPreview = useMemo(
    () => getMarketplaceCounterpartPreview(crossKindSurfaceItems, kindFilter),
    [crossKindSurfaceItems, kindFilter]
  );
  const relationshipPreviewMap = useMemo(
    () =>
      new Map(
        marketplaceItems.map(
          (item) =>
            [
              item.id,
              getRelationshipContext(marketplaceItems, crossKindSurfaceItems, item)
            ] as const
        )
      ),
    [crossKindSurfaceItems]
  );

  const selectedItem = resolveSelectedItem(filteredItems, selectedId);
  const relatedItems = selectedItem ? getRelatedItems(crossKindSurfaceItems, selectedItem) : [];
  const relatedContext = selectedItem ? relationshipPreviewMap.get(selectedItem.id) ?? null : null;
  const comparedItems = getComparedItems(marketplaceItems, comparedIds);
  const compareWorkspace = useMemo(
    () => getCompareWorkspaceSummary(filteredItems, comparedItems),
    [comparedItems, filteredItems]
  );
  const compareInsights = getCompareInsights(comparedItems);
  const compareInsightMap = new Map(
    compareInsights.itemInsights.map((insight) => [insight.itemId, insight])
  );
  const filteredStats = getMarketplaceStats(filteredItems);
  const filteredStatuses = getStatusSummary(filteredItems);
  const filteredTopCategory = getTopCategories(filteredItems)[0];
  const freshestListing = getFreshestItem(filteredItems);
  const activeStack = defaultAgentStacks.find(
    (stack) =>
      stack.agent.id === selectedItem?.id || stack.mcps.some((item) => item.id === selectedItem?.id)
  );
  const activePreset = useMemo(
    () =>
      getMatchingMarketplacePreset(
        {
          kindFilter,
          searchValue,
          activeCapability,
          statusFilter,
          providerFilter,
          categoryFilter
        },
        sortBy
      ),
    [
      activeCapability,
      categoryFilter,
      kindFilter,
      providerFilter,
      searchValue,
      sortBy,
      statusFilter
    ]
  );
  const stackCompanions = activeStack
    ? [activeStack.agent, ...activeStack.mcps].filter((item) => item.id !== selectedItem?.id)
    : [];
  const trustRingStyle: CSSProperties | undefined = selectedItem
    ? {
        '--trust-ring-progress': `${Math.max(
          0,
          Math.min(360, Math.round((selectedItem.trustScore / 100) * 360))
        )}deg`
      } as CSSProperties
    : undefined;
  const activeFilterChips = [
    kindFilter !== 'all'
      ? {
          key: 'kind',
          label: kindFilter === 'agent' ? 'Kind: Agents' : 'Kind: MCP Servers',
          clear: () => setKindFilter(defaultFilters.kindFilter)
        }
      : null,
    searchValue.trim().length > 0
      ? {
          key: 'search',
          label: `Search: ${searchValue.trim()}`,
          clear: () => setSearchValue(defaultFilters.searchValue)
        }
      : null,
    activeCapability !== 'All'
      ? {
          key: 'capability',
          label: `Capability: ${activeCapability}`,
          clear: () => setActiveCapability(defaultFilters.activeCapability)
        }
      : null,
    statusFilter !== 'all'
      ? {
          key: 'status',
          label: `Status: ${statusFilter}`,
          clear: () => setStatusFilter(defaultFilters.statusFilter)
        }
      : null,
    providerFilter !== 'All providers'
      ? {
          key: 'provider',
          label: `Provider: ${providerFilter}`,
          clear: () => setProviderFilter(defaultFilters.providerFilter)
        }
      : null,
    categoryFilter !== 'All categories'
      ? {
          key: 'category',
          label: `Category: ${categoryFilter}`,
          clear: () => setCategoryFilter(defaultFilters.categoryFilter)
        }
      : null
  ].filter((chip): chip is { key: string; label: string; clear: () => void } => Boolean(chip));
  const kindCountMap = new Map(kindFacetCounts.map((entry) => [entry.value, entry.count] as const));
  const statusCountMap = new Map(
    statusFacetCounts.map((entry) => [entry.value, entry.count] as const)
  );

  const getComparedNames = (itemIds: string[]) =>
    comparedItems
      .filter((item) => itemIds.includes(item.id))
      .map((item) => item.name)
      .join(' / ');

  const renderGapLabel = (isLeader: boolean, gap: number, suffix: string) => {
    if (isLeader) {
      return 'Best in tray';
    }

    return `${gap}${suffix} behind leader`;
  };

  const focusItem = (itemId: string) => {
    if (!isMarketplaceItemVisible(filteredItems, itemId)) {
      const targetItem = marketplaceItems.find((item) => item.id === itemId);

      if (targetItem) {
        const nextFilters = getFocusFiltersForItem(targetItem, {
          kindFilter,
          searchValue,
          activeCapability,
          statusFilter,
          providerFilter,
          categoryFilter
        });

        setKindFilter(nextFilters.kindFilter);
        setSearchValue(nextFilters.searchValue);
        setActiveCapability(nextFilters.activeCapability);
        setStatusFilter(nextFilters.statusFilter);
        setProviderFilter(nextFilters.providerFilter);
        setCategoryFilter(nextFilters.categoryFilter);
      } else {
        setKindFilter(defaultFilters.kindFilter);
        setSearchValue(defaultFilters.searchValue);
        setActiveCapability(defaultFilters.activeCapability);
        setStatusFilter(defaultFilters.statusFilter);
        setProviderFilter(defaultFilters.providerFilter);
        setCategoryFilter(defaultFilters.categoryFilter);
      }
    }

    setSelectedId(itemId);
  };

  const toggleCompare = (itemId: string) => {
    setComparedIds((currentIds) => toggleComparedItem(currentIds, itemId, maxComparedItems));
  };

  const resetFilters = () => {
    setKindFilter(defaultFilters.kindFilter);
    setSearchValue(defaultFilters.searchValue);
    setActiveCapability(defaultFilters.activeCapability);
    setStatusFilter(defaultFilters.statusFilter);
    setProviderFilter(defaultFilters.providerFilter);
    setCategoryFilter(defaultFilters.categoryFilter);
    setSortBy('trust');
  };

  const revealRelatedItems = () => {
    if (!selectedItem) {
      return;
    }

    const relatedCluster = [selectedItem, ...getRelatedItems(marketplaceItems, selectedItem)];
    const resolvedFilters = getContextFiltersForItems(
      selectedItem,
      relatedCluster,
      {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter
      }
    );

    setKindFilter(resolvedFilters.kindFilter);
    setSearchValue(resolvedFilters.searchValue);
    setActiveCapability(resolvedFilters.activeCapability);
    setStatusFilter(resolvedFilters.statusFilter);
    setProviderFilter(resolvedFilters.providerFilter);
    setCategoryFilter(resolvedFilters.categoryFilter);
  };

  const applyContextFilter = (
    nextFilters: Partial<{
      kindFilter: MarketplaceKind | 'all';
      activeCapability: string;
      statusFilter: MarketplaceStatus | 'all';
      providerFilter: string;
      categoryFilter: string;
    }>
  ) => {
    if (!selectedItem) {
      if (nextFilters.kindFilter) {
        setKindFilter(nextFilters.kindFilter);
      }

      if (nextFilters.activeCapability) {
        setActiveCapability(nextFilters.activeCapability);
      }

      if (nextFilters.statusFilter) {
        setStatusFilter(nextFilters.statusFilter);
      }

      if (nextFilters.providerFilter) {
        setProviderFilter(nextFilters.providerFilter);
      }

      if (nextFilters.categoryFilter) {
        setCategoryFilter(nextFilters.categoryFilter);
      }

      return;
    }

    const resolvedFilters = getContextFiltersForItem(
      selectedItem,
      {
        kindFilter,
        searchValue,
        activeCapability,
        statusFilter,
        providerFilter,
        categoryFilter
      },
      nextFilters
    );

    setKindFilter(resolvedFilters.kindFilter);
    setSearchValue(resolvedFilters.searchValue);
    setActiveCapability(resolvedFilters.activeCapability);
    setStatusFilter(resolvedFilters.statusFilter);
    setProviderFilter(resolvedFilters.providerFilter);
    setCategoryFilter(resolvedFilters.categoryFilter);
  };

  const applyPreset = (presetId: string) => {
    const preset = marketplaceViewPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }

    setKindFilter(preset.filters.kindFilter);
    setSearchValue(preset.filters.searchValue);
    setActiveCapability(preset.filters.activeCapability);
    setStatusFilter(preset.filters.statusFilter);
    setProviderFilter(preset.filters.providerFilter);
    setCategoryFilter(preset.filters.categoryFilter);
    setSortBy(preset.sortBy);
    setSelectedId(preset.selectedId);
  };

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">AI Agent Marketplace</p>
          <h1>Ship agents and MCP servers through one governed catalog.</h1>
          <p className="hero-text">
            Browse automations, compare trust posture, and inspect the MCP surfaces that power
            them.
          </p>
        </div>

        <div className="hero-side">
          <div className="hero-metrics" aria-label="Marketplace summary">
            <article>
              <span>{defaultMarketplaceStats.agents}</span>
              <p>Agents</p>
            </article>
            <article>
              <span>{defaultMarketplaceStats.mcps}</span>
              <p>MCP servers</p>
            </article>
            <article>
              <span>{defaultMarketplaceStats.liveConnections}</span>
              <p>Live connections</p>
            </article>
          </div>

          <div className="featured-rail">
            <div className="featured-header">
              <h2>Featured launches</h2>
              <p>Highest-trust listings this week.</p>
            </div>
            {defaultFeaturedItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="featured-card"
                onClick={() => focusItem(item.id)}
              >
                <div className="market-card-header">
                  <span className={`kind-pill ${item.kind}`}>
                    {item.kind === 'agent' ? 'Agent' : 'MCP'}
                  </span>
                  <span className="score-pill">{item.trustScore} trust</span>
                </div>
                <strong>{item.name}</strong>
                <p>{item.provider}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="insight-strip" aria-label="Marketplace overview">
        <article className="insight-card">
          <p className="eyebrow">Rollout mix</p>
          <div className="status-grid">
            <div>
              <strong>{defaultStatusSummary.ready}</strong>
              <span>Ready</span>
            </div>
            <div>
              <strong>{defaultStatusSummary.scaling}</strong>
              <span>Scaling</span>
            </div>
            <div>
              <strong>{defaultStatusSummary.pilot}</strong>
              <span>Pilot</span>
            </div>
          </div>
        </article>

        <article className="insight-card">
          <p className="eyebrow">Top categories</p>
          <div className="mini-list">
            {defaultTopCategories.map((category) => (
              <div key={category.category}>
                <strong>{category.category}</strong>
                <span>{category.count} listing{category.count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="insight-card">
          <p className="eyebrow">Governance posture</p>
          <div className="mini-list">
            <div>
              <strong>Source-grounded</strong>
              <span>MCP retrieval listings expose provenance on response paths.</span>
            </div>
            <div>
              <strong>Human checkpoints</strong>
              <span>High-impact agent actions remain behind approval or sign-off gates.</span>
            </div>
          </div>
        </article>
      </section>

      <section className="stack-panel" aria-label="Deployment stacks">
        <div className="stack-panel-header">
          <div>
            <p className="eyebrow">Deployment stacks</p>
            <h2>Launch agents with the MCP surfaces they already trust.</h2>
          </div>
          {activeStack ? (
            <div className="stack-callout">
              <span>Active stack</span>
              <strong>{activeStack.agent.name}</strong>
            </div>
          ) : null}
        </div>

        <div className="stack-grid">
          {defaultAgentStacks.map((stack) => (
            <article
              key={stack.agent.id}
              className={`stack-card ${activeStack?.agent.id === stack.agent.id ? 'active' : ''}`}
            >
              <div className="stack-card-header">
                <div>
                  <span className="kind-pill agent">Agent stack</span>
                  <h3>{stack.agent.name}</h3>
                </div>
                <span className="score-pill">{stack.averageTrust} trust</span>
              </div>
              <p>{stack.agent.description}</p>
              <div className="stack-meta">
                <span>{stack.agent.status}</span>
                <span>{stack.mcps.length} MCPs linked</span>
              </div>
              <div className="stack-links">
                <button type="button" className="stack-link-primary" onClick={() => focusItem(stack.agent.id)}>
                  Open agent
                </button>
                {stack.mcps.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="stack-link"
                    onClick={() => focusItem(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="preset-panel" aria-label="Saved marketplace views">
        <div className="preset-panel-header">
          <div>
            <p className="eyebrow">Workspace presets</p>
            <h2>Jump into the views operators use most often.</h2>
          </div>
          <div className="results-summary">
            <span>{activePreset ? `Preset: ${activePreset.label}` : 'Preset: Custom workspace'}</span>
          </div>
        </div>

        <div className="preset-grid">
          {marketplaceViewPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-card ${activePreset?.id === preset.id ? 'active' : ''}`}
              onClick={() => applyPreset(preset.id)}
            >
              <strong>{preset.label}</strong>
              <p>{preset.description}</p>
              <span>
                {preset.filters.statusFilter === 'all' ? 'Any status' : preset.filters.statusFilter}
                {' • '}
                {preset.filters.categoryFilter}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="workspace-grid">
        <div className="catalog-panel">
          <div className="toolbar">
            <div
              className="segmented-control"
              role="tablist"
              aria-label="Marketplace type filter"
            >
              {kindOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={kindFilter === option.value}
                  className={kindFilter === option.value ? 'active' : ''}
                  disabled={
                    option.value !== 'all' &&
                    (kindCountMap.get(option.value) ?? 0) === 0 &&
                    kindFilter !== option.value
                  }
                  onClick={() => setKindFilter(option.value)}
                >
                  {option.label}
                  {option.value === 'all'
                    ? ` (${crossKindSurfaceItems.length})`
                    : ` (${kindCountMap.get(option.value) ?? 0})`}
                </button>
              ))}
            </div>

            <label className="search-field">
              <span className="sr-only">Search listings</span>
              <input
                type="search"
                placeholder="Search by name, provider, category, or tag"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          <div className="capability-filter" aria-label="Capability filter">
            <button
              type="button"
              className={activeCapability === 'All' ? 'active' : ''}
              onClick={() => setActiveCapability('All')}
            >
              All ({capabilityScopeCount})
            </button>
            {capabilityFacetCounts.map(({ value, count }) => (
              <button
                key={value}
                type="button"
                className={activeCapability === value ? 'active' : ''}
                disabled={count === 0 && activeCapability !== value}
                onClick={() => setActiveCapability(value)}
              >
                {value} ({count})
              </button>
            ))}
          </div>

          <div className="control-row">
            <div className="status-filter" aria-label="Rollout status filter">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={statusFilter === option.value ? 'active' : ''}
                  disabled={
                    option.value !== 'all' &&
                    (statusCountMap.get(option.value) ?? 0) === 0 &&
                    statusFilter !== option.value
                  }
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                  {option.value === 'all'
                    ? ` (${statusScopeCount})`
                    : ` (${statusCountMap.get(option.value) ?? 0})`}
                </button>
              ))}
            </div>

            <label className="sort-field">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="facet-row">
            <label className="facet-field">
              <span>Provider</span>
              <select
                value={providerFilter}
                onChange={(event) => setProviderFilter(event.target.value)}
              >
                <option value="All providers">All providers ({providerScopeCount})</option>
                {providerFacetCounts.map(({ value, count }) => (
                  <option
                    key={value}
                    value={value}
                    disabled={count === 0 && providerFilter !== value}
                  >
                    {value} ({count})
                  </option>
                ))}
              </select>
            </label>

            <label className="facet-field">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="All categories">All categories ({categoryScopeCount})</option>
                {categoryFacetCounts.map(({ value, count }) => (
                  <option
                    key={value}
                    value={value}
                    disabled={count === 0 && categoryFilter !== value}
                  >
                    {value} ({count})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="results-header">
            <div>
              <h2>Catalog</h2>
              <p>
                Showing {filteredItems.length} of {marketplaceItems.length} listings.
              </p>
            </div>
            <div className="results-summary">
              <span>
                {activePreset
                  ? activePreset.label
                  : kindFilter === 'all'
                    ? 'Unified view'
                    : kindFilter === 'agent'
                      ? 'Agent focus'
                      : 'MCP focus'}
              </span>
            </div>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="active-filter-bar" aria-label="Active marketplace filters">
              <div className="active-filter-copy">
                <strong>{activeFilterChips.length} filters active</strong>
                <span>Clear individual constraints or reset the full workspace.</span>
              </div>
              <div className="active-filter-list">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="active-filter-chip"
                    onClick={chip.clear}
                  >
                    {chip.label}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="active-filter-clear"
                  onClick={resetFilters}
                >
                  Clear all
                </button>
              </div>
            </div>
          ) : null}

          {filteredItems.length > 0 ? (
            <div className="catalog-insights" aria-label="Filtered catalog insights">
              <article>
                <span>Average trust</span>
                <strong>{filteredStats.averageTrust}</strong>
                <p>
                  {filteredStats.agents} agents and {filteredStats.mcps} MCPs in the current slice.
                </p>
              </article>
              <article>
                <span>Rollout mix</span>
                <strong>
                  {filteredStatuses.ready} ready / {filteredStatuses.scaling} scaling
                </strong>
                <p>{filteredStatuses.pilot} pilot listings still under tighter controls.</p>
              </article>
              <article>
                <span>Top category</span>
                <strong>{filteredTopCategory?.category ?? 'None'}</strong>
                <p>
                  {filteredTopCategory
                    ? `${filteredTopCategory.count} listing${filteredTopCategory.count > 1 ? 's' : ''} in this focus area.`
                    : 'No categories available for the current filters.'}
                </p>
              </article>
              <article>
                <span>Freshest listing</span>
                <strong>{freshestListing?.name ?? 'None'}</strong>
                <p>{freshestListing?.lastUpdated ?? 'No updates in the current slice.'}</p>
              </article>
              <article>
                <span>Current facet</span>
                <strong>
                  {providerFilter !== 'All providers' ? providerFilter : categoryFilter}
                </strong>
                <p>
                  {providerFilter !== 'All providers'
                    ? 'Provider scope is narrowing the visible workspace.'
                    : categoryFilter !== 'All categories'
                      ? 'Category scope is shaping the active catalog.'
                      : activePreset
                        ? activePreset.description
                        : 'No provider or category facet applied.'}
                </p>
              </article>
            </div>
          ) : null}

          <section className="kind-summary-panel" aria-label="Marketplace kind summary">
            <div className="kind-summary-header">
              <div>
                <h3>Marketplace lanes</h3>
                <p>
                  Keep both listing types in view under the current search, status, provider, and
                  category filters.
                </p>
              </div>
            </div>
            <div className="kind-summary-grid">
              {crossKindSummaries.map((summary) => {
                const isActiveKind =
                  kindFilter === 'all' ? false : kindFilter === summary.kind;
                const topListing = summary.topListing;

                return (
                  <article
                    key={summary.kind}
                    className={`kind-summary-card ${isActiveKind ? 'active' : ''}`}
                  >
                    <div className="kind-summary-card-header">
                      <div>
                        <span className={`kind-pill ${summary.kind}`}>
                          {summary.kind === 'agent' ? 'Agents' : 'MCP servers'}
                        </span>
                        <h4>{summary.count} visible</h4>
                      </div>
                      <span className="score-pill">
                        {summary.averageTrust > 0 ? `${summary.averageTrust} trust` : 'No listings'}
                      </span>
                    </div>
                    <div className="kind-summary-stats">
                      <span>{summary.readyCount} ready</span>
                      <span>{summary.scalingCount} scaling</span>
                      <span>{summary.pilotCount} pilot</span>
                      <span>{summary.liveConnections} links</span>
                    </div>
                    <p className="kind-summary-copy">
                      {summary.topListing
                        ? `Top listing: ${summary.topListing.name} from ${summary.topListing.provider}.`
                        : `No ${summary.kind === 'agent' ? 'agents' : 'MCP servers'} match the current filters.`}
                    </p>
                    <div className="kind-summary-actions">
                      <button
                        type="button"
                        className={isActiveKind ? 'stack-link-primary' : 'stack-link'}
                        onClick={() => {
                          setKindFilter(summary.kind);
                          if (summary.topListing) {
                            setSelectedId(summary.topListing.id);
                          }
                        }}
                      >
                        {isActiveKind
                          ? `Focused on ${summary.kind === 'agent' ? 'agents' : 'MCPs'}`
                          : `Focus ${summary.kind === 'agent' ? 'agents' : 'MCPs'}`}
                      </button>
                      {topListing ? (
                        <button
                          type="button"
                          className="stack-link"
                          onClick={() => focusItem(topListing.id)}
                        >
                          Open top listing
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {counterpartPreview ? (
            <section className="counterpart-panel" aria-label="Hidden counterpart listings">
              <div className="counterpart-header">
                <div>
                  <h3>
                    Also matching {counterpartPreview.counterpartKind === 'agent' ? 'agents' : 'MCP servers'}
                  </h3>
                  <p>
                    These listings still match the current workspace filters, but the active kind
                    view is hiding them.
                  </p>
                </div>
                <button
                  type="button"
                  className="stack-link-primary"
                  onClick={() => {
                    setKindFilter(counterpartPreview.counterpartKind);
                    if (counterpartPreview.visibleItems[0]) {
                      setSelectedId(counterpartPreview.visibleItems[0].id);
                    }
                  }}
                >
                  Switch to {counterpartPreview.counterpartKind === 'agent' ? 'agents' : 'MCPs'}
                </button>
              </div>

              {counterpartPreview.visibleItems.length > 0 ? (
                <div className="counterpart-list">
                  {counterpartPreview.visibleItems.map((item) => (
                    <article key={item.id} className="counterpart-card">
                      <div className="counterpart-card-header">
                        <div>
                          <span className={`kind-pill ${item.kind}`}>
                            {item.kind === 'agent' ? 'Agent' : 'MCP'}
                          </span>
                          <h4>{item.name}</h4>
                        </div>
                        <span className="score-pill">{item.trustScore} trust</span>
                      </div>
                      <p>{item.description}</p>
                      <div className="counterpart-actions">
                        <button
                          type="button"
                          className="stack-link"
                          onClick={() => focusItem(item.id)}
                        >
                          Open details
                        </button>
                        <button
                          type="button"
                          className="stack-link"
                          onClick={() => {
                            setKindFilter(counterpartPreview.counterpartKind);
                            setSelectedId(item.id);
                          }}
                        >
                          Reveal in catalog
                        </button>
                      </div>
                    </article>
                  ))}
                  {counterpartPreview.remainingCount > 0 ? (
                    <div className="counterpart-more">
                      +{counterpartPreview.remainingCount} more matching{' '}
                      {counterpartPreview.counterpartKind === 'agent' ? 'agents' : 'MCP servers'}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="empty-state compact">
                  <h3>No hidden counterpart listings</h3>
                  <p>The current non-kind filters do not leave any matching items on the other side.</p>
                </div>
              )}
            </section>
          ) : null}

          <section className="surface-map-panel" aria-label="Marketplace surface map">
            <div className="surface-map-header">
              <div>
                <h3>Surface map</h3>
                <p>
                  Shows how the current workspace connects agents to MCP servers across the active
                  search and facet filters.
                </p>
              </div>
              <div className="results-summary">
                <span>
                  {surfaceMap.agentRows.length} agent{surfaceMap.agentRows.length === 1 ? '' : 's'} /{' '}
                  {surfaceMap.mcpRows.length} MCP{surfaceMap.mcpRows.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="surface-map-grid">
              <section className="surface-map-column">
                <div className="surface-map-column-header">
                  <h4>Agents and dependencies</h4>
                  <span>Linked MCP surfaces visible in this workspace</span>
                </div>
                {surfaceMap.agentRows.length > 0 ? (
                  <div className="surface-map-list">
                    {surfaceMap.agentRows.map((row) => (
                      <article key={row.item.id} className="surface-map-card">
                        <div className="surface-map-card-header">
                          <button
                            type="button"
                            className="surface-map-item"
                            onClick={() => focusItem(row.item.id)}
                          >
                            <span className="kind-pill agent">Agent</span>
                            <strong>{row.item.name}</strong>
                          </button>
                          <span className="surface-map-meta">
                            {row.connectedItems.length} MCP
                            {row.connectedItems.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {row.connectedItems.length > 0 ? (
                          <div className="surface-map-links">
                            {row.connectedItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="tag-chip surface-map-link"
                                onClick={() => focusItem(item.id)}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="surface-map-empty">
                            No MCP servers remain visible for this agent under the current filters.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <h3>No agents in view</h3>
                    <p>Broaden the active filters to bring agent listings back into the map.</p>
                  </div>
                )}
              </section>

              <section className="surface-map-column">
                <div className="surface-map-column-header">
                  <h4>MCP servers and consumers</h4>
                  <span>Agent listings currently linked to each MCP</span>
                </div>
                {surfaceMap.mcpRows.length > 0 ? (
                  <div className="surface-map-list">
                    {surfaceMap.mcpRows.map((row) => (
                      <article key={row.item.id} className="surface-map-card">
                        <div className="surface-map-card-header">
                          <button
                            type="button"
                            className="surface-map-item"
                            onClick={() => focusItem(row.item.id)}
                          >
                            <span className="kind-pill mcp">MCP</span>
                            <strong>{row.item.name}</strong>
                          </button>
                          <span className="surface-map-meta">
                            {row.connectedItems.length} agent
                            {row.connectedItems.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {row.connectedItems.length > 0 ? (
                          <div className="surface-map-links">
                            {row.connectedItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="tag-chip surface-map-link"
                                onClick={() => focusItem(item.id)}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="surface-map-empty">
                            No agent listings remain visible for this MCP under the current filters.
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <h3>No MCP servers in view</h3>
                    <p>Broaden the active filters to bring MCP listings back into the map.</p>
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="compare-panel" aria-label="Comparison tray">
            <div className="compare-panel-header">
              <div>
                <h3>Compare listings</h3>
                <p>
                  Pin up to {maxComparedItems} agents or MCP servers to compare trust, status,
                  updates, and linked surfaces.
                </p>
              </div>
              <div className="compare-panel-actions">
                {comparedItems.length > 0 ? (
                  <div className="results-summary compare-visibility-summary">
                    <span>
                      {compareWorkspace.visibleCount} in workspace
                      {compareWorkspace.hiddenCount > 0
                        ? ` / ${compareWorkspace.hiddenCount} hidden`
                        : ''}
                    </span>
                  </div>
                ) : null}
                {comparedItems.length > 0 ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => setComparedIds([])}
                  >
                    Clear compare
                  </button>
                ) : null}
              </div>
            </div>

            {comparedItems.length > 0 ? (
              <>
                <div className="compare-summary-grid">
                  <article className="compare-summary-card">
                    <span>Trust leader</span>
                    <strong>{getComparedNames(compareInsights.trustLeaderIds)}</strong>
                    <p>Highest trust score across the pinned set.</p>
                  </article>
                  <article className="compare-summary-card">
                    <span>Fastest latency</span>
                    <strong>{getComparedNames(compareInsights.latencyLeaderIds)}</strong>
                    <p>Lowest median response time in the tray.</p>
                  </article>
                  <article className="compare-summary-card">
                    <span>Freshest update</span>
                    <strong>{getComparedNames(compareInsights.freshnessLeaderIds)}</strong>
                    <p>Most recently updated listing among pinned records.</p>
                  </article>
                  <article className="compare-summary-card">
                    <span>Most linked</span>
                    <strong>{getComparedNames(compareInsights.linkLeaderIds)}</strong>
                    <p>Greatest number of connected marketplace surfaces.</p>
                  </article>
                </div>

                <div className="compare-grid">
                  {compareWorkspace.items.map(({ item, isVisible }) => {
                    const insight = compareInsightMap.get(item.id);

                    return (
                      <article
                        key={item.id}
                        className={`compare-card ${isVisible ? '' : 'hidden-state'}`}
                      >
                        <div className="compare-card-header">
                          <div className="compare-title-group">
                            <span className={`kind-pill ${item.kind}`}>
                              {item.kind === 'agent' ? 'Agent' : 'MCP'}
                            </span>
                            <div className="compare-badge-row">
                              {!isVisible ? (
                                <span className="compare-badge compare-visibility-badge">
                                  Hidden by filters
                                </span>
                              ) : null}
                              {insight?.isTrustLeader ? (
                                <span className="compare-badge">Trust leader</span>
                              ) : null}
                              {insight?.isLatencyLeader ? (
                                <span className="compare-badge">Fastest</span>
                              ) : null}
                              {insight?.isFreshnessLeader ? (
                                <span className="compare-badge">Freshest</span>
                              ) : null}
                              {insight?.isLinkLeader ? (
                                <span className="compare-badge">Most linked</span>
                              ) : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="compare-remove"
                            onClick={() => toggleCompare(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <h4>{item.name}</h4>
                        {!isVisible ? (
                          <p className="compare-visibility-note">
                            This pinned listing is outside the current catalog slice. Reveal it to
                            bring it back into the workspace.
                          </p>
                        ) : null}
                        <dl className="compare-metrics">
                          <div className={insight?.isTrustLeader ? 'leader' : ''}>
                            <dt>Trust</dt>
                            <dd>{item.trustScore}</dd>
                            <small>
                              {renderGapLabel(
                                Boolean(insight?.isTrustLeader),
                                insight?.trustGap ?? 0,
                                ''
                              )}
                            </small>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd>{item.status}</dd>
                            <small>
                              {item.kind === 'agent' ? 'Agent rollout state' : 'MCP rollout state'}
                            </small>
                          </div>
                          <div className={insight?.isLatencyLeader ? 'leader' : ''}>
                            <dt>Latency</dt>
                            <dd>{item.latency}</dd>
                            <small>
                              {renderGapLabel(
                                Boolean(insight?.isLatencyLeader),
                                Math.round((insight?.latencyGapMs ?? 0) / 10) / 100,
                                's'
                              )}
                            </small>
                          </div>
                          <div className={insight?.isFreshnessLeader ? 'leader' : ''}>
                            <dt>Updated</dt>
                            <dd>{item.lastUpdated}</dd>
                            <small>
                              {renderGapLabel(
                                Boolean(insight?.isFreshnessLeader),
                                insight?.freshnessGapDays ?? 0,
                                'd'
                              )}
                            </small>
                          </div>
                          <div className={insight?.isLinkLeader ? 'leader' : ''}>
                            <dt>Links</dt>
                            <dd>{item.linkedItemIds.length}</dd>
                            <small>
                              {renderGapLabel(
                                Boolean(insight?.isLinkLeader),
                                insight?.linkGap ?? 0,
                                ''
                              )}
                            </small>
                          </div>
                        </dl>
                        <div className="compare-actions">
                          <button
                            type="button"
                            className="stack-link-primary"
                            onClick={() => focusItem(item.id)}
                          >
                            {isVisible ? 'Open details' : 'Reveal in catalog'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state compare-empty">
                <h3>No comparisons yet.</h3>
                <p>Select `Compare` on a few cards or from the detail panel to build a quick side-by-side view.</p>
              </div>
            )}
          </section>

          <div className="card-grid">
            {filteredItems.map((item) => {
              const isCompared = comparedIds.includes(item.id);
              const relationshipPreview = relationshipPreviewMap.get(item.id);

              return (
                <article
                  key={item.id}
                  className={`market-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                >
                  <button type="button" className="market-card-main" onClick={() => setSelectedId(item.id)}>
                    <div className="market-card-header">
                      <span className={`kind-pill ${item.kind}`}>
                        {item.kind === 'agent' ? 'Agent' : 'MCP'}
                      </span>
                      <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <dl>
                      <div>
                        <dt>Owner</dt>
                        <dd>{item.owner}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{item.lastUpdated}</dd>
                      </div>
                      <div>
                        <dt>Usage</dt>
                        <dd>{item.usageVolume}</dd>
                      </div>
                      <div>
                        <dt>Links</dt>
                        <dd>{item.linkedItemIds.length}</dd>
                      </div>
                    </dl>
                  </button>
                  <div className="market-card-preview">
                    <span className="market-card-preview-label">Connected surfaces in workspace</span>
                    {relationshipPreview && relationshipPreview.visibleItems.length > 0 ? (
                      <div className="market-card-preview-links">
                        {relationshipPreview.visibleItems.map((relatedItem) => (
                          <button
                            key={relatedItem.id}
                            type="button"
                            className="tag-chip market-card-preview-chip"
                            onClick={() => focusItem(relatedItem.id)}
                          >
                            {relatedItem.name}
                          </button>
                        ))}
                        {relationshipPreview.remainingCount > 0 ? (
                          <span className="market-card-preview-more">
                            +{relationshipPreview.remainingCount} more
                          </span>
                        ) : null}
                        {relationshipPreview.hiddenCount > 0 ? (
                          <span className="market-card-preview-more">
                            +{relationshipPreview.hiddenCount} hidden
                          </span>
                        ) : null}
                      </div>
                    ) : relationshipPreview && relationshipPreview.hiddenCount > 0 ? (
                      <p className="market-card-preview-empty">
                        Linked surfaces exist, but they are hidden by the current workspace filters.
                      </p>
                    ) : (
                      <p className="market-card-preview-empty">
                        No linked agent or MCP surfaces available for this listing.
                      </p>
                    )}
                  </div>
                  <div className="market-card-actions">
                    <button type="button" className="stack-link" onClick={() => focusItem(item.id)}>
                      Inspect
                    </button>
                    <button
                      type="button"
                      className={isCompared ? 'stack-link-primary' : 'stack-link'}
                      onClick={() => toggleCompare(item.id)}
                    >
                      {isCompared ? 'Compared' : 'Compare'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>No listings match.</h3>
              <p>Try broadening the text search or clearing the capability filter.</p>
              <button type="button" className="secondary-action" onClick={resetFilters}>
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>

        <aside className="detail-panel" aria-live="polite">
          {selectedItem ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">
                    {selectedItem.kind === 'agent' ? 'Agent profile' : 'MCP profile'}
                  </p>
                  <h2>{selectedItem.name}</h2>
                </div>
                <div
                  className="trust-ring"
                  style={trustRingStyle}
                >
                  <span>{selectedItem.trustScore}</span>
                  <small>Trust</small>
                </div>
              </div>

              <p className="detail-description">{selectedItem.description}</p>

              <div className="detail-metadata">
                <article>
                  <h3>Owner</h3>
                  <p>{selectedItem.owner}</p>
                </article>
                <article>
                  <h3>Provider</h3>
                  <p>{selectedItem.provider}</p>
                </article>
                <article>
                  <h3>Latency</h3>
                  <p>{selectedItem.latency}</p>
                </article>
                <article>
                  <h3>Last updated</h3>
                  <p>{selectedItem.lastUpdated}</p>
                </article>
              </div>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Capabilities</h3>
                  <span>{selectedItem.category}</span>
                </div>
                <div className="tag-row">
                  {selectedItem.capabilities.map((capability) => (
                    <button
                      key={capability}
                      type="button"
                      className={`tag-chip accent detail-filter-chip ${
                        activeCapability === capability ? 'active' : ''
                      }`}
                      onClick={() => applyContextFilter({ activeCapability: capability })}
                    >
                      {capability}
                    </button>
                  ))}
                </div>
              </section>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Explore similar</h3>
                  <span>Refine the catalog from this listing</span>
                </div>
                <div className="tag-row">
                  <button
                    type="button"
                    className={`tag-chip detail-filter-chip ${
                      kindFilter === selectedItem.kind ? 'active' : ''
                    }`}
                    onClick={() => applyContextFilter({ kindFilter: selectedItem.kind })}
                  >
                    {selectedItem.kind === 'agent' ? 'Agents only' : 'MCPs only'}
                  </button>
                  <button
                    type="button"
                    className={`tag-chip detail-filter-chip ${
                      statusFilter === selectedItem.status ? 'active' : ''
                    }`}
                    onClick={() => applyContextFilter({ statusFilter: selectedItem.status })}
                  >
                    Status: {selectedItem.status}
                  </button>
                  <button
                    type="button"
                    className={`tag-chip detail-filter-chip ${
                      providerFilter === selectedItem.provider ? 'active' : ''
                    }`}
                    onClick={() => applyContextFilter({ providerFilter: selectedItem.provider })}
                  >
                    Provider: {selectedItem.provider}
                  </button>
                  <button
                    type="button"
                    className={`tag-chip detail-filter-chip ${
                      categoryFilter === selectedItem.category ? 'active' : ''
                    }`}
                    onClick={() => applyContextFilter({ categoryFilter: selectedItem.category })}
                  >
                    Category: {selectedItem.category}
                  </button>
                </div>
              </section>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Comparison</h3>
                  <span>{comparedIds.includes(selectedItem.id) ? 'Pinned' : 'Not pinned'}</span>
                </div>
                <div className="detail-actions">
                  <button
                    type="button"
                    className={comparedIds.includes(selectedItem.id) ? 'stack-link-primary' : 'stack-link'}
                    onClick={() => toggleCompare(selectedItem.id)}
                  >
                    {comparedIds.includes(selectedItem.id) ? 'Remove from compare' : 'Add to compare'}
                  </button>
                </div>
              </section>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Deployment stack</h3>
                  <span>{activeStack ? `${activeStack.mcps.length + 1} services` : 'Standalone listing'}</span>
                </div>
                {activeStack ? (
                  <div className="stack-context">
                    <div className="stack-context-summary">
                      <span className="kind-pill agent">Primary agent</span>
                      <strong>{activeStack.agent.name}</strong>
                      <p>
                        {activeStack.averageTrust} average trust across the agent and linked MCP
                        surfaces.
                      </p>
                    </div>
                    <div className="stack-context-links">
                      {selectedItem.id !== activeStack.agent.id ? (
                        <button
                          type="button"
                          className="stack-link-primary"
                          onClick={() => focusItem(activeStack.agent.id)}
                        >
                          Open {activeStack.agent.name}
                        </button>
                      ) : null}
                      {stackCompanions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="stack-link"
                          onClick={() => focusItem(item.id)}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <h3>No linked stack</h3>
                    <p>This listing currently stands on its own without linked MCP dependencies.</p>
                  </div>
                )}
              </section>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Connected listings</h3>
                  <span>{relatedContext?.totalCount ?? relatedItems.length} linked</span>
                </div>
                {relatedContext?.hiddenCount ? (
                  <p className="detail-section-note">
                    {relatedContext.hiddenCount} linked listing
                    {relatedContext.hiddenCount === 1 ? ' is' : 's are'} hidden by the current
                    workspace filters.
                  </p>
                ) : null}
                {relatedItems.length > 0 ? (
                  <div className="related-list">
                    {relatedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="related-card"
                        onClick={() => focusItem(item.id)}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.kind === 'agent' ? 'Agent' : 'MCP'} • {item.category}</p>
                        </div>
                        <span>{item.trustScore}</span>
                      </button>
                    ))}
                  </div>
                ) : relatedContext && relatedContext.totalCount > 0 ? (
                  <div className="empty-state compact">
                    <h3>No connected listings in view</h3>
                    <p>Linked agents or MCP servers exist, but the current workspace is hiding them.</p>
                    <button type="button" className="secondary-action" onClick={revealRelatedItems}>
                      Reveal linked listings
                    </button>
                  </div>
                ) : (
                  <div className="empty-state compact">
                    <h3>No connected listings</h3>
                    <p>This marketplace record does not currently expose any linked agents or MCP servers.</p>
                  </div>
                )}
              </section>

              <section className="detail-section">
                <div className="section-header">
                  <h3>Governance checks</h3>
                  <span>{selectedItem.status}</span>
                </div>
                <ul className="checklist">
                  {selectedItem.governance.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-section">
                <h3>Tags</h3>
                <div className="tag-row">
                  {selectedItem.tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            </>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>No listings match.</h3>
              <p>
                Broaden the search, remove an active filter, or reset the workspace to return to
                the full agent and MCP catalog.
              </p>
              <button type="button" className="stack-link-primary" onClick={resetFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nothing selected.</h3>
              <p>Choose an agent or MCP listing from the catalog to inspect it.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
