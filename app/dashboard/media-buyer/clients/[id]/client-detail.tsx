'use client'

import {
  AutomationsList,
  CampaignMetricsCard,
  CampaignsList,
  ContactsSummary,
  OrdersList,
  ProductsSummary,
  RevenueSummaryCard,
  ThemeDetailsCard,
} from '@/components/media-buyer'
import type { ClientDataResponse, MediaBuyerClient } from '@/types/media-buyer'
import {
  ArrowLeft,
  Building2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  Store,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

// ============================================================================
// Client Header Component
// ============================================================================

interface ClientHeaderProps {
  client: MediaBuyerClient
  onRefresh: () => void
  isRefreshing: boolean
  role: string
}

function ClientHeader({
  client,
  onRefresh,
  role,
  isRefreshing,
}: ClientHeaderProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Client Info */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Store className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.brand}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/60">
              {client.pod && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {client.pod}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  client.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {client.status}
              </span>
              {client.is_monitored && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                  Monitored
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Contact Info */}
      {role === 'exec' ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {client.full_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-white/40" />
              <span className="text-white/70">{client.full_name}</span>
            </div>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Mail className="h-4 w-4 text-white/40" />
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.phone_number && (
            <a
              href={`tel:${client.phone_number}`}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Phone className="h-4 w-4 text-white/40" />
              <span>{client.phone_number}</span>
            </a>
          )}
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Globe className="h-4 w-4 text-white/40" />
              <span className="truncate">{client.website}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {client.store_id && (
            <a
              href={`https://${client.store_id}.myshopify.com/admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Store className="h-4 w-4 text-white/40" />
              <span>{client.store_id}.myshopify.com</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {client?.full_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-white/40" />
              <span className="text-white/70">
                {client?.full_name?.split(' ')[0] || client?.full_name || 'N/A'}
              </span>
            </div>
          )}
          {client?.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              <Globe className="h-4 w-4 text-white/40" />
              <span className="truncate">{client.website}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {/* {client?.store_id && (
          <a
            href={`https://${client.store_id}.myshopify.com/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Store className="h-4 w-4 text-white/40" />
            <span>{client.store_id}.myshopify.com</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )} */}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Data Sync Status Component
// ============================================================================

interface DataSyncStatusProps {
  lastUpdated: ClientDataResponse['lastUpdated']
}

function DataSyncStatus({ lastUpdated }: DataSyncStatusProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  const sources = [
    { name: 'Theme', date: lastUpdated.theme },
    { name: 'Orders', date: lastUpdated.omnisendOrders },
    { name: 'Automations', date: lastUpdated.omnisendAutomations },
    { name: 'Campaigns', date: lastUpdated.omnisendCampaigns },
    { name: 'Contacts', date: lastUpdated.omnisendContacts },
    { name: 'Products', date: lastUpdated.omnisendProducts },
  ]

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
        <Clock className="h-4 w-4" />
        Last Data Sync
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <div
            key={source.name}
            className="flex items-center justify-between rounded border border-white/5 bg-white/5 px-3 py-2"
          >
            <span className="text-xs text-white/50">{source.name}</span>
            <span
              className={`text-xs ${source.date ? 'text-white/70' : 'text-white/30'}`}
            >
              {formatDate(source.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Main Client Detail Component
// ============================================================================

interface ClientDetailProps {
  initialData: ClientDataResponse
  role: string
}

export function ClientDetail({ initialData, role }: ClientDetailProps) {
  const [data, setData] = useState<ClientDataResponse>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)

    try {
      const res = await fetch(
        `/api/media-buyer/client-data?clientId=${data.client.id}`,
      )
      const json = await res.json()

      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Failed to refresh data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [data.client.id])

  const { client, theme, omnisend, lastUpdated } = data
  console.log('Omnisend Data:', omnisend)

  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px] space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/media-buyer/clients"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        {/* Client Header */}
        <ClientHeader
          role={role}
          client={client}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Data Sync Status */}
        <DataSyncStatus lastUpdated={lastUpdated} />

        {/* Theme Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Shopify Theme
          </h2>
          <ThemeDetailsCard
            theme={theme}
            lastUpdated={lastUpdated.theme}
            isLoading={isRefreshing}
          />
        </section>

        {/* Omnisend Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Omnisend Performance
          </h2>

          {/* Revenue & Campaign Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueSummaryCard
              summary={omnisend.revenueSummary}
              lastUpdated={lastUpdated.omnisendOrders}
              isLoading={isRefreshing}
            />
            <CampaignMetricsCard
              metrics={omnisend.campaignMetrics}
              totalCampaigns={omnisend.campaigns.length}
              lastUpdated={lastUpdated.omnisendCampaigns}
              isLoading={isRefreshing}
            />
          </div>

          {/* Orders & Automations */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <OrdersList orders={omnisend.orders} isLoading={isRefreshing} />
            <AutomationsList
              automations={omnisend.automations}
              lastUpdated={lastUpdated.omnisendAutomations}
              isLoading={isRefreshing}
            />
          </div>

          {/* Campaigns */}
          <div className="mt-6">
            <CampaignsList
              campaigns={omnisend.campaigns}
              isLoading={isRefreshing}
            />
          </div>

          {/* Contacts & Products */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ContactsSummary
              contacts={omnisend.contacts}
              lastUpdated={lastUpdated.omnisendContacts}
              isLoading={isRefreshing}
            />
            <ProductsSummary
              products={omnisend.products}
              lastUpdated={lastUpdated.omnisendProducts}
              isLoading={isRefreshing}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

// ============================================================================
// Error State Component
// ============================================================================

interface ClientDetailErrorProps {
  error: string
}

export function ClientDetailError({ error }: ClientDetailErrorProps) {
  return (
    <main className="min-h-screen px-6 pb-24 pt-10 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <Link
          href="/dashboard/media-buyer/clients"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5">
          <p className="text-lg font-medium text-red-400">{error}</p>
          <Link
            href="/dashboard/media-buyer/clients"
            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Go Back
          </Link>
        </div>
      </div>
    </main>
  )
}
