'use client'

import { Card } from '@/components/ui/card'
import type { CVRAggregates } from '@/types/cvr-hub'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  CheckCircle,
  CreditCard,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingBag,
  ShoppingCart,
  Target,
  TrendingUp,
} from 'lucide-react'

interface AggregateSummaryProps {
  aggregates: CVRAggregates
}

export default function AggregateSummary({
  aggregates,
}: AggregateSummaryProps) {
  const stats: {
    label: string
    value: string
    icon: LucideIcon
    highlight?: boolean
  }[] = [
    {
      label: 'Total Impressions',
      value: aggregates.totalImpressions.toLocaleString(),
      icon: Eye,
    },
    {
      label: 'Total Clicks',
      value: Math.round(aggregates.totalClicks).toLocaleString(),
      icon: MousePointer,
    },
    {
      label: 'Total Purchases',
      value: aggregates.totalPurchases.toLocaleString(),
      icon: ShoppingCart,
    },
    {
      label: 'Average CVR',
      value: `${aggregates.avgCVR.toFixed(4)}%`,
      icon: BarChart3,
      highlight: true,
    },
    {
      label: 'Average ROAS',
      value: aggregates.avgROAS.toFixed(2),
      icon: TrendingUp,
      highlight: true,
    },
    {
      label: 'Total Ad Spend',
      value: `$${aggregates.totalAdSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
    },
    {
      label: 'Total Revenue',
      value: `$${aggregates.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: 'Avg ATC Rate',
      value: `${aggregates.avgATCRate.toFixed(4)}%`,
      icon: ShoppingBag,
    },
    {
      label: 'Avg IC Rate',
      value: `${aggregates.avgICRate.toFixed(4)}%`,
      icon: CheckCircle,
    },
    {
      label: 'Avg Purchase Rate',
      value: `${aggregates.avgPurchaseRate.toFixed(4)}%`,
      icon: CreditCard,
    },
    {
      label: 'Average CPA',
      value: `$${aggregates.avgCPA.toFixed(2)}`,
      icon: Target,
    },
    {
      label: 'Avg Bounce Rate',
      value: `${aggregates.avgBounceRate.toFixed(4)}%`,
      icon: ArrowLeftRight,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white/90">
        Aggregated Metrics
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className={`border-white/10 bg-white/5 p-4 ${
                stat.highlight ? 'border-green-500/30 bg-green-500/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-white/60">{stat.label}</p>
                  <p
                    className={`mt-1 text-2xl font-semibold ${
                      stat.highlight ? 'text-green-400' : 'text-white/90'
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`rounded-lg bg-white/5 p-2 ${
                    stat.highlight ? 'text-green-400' : 'text-white/60'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
