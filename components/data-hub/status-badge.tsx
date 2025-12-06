'use client'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const statusVariantMap: Record<string, StatusBadgeProps['variant']> = {
  // Common statuses
  active: 'success',
  completed: 'success',
  success: 'success',
  pending: 'warning',
  processing: 'info',
  in_progress: 'info',
  failed: 'danger',
  error: 'danger',
  cancelled: 'danger',
  inactive: 'default',
  // Severity levels
  info: 'info',
  warning: 'warning',
  critical: 'danger',
}

const variantStyles = {
  default: 'bg-white/10 text-white/70',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Handle null/undefined status
  if (!status) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles.default}`}
      >
        -
      </span>
    )
  }

  const resolvedVariant =
    variant || statusVariantMap[status.toLowerCase()] || 'default'
  const styles = variantStyles[resolvedVariant]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  )
}
