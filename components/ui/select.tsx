'use client'

import * as React from 'react'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-white/90">{label}</label>
        )}
        <select
          className={`flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-zinc-900 [&>option]:text-white ${className}`}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
