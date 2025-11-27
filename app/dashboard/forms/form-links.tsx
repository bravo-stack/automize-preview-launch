'use client'

import { cn } from '@/lib/utils'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type FormType = {
  id: string
  name: string
  description: string
  path: string
  linkStyle: 'path' | 'query'
}

/*
 * To add new forms in the future, add a new entry to the FORM_TYPES array:
 * {
 *   id: 'new-form',
 *   name: 'New Form Name',
 *   description: 'Form description',
 *   path: '/new-form-path',
 *   linkStyle: 'path' | 'query',
 * }
 * linkStyle 'path' creates: /form-path/{clientId}
 * linkStyle 'query' creates: /form-path?clientId={clientId}
 */
const FORM_TYPES: FormType[] = [
  {
    id: 'onboarding',
    name: 'Onboarding Form',
    description: 'Initial client onboarding questionnaire',
    path: '/onboarding-form',
    linkStyle: 'path',
  },
  {
    id: 'website-revamp',
    name: 'Website Revamp Request',
    description: 'Request website updates and improvements',
    path: '/website-revamp',
    linkStyle: 'query',
  },
  {
    id: 'day-drop-request',
    name: 'Drop Day Request',
    description: 'Request brand drop day setup',
    path: '/day-drop-request',
    linkStyle: 'query',
  },
]

const ITEMS_PER_PAGE = 10

type Client = {
  id: number
  brand: string
  email: string | null
  closed_by: string | null
  closed_at: string | null
  drive: string | null
}

export default function FormLinks({ clients }: { clients: Client[] }) {
  const [selectedForm, setSelectedForm] = useState<string>(FORM_TYPES[0].id)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const selectedFormData = FORM_TYPES.find((f) => f.id === selectedForm)

  const filteredClients = clients.filter((client) =>
    client.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedClients = filteredClients.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFormChange = (formId: string) => {
    setSelectedForm(formId)
    setCurrentPage(1)
  }

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

  const generateLink = (clientId: number) => {
    const baseUrl = getBaseUrl()
    if (selectedFormData?.linkStyle === 'query') {
      return `${baseUrl}${selectedFormData?.path}?clientId=${clientId}`
    }
    return `${baseUrl}${selectedFormData?.path}/${clientId}`
  }

  const generateRelativePath = (clientId: number) => {
    if (selectedFormData?.linkStyle === 'query') {
      return `${selectedFormData?.path}?clientId=${clientId}`
    }
    return `${selectedFormData?.path}/${clientId}`
  }

  const copyToClipboard = async (
    clientId: number,
    clientBrand: string,
    copyId: string,
  ) => {
    const link = generateLink(clientId)
    const message = `${selectedFormData?.name} link for ${clientBrand}: ${link}`

    try {
      await navigator.clipboard.writeText(message)
      setCopiedId(copyId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      alert('Error copying link. Please try again.')
    }
  }

  return (
    <div className="p-5">
      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-neutral-400">
            Select Form Type
          </label>
          <select
            value={selectedForm}
            onChange={(e) => handleFormChange(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-neutral-200 focus:border-zinc-600 focus:outline-none"
          >
            {FORM_TYPES.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-neutral-400">
            Search Client
          </label>
          <input
            type="text"
            placeholder="Search by brand name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:border-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <div
        key={selectedForm}
        className="mb-4 rounded border border-zinc-700 bg-zinc-800/50 p-4 duration-200 animate-in fade-in slide-in-from-top-1"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-neutral-200">
              {selectedFormData?.name}
            </h3>
            <p className="text-sm text-neutral-400">
              {selectedFormData?.description}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
            Client-specific link
          </span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Path: {selectedFormData?.path}
          {selectedFormData?.linkStyle === 'query'
            ? '?clientId={client_id}'
            : '/{client_id}'}
        </p>
      </div>

      <div
        key={`clients-${selectedForm}`}
        className="space-y-2 duration-200 animate-in fade-in"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            Select a client to generate their form link:
          </p>
          <p className="text-sm text-neutral-500">
            {filteredClients.length} client
            {filteredClients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ul className="space-y-1.5">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
              <li
                key={`${selectedForm}-${client.id}`}
                className="flex items-center justify-between rounded border border-zinc-800 bg-night-starlit p-3 transition-colors hover:border-zinc-700"
              >
                <div className="space-y-0.5">
                  <h4 className="font-medium text-neutral-200">
                    <Link
                      href={`/dashboard/notes/${client.id}`}
                      className="hover:underline"
                    >
                      {client.brand}
                    </Link>
                  </h4>
                  {client.email && (
                    <p className="text-sm text-neutral-500">
                      {client.drive ? (
                        <a
                          href={client.drive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {client.email}
                        </a>
                      ) : (
                        client.email
                      )}
                    </p>
                  )}
                  {client.closed_at && (
                    <p className="text-xs text-neutral-600">
                      {new Date(client.closed_at).toDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-2 text-right text-xs text-neutral-500">
                    {client.drive ? (
                      <a
                        href={client.drive}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-foreground hover:underline"
                      >
                        Open Drive
                      </a>
                    ) : (
                      <span>Drive Missing</span>
                    )}
                    <span
                      className={cn({
                        'text-foreground': client?.closed_by,
                      })}
                    >
                      {client.closed_by
                        ? `Closed by ${client.closed_by}`
                        : 'Closer missing'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-neutral-500">
                      {selectedFormData?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={generateRelativePath(client.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-zinc-700 hover:text-neutral-200"
                        title={`Open ${selectedFormData?.name} for ${client.brand}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </Link>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            client.id,
                            client.brand,
                            `client-${client.id}`,
                          )
                        }
                        className="flex items-center gap-1.5 rounded bg-zinc-700 px-2.5 py-1.5 text-sm text-neutral-200 transition-colors hover:bg-zinc-600"
                        title={`Copy ${selectedFormData?.name} link for ${client.brand}`}
                      >
                        {copiedId === `client-${client.id}` ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="py-4 text-center text-neutral-500">
              {searchQuery
                ? 'No clients found matching your search.'
                : 'No clients available.'}
            </li>
          )}
        </ul>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-zinc-700 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-neutral-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-zinc-700 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
