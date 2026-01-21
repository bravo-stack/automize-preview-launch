'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'

type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

interface SyncResult {
  status: SyncStatus
  message?: string
  processedClients?: number
  successCount?: number
  failCount?: number
  // failures from batch APIs (kept minimal for UI display)
  failures?: Array<{ client?: string; message?: string }>
  total?: number
  saved?: number
  snapshotId?: string
  totalClients?: number
  progress?: {
    current: number
    total: number
    currentClient?: string
  }
  details?: {
    totalContacts?: number
    totalProducts?: number
    totalOrders?: number
    totalAutomations?: number
    totalCampaigns?: number
  }
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

function FailInfo({
  failures,
}: {
  failures?: Array<{ client?: string; message?: string }>
}) {
  if (!failures || failures.length === 0) return null

  const formatError = (msg: unknown): string => {
    if (typeof msg === 'string') {
      try {
        // Try parsing if it looks like JSON
        if (msg.trim().startsWith('{') || msg.trim().startsWith('[')) {
          const parsed = JSON.parse(msg)
          return formatError(parsed)
        }
        return msg
      } catch {
        return msg
      }
    }
    if (typeof msg === 'object' && msg !== null) {
      // Extract common error fields
      const anyMsg = msg as any
      if (anyMsg.message) return anyMsg.message
      if (anyMsg.error) return typeof anyMsg.error === 'string' ? anyMsg.error : formatError(anyMsg.error)
      // Fallback to a cleaner JSON string or generic message
      return JSON.stringify(msg, null, 2)
    }
    return String(msg)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${failures.length} failure(s); click for details`}
          title={`${failures.length} failure(s)`}
          className="-mt-0.5 ml-2 text-red-400 hover:text-red-300"
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Failures</DialogTitle>
          <DialogDescription>
            The following clients encountered issues during the sync process.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {failures.map((f, i) => (
            <div key={i} className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm">
              <div className="mb-1 font-semibold text-red-200">
                {f.client || 'Unknown Client'}
              </div>
              <div className="text-red-200/80 whitespace-pre-wrap break-words">
                {formatError(f.message || f)}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ServicesPage() {
  // STATES
  const [syncState, setSyncState] = useState<
    Record<OmnisendEndpoint, SyncResult>
  >({
    contacts: { status: 'idle' },
    products: { status: 'idle' },
    orders: { status: 'idle' },
    automations: { status: 'idle' },
    campaigns: { status: 'idle' },
  })
  const [shopifyThemesState, setShopifyThemesState] = useState<SyncResult>({
    status: 'idle',
  })

  // HANDLERS
  async function syncEndpoint(endpoint: OmnisendEndpoint) {
    setSyncState((prev) => ({
      ...prev,
      [endpoint]: { status: 'loading' },
    }))

    try {
      // 1. No payload needed anymore - Server handles key fetching
      const res = await fetch(`/api/omnisend/${endpoint}`, {
        method: 'POST',
      })
      const data = await res.json()

      // 2. Handle generic error
      if (!res.ok || data.error) {
        console.error('Sync error:', data)
        setSyncState((prev) => ({
          ...prev,
          [endpoint]: {
            status: 'error',
            message: data.details || data.error || 'Batch sync failed',
          },
        }))
        return
      }

      // 3. Handle Batch Response Structure
      // Expected structure: { summary: { totalProcessed, successCount, failCount }, failures: [] }
      if (data.summary) {
        setSyncState((prev) => ({
          ...prev,
          [endpoint]: {
            status: 'success',
            message: `Processed ${data.summary.totalProcessed} Clients`,
            processedClients: data.summary.totalProcessed,
            successCount: data.summary.successCount,
            failCount: data.summary.failCount,
            failures:
              data.failures || data.failures === null
                ? data.failures
                : undefined,
          },
        }))
      } else {
        // Fallback for non-batch responses (if any endpoints haven't been updated yet)
        setSyncState((prev) => ({
          ...prev,
          [endpoint]: {
            status: 'success',
            message: 'Sync completed',
            saved: data.savedRecords || 0,
          },
        }))
      }
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
  // async function syncEndpoint(endpoint: OmnisendEndpoint) {
  //   setSyncState((prev) => ({
  //     ...prev,
  //     [endpoint]: { status: 'loading' },
  //   }))

  //   try {
  //     const res = await fetch(`/api/omnisend/${endpoint}`, {
  //       method: 'POST',
  //       body: JSON.stringify({ encryptedKey: '' }),
  //     })
  //     const data = await res.json()

  //     if (!data.success) {
  //       console.log('Sync error:', data)
  //       setSyncState((prev) => ({
  //         ...prev,
  //         [endpoint]: { status: 'error', message: data.error },
  //       }))
  //       return
  //     }

  //     const totalKey = Object.keys(data).find((k) => k.startsWith('total'))
  //     const total = totalKey ? data[totalKey] : 0

  //     setSyncState((prev) => ({
  //       ...prev,
  //       [endpoint]: {
  //         status: 'success',
  //         message: `Synced ${data.savedRecords} of ${total} records`,
  //         total,
  //         saved: data.savedRecords,
  //         snapshotId: data.snapshotId,
  //         details: {
  //           totalContacts: data.totalContacts,
  //           totalProducts: data.totalProducts,
  //           totalOrders: data.totalOrders,
  //           totalAutomations: data.totalAutomations,
  //           totalCampaigns: data.totalCampaigns,
  //         },
  //       },
  //     }))
  //   } catch (err) {
  //     setSyncState((prev) => ({
  //       ...prev,
  //       [endpoint]: {
  //         status: 'error',
  //         message: err instanceof Error ? err.message : 'Unknown error',
  //       },
  //     }))
  //   }
  // }
  async function syncShopifyThemes() {
    setShopifyThemesState({
      status: 'loading',
      progress: { current: 0, total: 0 },
    })

    try {
      const res = await fetch('/api/shopify/themes', {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
        },
      })

      if (!res.ok || !res.body) {
        throw new Error('Failed to start sync')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'init') {
              setShopifyThemesState((prev) => ({
                ...prev,
                progress: { current: 0, total: data.total },
              }))
            } else if (data.type === 'progress') {
              setShopifyThemesState((prev) => ({
                ...prev,
                progress: {
                  current: data.current,
                  total: data.total,
                  currentClient: data.client,
                },
              }))
            } else if (data.type === 'complete') {
              setShopifyThemesState({
                status: 'success',
                message: `Synced ${data.savedRecords} themes from ${data.totalClients} clients`,
                saved: data.savedRecords,
                totalClients: data.totalClients,
                total: data.totalThemes,
              })
            }
          }
        }
      }
    } catch (err) {
      setShopifyThemesState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  // DATA INIT
  const isSyncing =
    Object.values(syncState).some((s) => s.status === 'loading') ||
    shopifyThemesState.status === 'loading'

  // Prevent refresh/close while syncing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSyncing) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSyncing])

  return (
    <main className="min-h-screen px-24 pb-24 pt-10">
      <hgroup className="mb-10">
        <h1 className="text-3xl font-semibold text-white">Services</h1>
        <p className="text-white/60">Sync data from external services</p>
      </hgroup>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Omnisend Card */}
        <Card className="col-span-full">
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
                  <div
                    key={key}
                    className="space-y-2 rounded-lg border border-zinc-800 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{label}</h3>
                      {state.status === 'loading' && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                      )}
                    </div>

                    <Button
                      onClick={() => syncEndpoint(key)}
                      disabled={isSyncing}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {state.status === 'loading' ? 'Syncing...' : 'Sync Now'}
                    </Button>

                    {state.status === 'success' && (
                      <div className="space-y-1 text-xs">
                        <p className="text-green-500">✓ {state.message}</p>

                        {/* --- START CHANGES: Display Batch Stats --- */}
                        {state.processedClients !== undefined ? (
                          <div className="flex items-center gap-2 text-white/60">
                            <span className="text-green-400">
                              {state.successCount} Success
                            </span>
                            <span>•</span>

                            <div className="flex items-center">
                              <span
                                className={
                                  state.failCount && state.failCount > 0
                                    ? 'text-red-400'
                                    : ''
                                }
                              >
                                {state.failCount ?? 0} Failed
                              </span>

                              {/* show hoverable details when failures are present */}
                              {state.failCount && state.failCount > 0 && (
                                <FailInfo failures={state.failures} />
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Fallback for legacy display */
                          <p className="text-white/60">
                            {state.saved} records saved
                          </p>
                        )}
                        {/* --- END CHANGES --- */}

                        {state.snapshotId && (
                          <p
                            className="truncate text-white/40"
                            title={state.snapshotId}
                          >
                            ID: {state.snapshotId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                    )}

                    {state.status === 'error' && (
                      <p className="text-xs text-red-500">✗ {state.message}</p>
                    )}

                    {state.status === 'idle' && (
                      <p className="text-xs text-white/40">Ready to sync</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Shopify Themes Card */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Shopify</CardTitle>
            <CardDescription>
              Sync theme data from Shopify stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Themes</h3>
                {shopifyThemesState.status === 'loading' && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                )}
              </div>

              <Button
                onClick={syncShopifyThemes}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {shopifyThemesState.status === 'loading'
                  ? 'Syncing...'
                  : 'Sync Now'}
              </Button>

              {shopifyThemesState.status === 'loading' && (
                <div className="space-y-1 text-xs text-white/60">
                  <p>
                    Processing clients...{' '}
                    {shopifyThemesState.progress?.total ? (
                      <span className="font-semibold text-white">
                        {shopifyThemesState.progress.current}/
                        {shopifyThemesState.progress.total}
                      </span>
                    ) : null}
                  </p>
                  {shopifyThemesState.progress?.currentClient && (
                    <p className="text-white/40">
                      Fetching: {shopifyThemesState.progress.currentClient}
                    </p>
                  )}
                </div>
              )}

              {shopifyThemesState.status === 'success' && (
                <div className="space-y-1 text-xs">
                  <p className="text-green-500">✓ Sync completed</p>
                  <p className="text-white/60">
                    {shopifyThemesState.saved} theme(s) saved
                  </p>
                  <p className="text-white/40">
                    {shopifyThemesState.totalClients} clients processed
                  </p>
                  <p className="text-white/40">
                    {shopifyThemesState.total} total themes
                  </p>
                </div>
              )}

              {shopifyThemesState.status === 'error' && (
                <p className="text-xs text-red-500">
                  ✗ {shopifyThemesState.message}
                </p>
              )}

              {shopifyThemesState.status === 'idle' && (
                <p className="text-xs text-white/40">Ready to sync</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
