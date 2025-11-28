export interface OmnisendContact {
  identity: {
    contactID: string
    email: string
    createdAt: string
  }
  personalInfo: {
    firstName?: string
    lastName?: string
    phone?: string | string[]
    birthdate?: string
    gender?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    countryCode?: string
  }
  subscription: {
    status: string
    tags?: string[]
    statuses?: Array<{
      channel: string
      status: string
      date: string
    }>
    optIns?: Array<{
      channel: string
      date: string
    }>
    consents?: Array<{
      channel: string
      source: string
      ip?: string
      userAgent?: string
      createdAt: string
    }>
  }
  meta?: {
    customProperties?: Record<string, unknown>
    identifiers?: Array<{
      id: string
      type: string
      channels: Record<string, unknown>
    }>
  }
}

export interface OmnisendProduct {
  productDetails: {
    productID: string
    title: string
    description?: string
    vendor?: string
    type?: string
    categoryIDs?: string[]
    tags?: string[] | null
  }
  status: {
    status: string
  }
  media: {
    images?: Array<{
      imageID: string
      url: string
      isDefault: boolean
      variantIDs?: string[]
    }>
  }
  pricingAndVariants: {
    currency: string
    variants?: Array<{
      variantID: string
      title: string
      sku?: string
      price: number
      oldPrice?: number
      status: string
      productUrl?: string
      imageID?: string
    }>
  }
  links: {
    productUrl?: string
  }
  dates: {
    createdAt: string
    updatedAt: string
  }
}

export interface OmnisendCampaign {
  identifiers: {
    campaignID: string
    name: string
    type: string
  }
  status: string
  emailMetadata: {
    fromName?: string
    subject?: string
  }
  timing: {
    createdAt: string
    startDate?: string
    endDate?: string
    updatedAt: string
  }
  performanceMetrics: {
    sent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
    complained: number
  }
  targeting: {
    allContacts?: boolean
    segments?: string[] | null
    excludedSegments?: string[] | null
  }
  deviceBreakdown?: {
    byDevices: {
      opened: {
        mobile: number
        tablet: number
        desktop: number
      }
      clicked: {
        mobile: number
        tablet: number
        desktop: number
      }
    }
  }
}

export interface OmnisendOrder {
  identityAndSource: {
    orderID: string
    orderNumber: number
    email: string
    phone?: string
    contactID: string
    cartID?: string
    source?: string
    trackingCode?: string
    attributionID?: string
  }
  financials: {
    currency: string
    orderSum: number
    subTotalSum: number
    subTotalTaxIncluded?: boolean
    discountSum?: number
    taxSum?: number
    paymentStatus?: string
    paymentMethod?: string
    discountCode?: string
    discountType?: string
    discountValue?: number
    shippingSum?: number
    shippingMethod?: string
  }
  timestamps: {
    createdAt: string
    updatedAt: string
    canceledDate?: string | null
    cancelReason?: string
  }
  addresses: {
    billingAddress?: OmnisendAddress
    shippingAddress?: OmnisendAddress
  }
  fulfillment: {
    fulfillmentStatus: string
    courierTitle?: string
    courierUrl?: string
    orderUrl?: string
  }
  products: OmnisendOrderProduct[]
  miscellaneous?: {
    tags?: string[]
    depersonalized?: boolean
    contactNote?: string
  }
}

export interface OmnisendAddress {
  firstName?: string
  lastName?: string
  country?: string
  state?: string
  city?: string
  address?: string
  postalCode?: string
  phone?: string
}

export interface OmnisendOrderProduct {
  productID: string
  variantID?: string
  title: string
  quantity: number
  price: number
  discount?: number
  weight?: number
  sku?: string
  vendor?: string
  productUrl?: string
  categoryIDs?: string[] | null
  tags?: string[] | null
}

export interface OmnisendAutomation {
  automationDetails: {
    id: string
    name: string
    status: string
    trigger: string
    createdAt: string
    updatedAt: string
  }
  messages?: Array<{
    id: string
    title: string
    channel: string
  }>
}

export type OmnisendDataType =
  | 'contacts'
  | 'products'
  | 'campaigns'
  | 'orders'
  | 'automations'

export interface OmnisendApiResponse<T> {
  data: T[]
  paging?: {
    previous?: string
    next?: string
  }
}

export const OMNISEND_ENDPOINTS = {
  contacts: '/v3/contacts',
  products: '/v3/products',
  campaigns: '/v3/campaigns',
  orders: '/v3/orders',
  automations: '/v5/automations',
} as const

export const OMNISEND_DATA_CATEGORIES = {
  contacts: 'contacts',
  products: 'products',
  campaigns: 'campaigns',
  orders: 'orders',
  automations: 'automations',
} as const
