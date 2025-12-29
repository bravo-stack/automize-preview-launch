// ============================================================================
// Media Buyer Dashboard Types
// ============================================================================

import type { ApiRecordAttribute, ApiRecordMetric } from './api-storage'

// ============================================================================
// Client Data Types
// ============================================================================

export interface MediaBuyerClient {
  id: number
  brand: string
  pod: string | null
  full_name: string | null
  email: string | null
  phone_number: string | null
  website: string | null
  status: string | null
  store_id: string | null
  is_monitored: boolean
  instagram: string | null
  rebill_date: string | null
  drive: string | null
}

// ============================================================================
// Theme Data Types (from Shopify)
// ============================================================================

export interface ThemeData {
  id: string
  external_id: string
  name: string | null
  status: string | null // role: main, unpublished, etc.
  category: string | null
  record_date: string | null
  extra: {
    store_id?: string
    brand_name?: string
    theme_store_id?: number | null
    previewable?: boolean
    processing?: boolean
    admin_graphql_api_id?: string
  } | null
  attributes: ThemeAttribute[]
}

export interface ThemeAttribute {
  attribute_name: string
  attribute_value: unknown
}

// ============================================================================
// Omnisend Data Types
// ============================================================================

export interface OmnisendOrderData {
  id: string
  external_id: string
  name: string | null
  email: string | null
  status: string | null
  tags: string[] | null
  amount: number | null
  record_date: string | null
  attributes: ApiRecordAttribute[]
}

export interface OmnisendAutomationData {
  id: string
  external_id: string
  name: string | null
  status: string | null
  record_date: string | null
}

export interface OmnisendCampaignData {
  id: string
  external_id: string
  name: string | null
  status: string | null
  record_date: string | null
  metrics: ApiRecordMetric[]
  attributes: ApiRecordAttribute[]
}

export interface OmnisendContactData {
  id: string
  external_id: string
  name: string | null
  email: string | null
  status: string | null
  tags: string[] | null
  record_date: string | null
  attributes: ApiRecordAttribute[]
}

export interface OmnisendProductData {
  id: string
  external_id: string
  name: string | null
  status: string | null
  category: string | null
  tags: string[] | null
  record_date: string | null
  attributes: ApiRecordAttribute[]
}

// ============================================================================
// Aggregated Metrics
// ============================================================================

export interface OmnisendRevenueSummary {
  totalRevenue: number
  orderCount: number
  averageOrderValue: number
  currency: string
}

export interface CampaignMetricsSummary {
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  totalUnsubscribed: number
  openRate: number
  clickRate: number
  bounceRate: number
}

export interface AutomationPerformance {
  automationId: string
  automationName: string
  status: string
  // Revenue attributed (if mapped from orders)
  attributedRevenue?: number
  attributedOrders?: number
}

// ============================================================================
// Full Client Data Response
// ============================================================================

export interface ClientDataResponse {
  client: MediaBuyerClient
  theme: ThemeData | null
  omnisend: {
    orders: OmnisendOrderData[]
    automations: OmnisendAutomationData[]
    campaigns: OmnisendCampaignData[]
    contacts: OmnisendContactData[]
    products: OmnisendProductData[]
    revenueSummary: OmnisendRevenueSummary
    campaignMetrics: CampaignMetricsSummary
  }
  lastUpdated: {
    theme: string | null
    omnisendOrders: string | null
    omnisendAutomations: string | null
    omnisendCampaigns: string | null
    omnisendContacts: string | null
    omnisendProducts: string | null
  }
}

// ============================================================================
// API Source Categories for Media Buyer View
// ============================================================================

export type ApiSourceCategory =
  | 'theme'
  | 'omnisend-orders'
  | 'omnisend-automations'
  | 'omnisend-campaigns'
  | 'omnisend-contacts'
  | 'omnisend-products'

export interface ApiSourceInfo {
  provider: string
  endpoint: string
  displayName: string
  category: ApiSourceCategory
}

export const API_SOURCE_MAPPING: Record<string, ApiSourceInfo> = {
  'shopify:themes': {
    provider: 'shopify',
    endpoint: 'themes',
    displayName: 'Shopify Themes',
    category: 'theme',
  },
  'omnisend:orders': {
    provider: 'omnisend',
    endpoint: 'orders',
    displayName: 'Omnisend Orders',
    category: 'omnisend-orders',
  },
  'omnisend:automations': {
    provider: 'omnisend',
    endpoint: 'automations',
    displayName: 'Omnisend Automations',
    category: 'omnisend-automations',
  },
  'omnisend:campaigns': {
    provider: 'omnisend',
    endpoint: 'campaigns',
    displayName: 'Omnisend Campaigns',
    category: 'omnisend-campaigns',
  },
  'omnisend:contacts': {
    provider: 'omnisend',
    endpoint: 'contacts',
    displayName: 'Omnisend Contacts',
    category: 'omnisend-contacts',
  },
  'omnisend:products': {
    provider: 'omnisend',
    endpoint: 'products',
    displayName: 'Omnisend Products',
    category: 'omnisend-products',
  },
}
