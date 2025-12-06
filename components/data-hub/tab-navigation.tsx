'use client'

import type { DataHubTab } from '@/types/data-hub'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  Server,
  Table2,
  TrendingUp,
} from 'lucide-react'

interface TabItem {
  id: DataHubTab
  label: string
  icon: LucideIcon
}

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cvr', label: 'CVR Metrics', icon: TrendingUp },
  { id: 'sources', label: 'API Sources', icon: Server },
  { id: 'snapshots', label: 'Snapshots', icon: Database },
  { id: 'records', label: 'Records', icon: Table2 },
  { id: 'sheet-metrics', label: 'Sheet Metrics', icon: FileText },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'forms', label: 'Form Submissions', icon: ClipboardList },
]

interface TabNavigationProps {
  activeTab: DataHubTab
  onTabChange: (tab: DataHubTab) => void
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
