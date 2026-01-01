import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toNumber(value: any): number | null {
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value)
  return typeof value === 'number' ? value : null
}

export function parseRebillDateToISO(dateString: string) {
  // Append T00:00:00Z to treat as UTC midnight start of that day
  return new Date(dateString + 'T00:00:00Z')
}

export function generateRandomString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@_'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

export function podFromEmail(input: string) {
  return input.split('@')[0]
}

export function scramble(str: string) {
  return btoa(str)
    .replace(/\+/g, '-') // Replace + with -
    .replace(/\//g, '_') // Replace / with _
    .replace(/=+$/, '') // Remove trailing '='
}

export function unscramble(str: string) {
  return atob(
    str
      .replace(/-/g, '+') // Replace - with +
      .replace(/_/g, '/') + // Replace _ with /
      '='.repeat((4 - (str.length % 4)) % 4), // Add the required padding
  )
}

export function textFromSQL(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function date(str: string, time = false) {
  return time
    ? new Date(str).toLocaleString()
    : new Date(str).toISOString().split('T')[0]
}

export function parseColumn(row, key: string) {
  const dateColumns = ['created_at', 'updated_at', 'closed_at']
  const timeColumns = ['start_time']

  if (dateColumns.includes(key)) {
    return date(row[key])
  } else if (timeColumns.includes(key)) {
    return date(row[key], true)
  } else return row[key]
}

export function addHours(time: string, hoursToAdd: number) {
  const [hourStr, minuteStr] = time.split(':')

  let hour = parseInt(hourStr)
  let minute = parseInt(minuteStr)

  hour += hoursToAdd

  // Adjust the hour and minute if needed
  if (hour >= 24) {
    hour %= 24
  }

  const paddedHour = hour.toString().padStart(2, '0')
  const paddedMinute = minute.toString().padStart(2, '0')

  return `${paddedHour}:${paddedMinute}`
}

export function convertTo12HourFormat(time24: string) {
  const [hourStr, minuteStr] = time24.split(':')

  let hour = parseInt(hourStr)
  let minute = parseInt(minuteStr)

  const period = hour >= 12 ? 'PM' : 'AM'

  hour = hour % 12 || 12

  const hourString = hour.toString()
  const paddedHour = hourString.length === 1 ? ` ${hourString}` : hourString
  const paddedMinute = minute.toString().padStart(2, '0')

  return [`${paddedHour}:${paddedMinute}`, period]
}

export const normalizeToStartOfDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export async function safeCompare(a: string, b: string) {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  if (aBytes.length !== bBytes.length) return false

  const aHash = await crypto.subtle.digest('SHA-256', aBytes)
  const bHash = await crypto.subtle.digest('SHA-256', bBytes)

  // Compare digests byte-by-byte (constant time)
  const aView = new Uint8Array(aHash)
  const bView = new Uint8Array(bHash)

  let match = 1
  for (let i = 0; i < aView.length; i++) {
    match &= Number(aView[i] === bView[i])
  }
  return match === 1
}

// ============================================================================
// Business-Friendly Error Messages
// ============================================================================

/**
 * Maps technical error messages to business-friendly versions.
 * These messages are designed to be clear and actionable for non-technical users.
 */
export function formatBusinessError(
  errorType: string,
  context?: { layer?: string; details?: string },
): string {
  // Error type mappings for common scenarios
  const errorMappings: Record<string, string> = {
    // Network & Connection Errors
    'Network Connection Error': 'Unable to connect - please try again later',
    'Network Error': 'Connection issue - please try again',
    fetch_failed: 'Unable to connect - please try again later',

    // Facebook Ad Account Errors
    'Account Disabled': 'Ad account paused - contact support',
    'Account Permanently Closed': 'Ad account closed',
    'Pending Risk Review': 'Ad account under review',
    'Access Forbidden': 'Missing ad account access',
    'Invalid Access Token': 'Login expired - reconnect account',
    'Account Not Found': 'Ad account not found',
    'Rate Limit Exceeded': 'Too many requests - try again later',

    // Permission Errors
    ads_management: 'Missing ads permission',
    ads_read: 'Missing ads read permission',
    permission: 'Missing required permission',

    // Billing Errors
    'Unsettled Payment': 'Payment issue on account',
    'Account in Grace Period': 'Payment pending on account',
    'Funding Source Issue': 'Payment method issue',
    FAILED: 'Payment method failed',
    EXPIRED: 'Payment method expired',
    DISABLED: 'Payment method disabled',

    // Business Manager Errors
    'Business Manager Disabled': 'Business account paused',

    // Delivery Errors
    'Ad Set Disapproved': 'Ads need review',
    'Delivery Issue': 'Ads delivery paused',
    DISAPPROVED: 'Ads need review',

    // Shopify Errors
    'Shopify API Error': 'Shopify connection issue',
    'Invalid Shopify Response': 'Shopify data unavailable',
    'Missing Store Credentials': 'Store not connected',

    // Generic Errors
    'Bad Request': 'Request failed - contact support',
    'Processing Error': 'Processing issue - try again',
    'Could Not Retrieve': 'Data unavailable',
    'No Data Available': 'No data for this period',
    'Unknown API Error': 'Service temporarily unavailable',
  }

  // Check for direct match first
  if (errorMappings[errorType]) {
    return errorMappings[errorType]
  }

  // Check for partial matches in error message
  const lowerError = errorType.toLowerCase()

  // Permission-related errors
  if (
    lowerError.includes('permission') ||
    lowerError.includes('ads_management') ||
    lowerError.includes('ads_read')
  ) {
    return 'Missing ads permission'
  }

  // Network errors
  if (
    lowerError.includes('network') ||
    lowerError.includes('fetch failed') ||
    lowerError.includes('connection')
  ) {
    return 'Unable to connect - please try again later'
  }

  // Access token errors
  if (
    lowerError.includes('access token') ||
    lowerError.includes('log in') ||
    lowerError.includes('expired')
  ) {
    return 'Login expired - reconnect account'
  }

  // Disabled/closed accounts
  if (lowerError.includes('disabled') || lowerError.includes('closed')) {
    return 'Account paused - contact support'
  }

  // Payment/billing errors
  if (
    lowerError.includes('payment') ||
    lowerError.includes('billing') ||
    lowerError.includes('funding')
  ) {
    return 'Payment issue on account'
  }

  // Unknown path components (Facebook API errors)
  if (lowerError.includes('unknown path')) {
    return 'Account configuration issue'
  }

  // Rate limiting
  if (lowerError.includes('rate limit') || lowerError.includes('too many')) {
    return 'Too many requests - try again later'
  }

  // HTTP errors
  if (lowerError.includes('http error')) {
    return 'Service temporarily unavailable'
  }

  // Default fallback - keep it simple
  return 'Data unavailable'
}

/**
 * Formats Facebook diagnosis result into a business-friendly message
 */
export function formatFacebookDiagnosisError(
  blockingLayer: string,
  errorReason: string,
): string {
  const layerMessages: Record<string, string> = {
    business: 'Business account issue',
    ad_account: 'Ad account issue',
    billing: 'Payment issue',
    delivery: 'Ads delivery issue',
  }

  const baseMessage = layerMessages[blockingLayer] || 'Account issue'

  // Extract key details from error reason
  const reason = errorReason.toLowerCase()

  if (reason.includes('disabled')) return 'Account paused - contact support'
  if (reason.includes('closed')) return 'Account closed'
  if (reason.includes('payment') || reason.includes('unsettled'))
    return 'Payment required'
  if (reason.includes('grace period')) return 'Payment pending'
  if (reason.includes('risk review')) return 'Account under review'
  if (reason.includes('funding') || reason.includes('expired'))
    return 'Update payment method'
  if (reason.includes('disapproved')) return 'Ads need review'
  if (reason.includes('permission')) return 'Missing permission'

  return baseMessage
}
