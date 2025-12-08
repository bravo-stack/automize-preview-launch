'use client'

import type { HubCategory } from '@/types/data-hub'
import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  DollarSign,
  Facebook,
  LayoutDashboard,
  Server,
  TrendingUp,
} from 'lucide-react'

interface TabItem {
  id: HubCategory
  label: string
  icon: LucideIcon
  description?: string
  badge?: string
}

const tabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Dashboard overview with all data stats',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    description: 'Facebook Ads metrics from Autometric sheets',
  },
  {
    id: 'finance',
    label: 'Finance Sheet',
    icon: DollarSign,
    description: 'Financial metrics from FinancialX sheets',
  },
  {
    id: 'api-data',
    label: 'API Data',
    icon: Server,
    description: 'Omnisend, Shopify, Themes and other API data',
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: ClipboardList,
    description: 'Day Drop & Website Revamp requests',
  },
  {
    id: 'cvr',
    label: 'CVR Metrics',
    icon: TrendingUp,
    description: 'Conversion rate metrics',
    badge: 'Coming Soon',
  },
]

interface TabNavigationProps {
  activeTab: HubCategory
  onTabChange: (tab: HubCategory) => void
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex w-fit flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const isDisabled = tab.badge === 'Coming Soon'

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            title={tab.description}
            className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-white/10 text-white'
                : isDisabled
                  ? 'cursor-not-allowed text-white/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && (
              <span className="absolute -right-1 -top-1 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                Soon
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
