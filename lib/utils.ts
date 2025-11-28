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
