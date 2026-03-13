import { useMemo, useState } from 'react';
import { marketplaceItems } from '../data/marketplace';
import {
  defaultAgentStacks,
  defaultCategories,
  defaultFeaturedItems,
  defaultMarketplaceStats,
  defaultProviders,
  defaultStatusSummary,
  defaultTopCategories,
  filterMarketplaceItems,
  getCompareInsights,
  getComparedItems,
  getMarketplaceStats,
  getRelatedItems,
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

const capabilityOptions = [
  'Workflow routing',
  'Priority prediction',
  'Drift detection',
  'Schema discovery',
  'Source citation',
  'Alert history'
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
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

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

  const selectedItem = resolveSelectedItem(filteredItems, selectedId);
  const relatedItems = selectedItem ? getRelatedItems(marketplaceItems, selectedItem) : [];
  const comparedItems = getComparedItems(marketplaceItems, comparedIds);
  const compareInsights = getCompareInsights(comparedItems);
  const compareInsightMap = new Map(
    compareInsights.itemInsights.map((insight) => [insight.itemId, insight])
  );
  const filteredStats = getMarketplaceStats(filteredItems);
  const filteredStatuses = getStatusSummary(filteredItems);
  const filteredTopCategory = getTopCategories(filteredItems)[0];
  const freshestListing = filteredItems[0] ?? null;
  const activeStack = defaultAgentStacks.find(
    (stack) =>
      stack.agent.id === selectedItem?.id || stack.mcps.some((item) => item.id === selectedItem?.id)
  );
  const activePreset = marketplaceViewPresets.find((preset) => preset.id === activePresetId) ?? null;
  const stackCompanions = activeStack
    ? [activeStack.agent, ...activeStack.mcps].filter((item) => item.id !== selectedItem?.id)
    : [];

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

  const clearPresetSelection = () => {
    setActivePresetId(null);
  };

  const focusItem = (itemId: string) => {
    setKindFilter(defaultFilters.kindFilter);
    setSearchValue(defaultFilters.searchValue);
    setActiveCapability(defaultFilters.activeCapability);
    setStatusFilter(defaultFilters.statusFilter);
    setProviderFilter(defaultFilters.providerFilter);
    setCategoryFilter(defaultFilters.categoryFilter);
    setSortBy('trust');
    setActivePresetId(null);
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
    setActivePresetId(null);
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
    setActivePresetId(preset.id);
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
              className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
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
                  onClick={() => {
                    clearPresetSelection();
                    setKindFilter(option.value);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="search-field">
              <span className="sr-only">Search listings</span>
              <input
                type="search"
                placeholder="Search by name, provider, category, or tag"
                value={searchValue}
                onChange={(event) => {
                  clearPresetSelection();
                  setSearchValue(event.target.value);
                }}
              />
            </label>
          </div>

          <div className="capability-filter" aria-label="Capability filter">
            <button
              type="button"
              className={activeCapability === 'All' ? 'active' : ''}
              onClick={() => {
                clearPresetSelection();
                setActiveCapability('All');
              }}
            >
              All
            </button>
            {capabilityOptions.map((capability) => (
              <button
                key={capability}
                type="button"
                className={activeCapability === capability ? 'active' : ''}
                onClick={() => {
                  clearPresetSelection();
                  setActiveCapability(capability);
                }}
              >
                {capability}
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
                  onClick={() => {
                    clearPresetSelection();
                    setStatusFilter(option.value);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="sort-field">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => {
                  clearPresetSelection();
                  setSortBy(event.target.value as typeof sortBy);
                }}
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
                onChange={(event) => {
                  clearPresetSelection();
                  setProviderFilter(event.target.value);
                }}
              >
                <option value="All providers">All providers</option>
                {defaultProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </label>

            <label className="facet-field">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  clearPresetSelection();
                  setCategoryFilter(event.target.value);
                }}
              >
                <option value="All categories">All categories</option>
                {defaultCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="results-header">
            <div>
              <h2>Catalog</h2>
              <p>{filteredItems.length} listings match the current filters.</p>
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

          <section className="compare-panel" aria-label="Comparison tray">
            <div className="compare-panel-header">
              <div>
                <h3>Compare listings</h3>
                <p>
                  Pin up to {maxComparedItems} agents or MCP servers to compare trust, status,
                  updates, and linked surfaces.
                </p>
              </div>
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
                  {comparedItems.map((item) => {
                    const insight = compareInsightMap.get(item.id);

                    return (
                      <article key={item.id} className="compare-card">
                        <div className="compare-card-header">
                          <div className="compare-title-group">
                            <span className={`kind-pill ${item.kind}`}>
                              {item.kind === 'agent' ? 'Agent' : 'MCP'}
                            </span>
                            <div className="compare-badge-row">
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
                            Open details
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
                <div className="trust-ring">
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
                    <span key={capability} className="tag-chip accent">
                      {capability}
                    </span>
                  ))}
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
                  <span>{relatedItems.length} linked</span>
                </div>
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
