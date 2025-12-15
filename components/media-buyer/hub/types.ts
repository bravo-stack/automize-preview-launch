import type { LucideIcon } from 'lucide-react'

export interface HubClient {
  id: string
  brand: string
  full_name: string | null
  website: string | null
  status: string | null
  is_monitored: boolean | null
}

export interface ClientDataAvailability {
  hasThemes: boolean
  hasOmnisend: boolean
  totalRecords: number
}

export interface HubStats {
  total: number
  active: number
  inactive: number
  monitored: number
}

export interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'info'
}

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
