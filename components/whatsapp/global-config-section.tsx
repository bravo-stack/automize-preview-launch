'use client'

import { upsertGlobalConfig } from '@/lib/actions/global-whatsapp-configs'
import type {
  DayOfWeek,
  GlobalWhatsAppConfig,
  ScheduleFrequency,
} from '@/types/whatsapp'
import { useState } from 'react'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
]

interface GlobalConfigSectionProps {
  initialConfig: GlobalWhatsAppConfig | null
}

export function GlobalConfigSection({
  initialConfig,
}: GlobalConfigSectionProps) {
  const [config, setConfig] = useState<GlobalWhatsAppConfig | null>(
    initialConfig,
  )
  const [isEditing, setIsEditing] = useState(!initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Form state - always active by default
  const [formData, setFormData] = useState({
    frequency: (config?.frequency || 'daily') as ScheduleFrequency,
    time: config?.time?.slice(0, 5) || '09:00',
    timezone: config?.timezone || 'UTC',
    days_of_week: config?.days_of_week || [1, 2, 3, 4, 5],
    custom_message:
      config?.custom_message || 'Please respond to these clients:',
  })

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev) => {
      const days = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b)
      return { ...prev, days_of_week: days as DayOfWeek[] }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    const result = await upsertGlobalConfig({
      frequency: formData.frequency,
      time: formData.time,
      timezone: formData.timezone,
      days_of_week: formData.days_of_week as DayOfWeek[],
      custom_message: formData.custom_message,
      is_active: true, // Always active
    })

    setIsSaving(false)

    if (result.success && result.config) {
      setConfig(result.config)
      setIsEditing(false)
      setSaveMessage({ type: 'success', text: 'Configuration saved!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Failed to save' })
    }
  }

  const handleCancel = () => {
    if (config) {
      setFormData({
        frequency: config.frequency,
        time: config.time?.slice(0, 5) || '09:00',
        timezone: config.timezone,
        days_of_week: config.days_of_week,
        custom_message: config.custom_message,
      })
      setIsEditing(false)
    }
  }

  const getDayLabel = (days: DayOfWeek[]): string => {
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && !days.includes(0) && !days.includes(6))
      return 'Weekdays'
    if (days.length === 2 && days.includes(0) && days.includes(6))
      return 'Weekends'
    return days
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
      .join(', ')
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-night-starlit p-5">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-zinc-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-200">
              Global Default Configuration
            </h2>
            <p className="text-sm text-zinc-500">
              Applied to all pods without individual config
            </p>
          </div>
        </div>

        {config && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Edit
          </button>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            saveMessage.type === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Display Mode */}
      {!isEditing && config && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-800 bg-night-midnight p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Frequency
              </p>
              <p className="mt-1 text-sm capitalize text-white">
                {config.frequency}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Time
              </p>
              <p className="mt-1 text-sm text-white">
                {config.time?.slice(0, 5) || '09:00'} ({config.timezone})
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Active Days
              </p>
              <p className="mt-1 text-sm text-white">
                {getDayLabel(config.days_of_week)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Last Sent
              </p>
              <p className="mt-1 text-sm text-white">
                {config.last_sent_at
                  ? new Date(config.last_sent_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-night-midnight p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Message Template
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {config.custom_message}
            </p>
          </div>
        </div>
      )}

      {/* Edit Mode / Create Mode */}
      {(isEditing || !config) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Frequency */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: e.target.value as ScheduleFrequency,
                  }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-night-midnight px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, time: e.target.value }))
                }
                className="w-full rounded-lg border border-zinc-700 bg-night-midnight px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-700 bg-night-midnight px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Days of Week */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Active Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value as DayOfWeek)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    formData.days_of_week.includes(day.value as DayOfWeek)
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    days_of_week: [1, 2, 3, 4, 5] as DayOfWeek[],
                  }))
                }
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Weekdays only
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    days_of_week: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[],
                  }))
                }
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Every day
              </button>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">
              Message Template
            </label>
            <textarea
              value={formData.custom_message}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  custom_message: e.target.value,
                }))
              }
              rows={2}
              placeholder="Please respond to these clients:"
              className="w-full rounded-lg border border-zinc-700 bg-night-midnight px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {isSaving
                ? 'Saving...'
                : config
                  ? 'Save Changes'
                  : 'Save Configuration'}
            </button>
            {config && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
