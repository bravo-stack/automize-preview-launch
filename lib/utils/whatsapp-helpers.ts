// WhatsApp Helper Utilities

// Delay utility for rate limiting
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Rate limit config (Twilio supports 80 MPS, we use conservative 10 MPS)
export const WHATSAPP_RATE_LIMITS = {
  MESSAGE_DELAY_MS: 100, // 1 msg per 100ms = 10 MPS
  BATCH_SIZE: 50, // Messages before longer pause
  BATCH_DELAY_MS: 2000, // Pause between batches
} as const

// Validates and cleans phone number to E.164 format, returns null if invalid
export function validateAndCleanPhoneNumber(
  phoneNumber: string | null | undefined,
): string | null {
  if (!phoneNumber) return null

  // Remove whatsapp: prefix if present
  let cleaned = phoneNumber.replace('whatsapp:', '').trim()

  // Remove common formatting characters
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '')

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`
  }

  // E.164: starts with +, 8-15 digits, first digit non-zero
  const e164Regex = /^\+[1-9]\d{7,14}$/

  if (!e164Regex.test(cleaned)) {
    return null
  }

  return cleaned
}

// Quick validation check without cleaning
export function isValidPhoneNumberFormat(
  phoneNumber: string | null | undefined,
): boolean {
  return validateAndCleanPhoneNumber(phoneNumber) !== null
}

// Get status callback URL for delivery tracking
export function getStatusCallbackUrl(): string | undefined {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    process.env.APP_URL

  if (!baseUrl) {
    console.warn(
      '[WhatsApp] No base URL configured for status callbacks. Set NEXT_PUBLIC_APP_URL environment variable.',
    )
    return undefined
  }

  const normalizedBase = baseUrl.startsWith('http')
    ? baseUrl
    : `https://${baseUrl}`

  return `${normalizedBase}/api/whatsapp/status-callback`
}

// Simplified delivery status categories
export type SimplifiedDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'

// Maps Twilio status to simplified category
export function getSimplifiedStatus(
  twilioStatus: string | undefined,
): SimplifiedDeliveryStatus {
  if (!twilioStatus) return 'pending'

  switch (twilioStatus.toLowerCase()) {
    case 'queued':
    case 'accepted':
    case 'sending':
      return 'pending'
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'read':
      return 'read'
    case 'failed':
    case 'undelivered':
      return 'failed'
    default:
      return 'pending'
  }
}

// ============================================================================
// Status History & Tracking Utilities
// ============================================================================

/**
 * Checks if a status is terminal (no further updates expected)
 */
export function isTerminalStatus(status: string | undefined): boolean {
  if (!status) return false
  const terminal = ['delivered', 'read', 'failed', 'undelivered']
  return terminal.includes(status.toLowerCase())
}

/**
 * Checks if a status is pending (may need sync/tracking)
 */
export function isPendingStatus(status: string | undefined): boolean {
  if (!status) return true
  const pending = ['queued', 'accepted', 'sending', 'sent']
  return pending.includes(status.toLowerCase())
}

/**
 * Determines if a status transition is valid (for idempotency checks)
 * Prevents downgrade of status (e.g., delivered → sent)
 */
export function isValidStatusTransition(
  currentStatus: string | undefined,
  newStatus: string,
): boolean {
  const statusOrder: Record<string, number> = {
    queued: 1,
    accepted: 2,
    sending: 3,
    sent: 4,
    delivered: 5,
    read: 6,
    failed: 0, // Failed can happen at any point
    undelivered: 0, // Undelivered can happen at any point
  }

  const current = currentStatus?.toLowerCase() || ''
  const next = newStatus.toLowerCase()

  // Allow transitions to failed/undelivered from any state
  if (next === 'failed' || next === 'undelivered') {
    return true
  }

  // Allow if new status is higher in the order
  const currentOrder = statusOrder[current] ?? 0
  const nextOrder = statusOrder[next] ?? 0

  return nextOrder >= currentOrder
}

/**
 * Calculate age of a message in minutes
 */
export function getMessageAgeMinutes(sentAt: string | Date): number {
  const sentDate = typeof sentAt === 'string' ? new Date(sentAt) : sentAt
  const now = new Date()
  return Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60))
}

/**
 * Default threshold for considering a pending message "stale"
 * Messages pending longer than this should be synced with Twilio
 */
export const STALE_MESSAGE_THRESHOLD_MINUTES = 30

/**
 * Default batch size for sync operations
 */
export const SYNC_BATCH_SIZE = 50
