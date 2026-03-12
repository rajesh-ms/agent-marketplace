export type MarketplaceKind = 'agent' | 'mcp';
export type MarketplaceStatus = 'Ready' | 'Pilot' | 'Scaling';

export interface MarketplaceItem {
  id: string;
  name: string;
  kind: MarketplaceKind;
  category: string;
  owner: string;
  description: string;
  provider: string;
  tags: string[];
  capabilities: string[];
  linkedItemIds: string[];
  governance: string[];
  usageVolume: string;
  status: MarketplaceStatus;
  latency: string;
  trustScore: number;
  lastUpdated: string;
}
