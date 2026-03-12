import { MarketplaceItem } from '../types';

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'agent-deal-desk',
    name: 'Deal Desk Analyst',
    kind: 'agent',
    category: 'Revenue',
    owner: 'RevOps Automation',
    description:
      'Reviews enterprise quotes, flags margin risk, and drafts approval notes for finance and sales leadership.',
    provider: 'Symphony Core',
    tags: ['pricing', 'quotes', 'approval'],
    capabilities: ['Policy checks', 'Context summarization', 'Workflow routing'],
    linkedItemIds: ['mcp-crm', 'mcp-docs'],
    governance: ['Human approval required above 20% discount', 'Citations attached to quote review'],
    usageVolume: '412 runs/day',
    status: 'Scaling',
    latency: '2.1s median',
    trustScore: 94,
    lastUpdated: 'March 8, 2026'
  },
  {
    id: 'agent-support-triage',
    name: 'Support Triage Copilot',
    kind: 'agent',
    category: 'Support',
    owner: 'CX Engineering',
    description:
      'Classifies inbound incidents, proposes severity, and recommends a next-best action for human responders.',
    provider: 'Assist Labs',
    tags: ['service desk', 'classification', 'sla'],
    capabilities: ['Ticket enrichment', 'Priority prediction', 'Suggested response'],
    linkedItemIds: ['mcp-docs', 'mcp-observability'],
    governance: ['Escalates sev-1 changes to on-call lead', 'Masks customer PII in suggested replies'],
    usageVolume: '1.2k sessions/day',
    status: 'Ready',
    latency: '1.4s median',
    trustScore: 91,
    lastUpdated: 'March 10, 2026'
  },
  {
    id: 'agent-risk-ops',
    name: 'Risk Ops Sentinel',
    kind: 'agent',
    category: 'Compliance',
    owner: 'Trust and Compliance',
    description:
      'Monitors operational changes, highlights policy drift, and prepares a compact audit trail for reviewers.',
    provider: 'Northstar AI',
    tags: ['risk', 'audit', 'change control'],
    capabilities: ['Drift detection', 'Timeline generation', 'Evidence packaging'],
    linkedItemIds: ['mcp-docs', 'mcp-observability'],
    governance: ['Evidence packet retained for 90 days', 'Analyst sign-off required before closure'],
    usageVolume: '186 investigations/week',
    status: 'Pilot',
    latency: '3.6s median',
    trustScore: 88,
    lastUpdated: 'March 5, 2026'
  },
  {
    id: 'mcp-crm',
    name: 'Salesforce MCP',
    kind: 'mcp',
    category: 'CRM',
    owner: 'Enterprise Platforms',
    description:
      'Provides governed access to accounts, opportunities, and activities for agents that need customer context.',
    provider: 'Marketplace Verified',
    tags: ['salesforce', 'accounts', 'activities'],
    capabilities: ['Read records', 'Write notes', 'Schema discovery'],
    linkedItemIds: ['agent-deal-desk'],
    governance: ['Write operations restricted to marketplace-approved agents', 'Field-level permissions inherit CRM policy'],
    usageVolume: '38 connected agents',
    status: 'Ready',
    latency: '280ms median',
    trustScore: 96,
    lastUpdated: 'March 11, 2026'
  },
  {
    id: 'mcp-docs',
    name: 'Confluence MCP',
    kind: 'mcp',
    category: 'Knowledge',
    owner: 'Knowledge Systems',
    description:
      'Indexes internal docs and meeting notes so agents can retrieve grounded answers with source provenance.',
    provider: 'Marketplace Verified',
    tags: ['confluence', 'wiki', 'retrieval'],
    capabilities: ['Search', 'Page retrieval', 'Source citation'],
    linkedItemIds: ['agent-deal-desk', 'agent-support-triage', 'agent-risk-ops'],
    governance: ['Results include source provenance', 'Private spaces require scoped service identities'],
    usageVolume: '64 connected agents',
    status: 'Scaling',
    latency: '420ms median',
    trustScore: 92,
    lastUpdated: 'March 9, 2026'
  },
  {
    id: 'mcp-observability',
    name: 'Datadog MCP',
    kind: 'mcp',
    category: 'Observability',
    owner: 'SRE Platform',
    description:
      'Streams metrics, traces, and incident context into agents that diagnose production issues in real time.',
    provider: 'Telemetry Works',
    tags: ['datadog', 'metrics', 'incident'],
    capabilities: ['Metric queries', 'Trace lookups', 'Alert history'],
    linkedItemIds: ['agent-support-triage', 'agent-risk-ops'],
    governance: ['Production mutating actions disabled', 'Audit log exported to SIEM every 15 minutes'],
    usageVolume: '22 connected agents',
    status: 'Pilot',
    latency: '350ms median',
    trustScore: 89,
    lastUpdated: 'March 7, 2026'
  }
];
