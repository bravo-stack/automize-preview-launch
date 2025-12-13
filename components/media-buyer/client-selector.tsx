'use client'

import type { MediaBuyerClient } from '@/types/media-buyer'
import { Search, Store, User } from 'lucide-react'
import { useMemo, useState } from 'react'

interface ClientSelectorProps {
  clients: MediaBuyerClient[]
  selectedClientId: number | null
  onSelectClient: (clientId: number) => void
  isLoading?: boolean
}

export default function ClientSelector({
  clients,
  selectedClientId,
  onSelectClient,
  isLoading = false,
}: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.brand.toLowerCase().includes(query) ||
        client.full_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query),
    )
  }, [clients, searchQuery])

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  )

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70">
        <User className="h-4 w-4" />
        Select Client
      </h3>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
      </div>

      {/* Client List */}
      <div className="max-h-[400px] space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/40">
            {searchQuery ? 'No clients found' : 'No clients available'}
          </div>
        ) : (
          filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                selectedClientId === client.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  selectedClientId === client.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{client.brand}</p>
                <p className="truncate text-xs text-white/50">
                  {client.pod || 'No pod'} •{' '}
                  <span
                    className={
                      client.status === 'active'
                        ? 'text-green-400/70'
                        : 'text-yellow-400/70'
                    }
                  >
                    {client.status}
                  </span>
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected Client Summary */}
      {selectedClient && (
        <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-medium text-white/50">Selected</p>
          <p className="mt-1 font-semibold text-white">
            {selectedClient.brand}
          </p>
          {selectedClient.store_id && (
            <p className="mt-0.5 text-xs text-white/40">
              Store: {selectedClient.store_id}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
