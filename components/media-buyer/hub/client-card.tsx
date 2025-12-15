import { ChevronRight, Database, Eye, Globe, Mail, Palette } from 'lucide-react'
import Link from 'next/link'
import type { ClientDataAvailability, HubClient } from './types'

interface ClientCardProps {
  client: HubClient
  dataAvailability?: ClientDataAvailability
}

export function ClientCard({ client, dataAvailability }: ClientCardProps) {
  const isActive = client.status === 'active'
  const hasData = dataAvailability && dataAvailability.totalRecords > 0
  const hasThemes = dataAvailability?.hasThemes
  const hasOmnisend = dataAvailability?.hasOmnisend

  return (
    <Link
      href={`/dashboard/media-buyer/clients/${client.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 transition-all duration-200 hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.04] hover:shadow-lg hover:shadow-black/20"
    >
      {/* Card Content */}
      <div className="flex flex-col gap-3">
        {/* Client Name */}
        <h3 className="line-clamp-2 font-semibold leading-tight text-white">
          {client.brand}
        </h3>

        {/* Website */}
        {client.website ? (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {client.website.replace(/^https?:\/\//, '')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span>No website</span>
          </div>
        )}

        {/* Data Sources - Only show when data exists */}
        {(hasThemes || hasOmnisend) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            {hasThemes && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-400">
                <Palette className="h-3 w-3" />
                Shopify
              </span>
            )}
            {hasOmnisend && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-500/15 px-2 py-1 text-xs font-medium text-orange-400">
                <Mail className="h-3 w-3" />
                Omnisend
              </span>
            )}
            {hasData && (
              <span
                className="ml-auto inline-flex items-center gap-1 text-xs text-white/40"
                title="Total synced records"
              >
                <Database className="h-3 w-3" />
                {dataAvailability.totalRecords}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          {/* Status */}
          <span
            className={`inline-flex h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          <span className="text-xs text-white/50">
            {isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Monitored indicator */}
          {client.is_monitored && (
            <>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                <Eye className="h-3 w-3" />
                Monitored
              </span>
            </>
          )}
        </div>

        <ChevronRight className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/50" />
      </div>

      {/* Hover Gradient Effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.03] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </Link>
  )
}
