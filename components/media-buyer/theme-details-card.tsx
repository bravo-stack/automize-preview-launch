'use client'

import type { ThemeData } from '@/types/media-buyer'
import {
  Calendar,
  Check,
  Clock,
  Code,
  Eye,
  Loader2,
  Palette,
  Settings,
  X,
} from 'lucide-react'

interface ThemeDetailsCardProps {
  theme: ThemeData | null
  lastUpdated: string | null
  isLoading?: boolean
}

export default function ThemeDetailsCard({
  theme,
  lastUpdated,
  isLoading = false,
}: ThemeDetailsCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Theme Details</h3>
        </div>
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            <p className="text-sm text-white/40">Loading theme data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Theme Details</h3>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-white/5 p-4">
            <Palette className="h-8 w-8 text-white/20" />
          </div>
          <p className="text-white/60">No theme data available</p>
          <p className="mt-1 text-sm text-white/40">
            Theme information will appear once synced
          </p>
        </div>
      </div>
    )
  }

  // Extract attributes for display
  const getAttributeValue = (name: string): unknown => {
    const attr = theme.attributes.find((a) => a.attribute_name === name)
    return attr?.attribute_value
  }

  const role = theme.status || 'unknown'
  const isMain = role === 'main'
  const previewable =
    theme.extra?.previewable ?? getAttributeValue('previewable')
  const processing = theme.extra?.processing ?? getAttributeValue('processing')
  const themeStoreId =
    theme.extra?.theme_store_id ?? getAttributeValue('theme_store_id')
  const updatedAt = getAttributeValue('updated_at') as string | undefined

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/20 p-2">
            <Palette className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Theme Details</h3>
            <p className="text-xs text-white/50">Shopify Theme Configuration</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated {new Date(lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Theme Name & Status */}
      <div className="mt-6 rounded-lg border border-white/5 bg-white/5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              Theme Name
            </p>
            <h4 className="mt-1 text-xl font-bold text-white">
              {theme.name || 'Unnamed Theme'}
            </h4>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isMain
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
        </div>

        {/* External ID */}
        <div className="mt-4 flex items-center gap-2 rounded border border-white/5 bg-white/5 px-3 py-2">
          <Code className="h-4 w-4 text-white/40" />
          <span className="text-xs text-white/50">Theme ID:</span>
          <code className="font-mono text-sm text-white/70">
            {theme.external_id}
          </code>
        </div>
      </div>

      {/* Theme Properties Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Previewable */}
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Previewable</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {previewable ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Yes</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">No</span>
              </>
            )}
          </div>
        </div>

        {/* Processing */}
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Processing</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Yes</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">No</span>
              </>
            )}
          </div>
        </div>

        {/* Theme Store ID */}
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Store Theme</span>
          </div>
          <div className="mt-2">
            {themeStoreId ? (
              <span className="text-sm font-medium text-white/80">
                #{String(themeStoreId)}
              </span>
            ) : (
              <span className="text-sm text-white/40">Custom</span>
            )}
          </div>
        </div>

        {/* Last Modified */}
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/40" />
            <span className="text-xs text-white/50">Modified</span>
          </div>
          <div className="mt-2">
            {updatedAt ? (
              <span className="text-sm font-medium text-white/80">
                {new Date(updatedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-sm text-white/40">Unknown</span>
            )}
          </div>
        </div>
      </div>

      {/* Store Information */}
      {theme.extra?.store_id && (
        <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Store: {theme.extra.store_id}.myshopify.com
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
