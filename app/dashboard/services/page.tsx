'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'

type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

interface SyncResult {
  status: SyncStatus
  message?: string
  total?: number
  saved?: number
}

type OmnisendEndpoint =
  | 'contacts'
  | 'products'
  | 'orders'
  | 'automations'
  | 'campaigns'

const OMNISEND_ENDPOINTS: { key: OmnisendEndpoint; label: string }[] = [
  { key: 'contacts', label: 'Contacts' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'automations', label: 'Automations' },
  { key: 'campaigns', label: 'Campaigns' },
]

export default function ServicesPage() {
  const [syncState, setSyncState] = useState<
    Record<OmnisendEndpoint, SyncResult>
  >({
    contacts: { status: 'idle' },
    products: { status: 'idle' },
    orders: { status: 'idle' },
    automations: { status: 'idle' },
    campaigns: { status: 'idle' },
  })

  async function syncEndpoint(endpoint: OmnisendEndpoint) {
    setSyncState((prev) => ({
      ...prev,
      [endpoint]: { status: 'loading' },
    }))

    try {
      const res = await fetch(`/api/omnisend/${endpoint}`, { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        setSyncState((prev) => ({
          ...prev,
          [endpoint]: { status: 'error', message: data.error },
        }))
        return
      }

      const totalKey = Object.keys(data).find((k) => k.startsWith('total'))
      const total = totalKey ? data[totalKey] : 0

      setSyncState((prev) => ({
        ...prev,
        [endpoint]: {
          status: 'success',
          message: `Synced ${data.savedRecords} records`,
          total,
          saved: data.savedRecords,
        },
      }))
    } catch (err) {
      setSyncState((prev) => ({
        ...prev,
        [endpoint]: {
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
      }))
    }
  }

  const isSyncing = Object.values(syncState).some((s) => s.status === 'loading')

  return (
    <main className="min-h-screen px-24 pb-24 pt-10">
      <hgroup className="mb-10">
        <h1 className="text-3xl font-semibold text-white">Services</h1>
        <p className="text-white/60">Sync data from external services</p>
      </hgroup>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Omnisend Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Omnisend</CardTitle>
            <CardDescription>
              Sync data from your Omnisend account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OMNISEND_ENDPOINTS.map(({ key, label }) => {
                const state = syncState[key]
                return (
                  <div key={key} className="space-y-2">
                    <Button
                      onClick={() => syncEndpoint(key)}
                      disabled={isSyncing}
                      variant="outline"
                      className="w-full"
                    >
                      {state.status === 'loading'
                        ? 'Syncing...'
                        : `Sync ${label}`}
                    </Button>

                    {state.status === 'success' && (
                      <p className="text-xs text-green-500">
                        ✓ {state.saved} saved
                      </p>
                    )}

                    {state.status === 'error' && (
                      <p className="text-xs text-red-500">✗ {state.message}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
