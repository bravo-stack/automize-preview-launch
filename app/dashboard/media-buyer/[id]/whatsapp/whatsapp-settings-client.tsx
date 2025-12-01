'use client'

import {
  createSchedule,
  deleteSchedule,
  toggleScheduleActive,
  updatePodWhatsAppNumber,
} from '@/lib/actions/whatsapp-schedules'
import type {
  DayOfWeek,
  ScheduleFrequency,
  WhatsAppSchedule,
} from '@/types/whatsapp'
import { useState } from 'react'

// ============================================================================
// Types
// ============================================================================

interface WhatsAppSettingsClientProps {
  podName: string
  initialWhatsAppNumber: string | null
  initialSchedules: WhatsAppSchedule[]
}

// ============================================================================
// Main Component
// ============================================================================

export default function WhatsAppSettingsClient({
  podName,
  initialWhatsAppNumber,
  initialSchedules,
}: WhatsAppSettingsClientProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialWhatsAppNumber || '',
  )
  const [schedules, setSchedules] =
    useState<WhatsAppSchedule[]>(initialSchedules)
  const [isSavingNumber, setIsSavingNumber] = useState(false)
  const [numberSaved, setNumberSaved] = useState(false)

  // Handle WhatsApp number save
  const handleSaveNumber = async () => {
    setIsSavingNumber(true)
    const result = await updatePodWhatsAppNumber(podName, whatsappNumber)
    setIsSavingNumber(false)

    if (result.success) {
      setNumberSaved(true)
      setTimeout(() => setNumberSaved(false), 3000)
    } else {
      alert(result.error || 'Failed to save')
    }
  }

  // Handle schedule toggle
  const handleToggle = async (id: string, currentState: boolean) => {
    const result = await toggleScheduleActive(id, !currentState)
    if (result.success) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !currentState } : s)),
      )
    }
  }

  // Handle schedule delete
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return

    const result = await deleteSchedule(id)
    if (result.success) {
      setSchedules((prev) => prev.filter((s) => s.id !== id))
    }
  }

  // Handle new schedule creation
  const handleCreateSchedule = async (data: {
    frequency: ScheduleFrequency
    time: string
    daysOfWeek: DayOfWeek[]
    customMessage: string
  }) => {
    const result = await createSchedule({
      pod_name: podName,
      frequency: data.frequency,
      time: data.time,
      timezone: 'UTC', // All schedules use UTC timezone (convert in UI if needed)
      days_of_week: data.daysOfWeek,
      custom_message: data.customMessage,
    })

    if (result.success && result.schedule) {
      setSchedules((prev) => [result.schedule!, ...prev])
    } else {
      alert(result.error || 'Failed to create schedule')
    }
  }

  return (
    <div className="space-y-8">
      {/* WhatsApp Number Section */}
      <section className="rounded-lg border border-zinc-800 bg-night-starlit p-6">
        <h2 className="mb-4 text-lg font-semibold">WhatsApp Number</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Enter the WhatsApp number for {podName} to receive notifications.
          Include country code (e.g., +1234567890).
        </p>
        <div className="flex gap-3">
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+1234567890"
            className="flex-1 rounded-md border border-zinc-700 bg-night-midnight px-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSaveNumber}
            disabled={isSavingNumber}
            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSavingNumber ? 'Saving...' : numberSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </section>

      {/* Scheduled Summaries Section */}
      <section className="rounded-lg border border-zinc-800 bg-night-starlit p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scheduled Summaries</h2>
            <p className="text-sm text-zinc-400">
              Get WhatsApp messages with clients that need responses.
            </p>
          </div>
          <AddScheduleButton onAdd={handleCreateSchedule} />
        </div>

        {schedules.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-700 p-8 text-center">
            <p className="text-zinc-400">No schedules configured yet.</p>
            <p className="text-sm text-zinc-500">
              Click &quot;Add Schedule&quot; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onToggle={() => handleToggle(schedule.id, schedule.is_active)}
                onDelete={() => handleDelete(schedule.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ============================================================================
// Schedule Card Component
// ============================================================================

interface ScheduleCardProps {
  schedule: WhatsAppSchedule
  onToggle: () => void
  onDelete: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  const daysDisplay = (schedule.days_of_week || [])
    .map((d) => DAYS[d])
    .join(', ')

  return (
    <div
      className={`rounded-md border p-4 transition-colors ${
        schedule.is_active
          ? 'border-zinc-700 bg-night-midnight'
          : 'border-zinc-800 bg-night-dusk opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                schedule.is_active ? 'bg-green-500' : 'bg-zinc-500'
              }`}
            />
            <span className="font-medium capitalize">
              {schedule.frequency || 'daily'} at {schedule.time || '09:00'} UTC
            </span>
          </div>
          {daysDisplay && (
            <p className="mt-1 text-sm text-zinc-400">{daysDisplay}</p>
          )}
          <p className="mt-2 text-sm text-zinc-300">
            &quot;{schedule.custom_message}&quot;
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              schedule.is_active
                ? 'bg-zinc-700 hover:bg-zinc-600'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            {schedule.is_active ? 'Pause' : 'Enable'}
          </button>
          <button
            onClick={onDelete}
            className="rounded bg-red-600/20 px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-600/40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Add Schedule Button/Modal
// ============================================================================

interface AddScheduleButtonProps {
  onAdd: (data: {
    frequency: ScheduleFrequency
    time: string
    daysOfWeek: DayOfWeek[]
    customMessage: string
  }) => Promise<void>
}

function AddScheduleButton({ onAdd }: AddScheduleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    frequency: 'daily' as ScheduleFrequency,
    time: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5] as DayOfWeek[],
    customMessage: 'Please respond to these clients today:',
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onAdd(formData)
    setIsSubmitting(false)
    setIsOpen(false)
    // Reset form
    setFormData({
      frequency: 'daily',
      time: '09:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      customMessage: 'Please respond to these clients today:',
    })
  }

  const toggleDay = (day: DayOfWeek) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        + Add Schedule
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-night-starlit p-6">
        <h3 className="mb-4 text-lg font-semibold">New Schedule</h3>

        {/* Frequency */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-zinc-400">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                frequency: e.target.value as ScheduleFrequency,
              }))
            }
            className="w-full rounded-md border border-zinc-700 bg-night-midnight px-3 py-2 text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom Days</option>
          </select>
        </div>

        {/* Time */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-zinc-400">Time (UTC)</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, time: e.target.value }))
            }
            className="w-full rounded-md border border-zinc-700 bg-night-midnight px-3 py-2 text-white"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Schedule runs in UTC timezone
          </p>
        </div>

        {/* Days of Week (for weekly/custom) */}
        {formData.frequency !== 'daily' && (
          <div className="mb-4">
            <label className="mb-2 block text-sm text-zinc-400">Days</label>
            <div className="flex gap-1">
              {DAYS.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index as DayOfWeek)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    formData.daysOfWeek.includes(index as DayOfWeek)
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Message */}
        <div className="mb-6">
          <label className="mb-1 block text-sm text-zinc-400">
            Custom Message
          </label>
          <textarea
            value={formData.customMessage}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                customMessage: e.target.value,
              }))
            }
            rows={3}
            placeholder="Message shown before the client list..."
            className="w-full rounded-md border border-zinc-700 bg-night-midnight px-3 py-2 text-white placeholder-zinc-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            The client list will appear after this message.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.customMessage}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
