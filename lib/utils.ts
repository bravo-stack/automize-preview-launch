import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toNumber(value: any): number | null {
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value)
  return typeof value === 'number' ? value : null
}
