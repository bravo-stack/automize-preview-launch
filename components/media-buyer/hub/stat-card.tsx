import type { StatCardProps } from './types'

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: {
      gradient: 'from-white/10 to-white/5',
      iconBg: 'from-white/10 to-white/5',
      iconColor: 'text-white/60',
      valueColor: 'text-white',
    },
    success: {
      gradient: 'from-emerald-500/15 to-emerald-500/5',
      iconBg: 'from-emerald-500/30 to-emerald-500/20',
      iconColor: 'text-emerald-400',
      valueColor: 'text-emerald-400',
    },
    warning: {
      gradient: 'from-amber-500/15 to-amber-500/5',
      iconBg: 'from-amber-500/30 to-amber-500/20',
      iconColor: 'text-amber-400',
      valueColor: 'text-amber-400',
    },
    info: {
      gradient: 'from-blue-500/15 to-blue-500/5',
      iconBg: 'from-blue-500/30 to-blue-500/20',
      iconColor: 'text-blue-400',
      valueColor: 'text-blue-400',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={`rounded-xl border border-white/10 bg-gradient-to-br ${styles.gradient} p-4 transition-all hover:border-white/15`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            {title}
          </p>
          <p className={`mt-1 text-2xl font-bold ${styles.valueColor}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${styles.iconBg} p-2.5`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  )
}
