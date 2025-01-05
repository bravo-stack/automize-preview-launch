import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toNumber(value: any): number | null {
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value)
  return typeof value === 'number' ? value : null
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
