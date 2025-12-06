'use client'

import { Card } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: {
    card: 'border-white/10 bg-white/5',
    icon: 'text-white/60',
    value: 'text-white/90',
  },
  success: {
    card: 'border-green-500/20 bg-green-500/5',
    icon: 'text-green-400',
    value: 'text-green-400',
  },
  warning: {
    card: 'border-yellow-500/20 bg-yellow-500/5',
    icon: 'text-yellow-400',
    value: 'text-yellow-400',
  },
  danger: {
    card: 'border-red-500/20 bg-red-500/5',
    icon: 'text-red-400',
    value: 'text-red-400',
  },
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={`p-4 ${styles.card}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-white/60">{title}</p>
          <p className={`mt-1 text-2xl font-semibold ${styles.value}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-white/40">{description}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% from last period
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-white/5 p-2 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
