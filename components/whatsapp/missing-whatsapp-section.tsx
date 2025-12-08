'use client'

import { updatePodWhatsAppNumber } from '@/lib/actions/pod-whatsapp-configs'
import type { PodWithWhatsApp } from '@/types/whatsapp'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface MissingWhatsAppCardProps {
  pod: PodWithWhatsApp
  onUpdate: (podName: string, number: string) => void
}

export function MissingWhatsAppCard({
  pod,
  onUpdate,
}: MissingWhatsAppCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [number, setNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!number.trim()) {
      setError('Please enter a phone number')
      return
    }

    setIsSaving(true)
    setError(null)

    const result = await updatePodWhatsAppNumber(pod.name, number.trim())

    setIsSaving(false)

    if (result.success) {
      onUpdate(pod.name, number.trim())
      setIsEditing(false)
      setNumber('')
      router.refresh() // Refresh to update server components
    } else {
      setError(result.error || 'Failed to save number')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNumber('')
    setError(null)
  }

  if (isEditing) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-amber-600/50 bg-gradient-to-br from-amber-950/40 to-amber-900/20 p-4 transition-all">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-amber-400"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-amber-200">{pod.name}</h3>
          </div>

          <div className="space-y-2">
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="+1234567890"
              autoFocus
              className="w-full rounded-lg border border-amber-700/50 bg-night-midnight px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group relative h-fit w-full overflow-hidden rounded-xl border border-dashed border-amber-700/50 bg-gradient-to-br from-amber-950/20 to-transparent p-4 text-left transition-all hover:border-amber-600 hover:from-amber-950/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-amber-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-200">{pod.name}</h3>
            <p className="text-xs text-amber-400/70">
              Click to add WhatsApp number
            </p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5 text-amber-600 transition-transform group-hover:translate-x-1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </div>
    </button>
  )
}

interface MissingWhatsAppSectionProps {
  pods: PodWithWhatsApp[]
}

export function MissingWhatsAppSection({
  pods: initialPods,
}: MissingWhatsAppSectionProps) {
  const [pods, setPods] = useState(initialPods)

  const handleUpdate = (podName: string, number: string) => {
    setPods((prev) => prev.filter((p) => p.name !== podName))
  }

  if (pods.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-amber-800/50 bg-gradient-to-br from-amber-950/30 to-night-starlit p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 text-amber-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-amber-200">
            Missing WhatsApp Numbers
          </h2>
          <p className="text-sm text-amber-300/60">
            {pods.length} pod{pods.length !== 1 ? 's' : ''} need WhatsApp
            numbers configured
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pods.map((pod) => (
          <MissingWhatsAppCard key={pod.id} pod={pod} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  )
}
