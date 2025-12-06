'use client'

import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-white/5 p-2">
            <Icon className="h-5 w-5 text-white/60" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-white/90">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-white/60">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
