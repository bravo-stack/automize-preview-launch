'use server'

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
