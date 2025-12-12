'use client'

import {
  toggleConfigActive,
  updatePodWhatsAppNumber,
  upsertConfig,
} from '@/lib/actions/pod-whatsapp-configs'
import type {
  GlobalWhatsAppConfig,
  PodWhatsAppConfig,
  WaFeatureType,
} from '@/types/whatsapp'
import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Helper to convert GlobalWhatsAppConfig days_of_week (number[]) to string format
function daysOfWeekToString(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return ''
  return days.map((d) => DAYS[d]).join(',')
}

// Helper to get scheduled time from GlobalWhatsAppConfig (uses 'time' field)
function getGlobalScheduledTime(
  config: GlobalWhatsAppConfig | undefined,
): string {
  return config?.time || '09:00:00'
}

// Helper to get custom message from GlobalWhatsAppConfig (uses 'custom_message' field)
function getGlobalCustomMessage(
  config: GlobalWhatsAppConfig | undefined,
): string {
  return config?.custom_message || ''
}

interface WhatsAppSettingsClientProps {
  podName: string
  initialWhatsAppNumber: string | null
  initialConfigs: PodWhatsAppConfig[]
  globalConfigs: GlobalWhatsAppConfig[]
  isNumberRequired?: boolean
}

interface FeatureConfigCardProps {
  podName: string
  featureType: WaFeatureType
  config: PodWhatsAppConfig | undefined
  globalConfig: GlobalWhatsAppConfig | undefined
  onUpdate: (config: PodWhatsAppConfig) => void
  disabled?: boolean
}

const FEATURE_INFO: Record<
  WaFeatureType,
  { title: string; description: string; defaultMessage: string }
> = {
  daily_summary: {
    title: 'Daily Summary',
    description: 'Get a list of clients that need responses from your team',
    defaultMessage: 'DAILY SUMMARY - Clients needing response:',
  },
  ad_error: {
    title: 'Ad Account Errors',
    description: 'Notifications when ad account errors are detected',
    defaultMessage: '⚠️ Ad Account Error Detected',
  },
}

export default function WhatsAppSettingsClient({
  podName,
  initialWhatsAppNumber,
  initialConfigs,
  globalConfigs,
  isNumberRequired = false,
}: WhatsAppSettingsClientProps) {
  // STATES
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialWhatsAppNumber || '',
  )
  const [configs, setConfigs] = useState<PodWhatsAppConfig[]>(initialConfigs)
  const [isSavingNumber, setIsSavingNumber] = useState(false)
  const [numberSaved, setNumberSaved] = useState(false)
  const [hasValidNumber, setHasValidNumber] = useState(!isNumberRequired)

  // HANDLERS
  const handleSaveNumber = async () => {
    setIsSavingNumber(true)
    const result = await updatePodWhatsAppNumber(podName, whatsappNumber)
    setIsSavingNumber(false)

    if (result.success) {
      setNumberSaved(true)
      setHasValidNumber(true)
      setTimeout(() => setNumberSaved(false), 3000)
    } else {
      alert(result.error || 'Failed to save')
    }
  }

  const handleConfigUpdate = (updatedConfig: PodWhatsAppConfig) => {
    setConfigs((prev) => {
      const index = prev.findIndex(
        (c) =>
          c.pod_name === updatedConfig.pod_name &&
          c.feature_type === updatedConfig.feature_type,
      )
      if (index >= 0) {
        const newConfigs = [...prev]
        newConfigs[index] = updatedConfig
        return newConfigs
      }
      return [...prev, updatedConfig]
    })
  }

  const getConfigForFeature = (
    featureType: WaFeatureType,
  ): PodWhatsAppConfig | undefined => {
    return configs.find((c) => c.feature_type === featureType)
  }

  const getGlobalConfigForFeature = (
    featureType: WaFeatureType,
  ): GlobalWhatsAppConfig | undefined => {
    return globalConfigs.find((c) => c.feature_type === featureType)
  }

  return (
    <div className="space-y-8">
      {/* Global Config Notice */}
      {globalConfigs.some((c) => c.is_active) && (
        <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mt-0.5 h-5 w-5 text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-300">
                Global defaults are active
              </p>
              <p className="text-xs text-blue-200/70">
                Features marked &quot;Using Global&quot; will use global default
                settings unless you configure them specifically for this pod.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Feature Configurations */}
      <section className="space-y-6">
        <div>
          <h2 className="mb-1 text-lg font-semibold">Notification Features</h2>
          <p className="text-sm text-zinc-400">
            Configure when and how each notification type is sent. Features
            without pod-specific config will use global defaults if available.
          </p>
        </div>

        {!hasValidNumber ? (
          <div className="relative">
            {/* Disabled overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-900/80 backdrop-blur-[2px]">
              <div className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-zinc-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6 text-zinc-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-400">
                  Add a WhatsApp number to configure features
                </p>
              </div>
            </div>

            {/* Blurred content behind */}
            <div className="pointer-events-none select-none opacity-40">
              <FeatureConfigCard
                podName={podName}
                featureType="daily_summary"
                config={getConfigForFeature('daily_summary')}
                globalConfig={getGlobalConfigForFeature('daily_summary')}
                onUpdate={handleConfigUpdate}
                disabled
              />
              <div className="mt-6">
                <FeatureConfigCard
                  podName={podName}
                  featureType="ad_error"
                  config={getConfigForFeature('ad_error')}
                  globalConfig={getGlobalConfigForFeature('ad_error')}
                  onUpdate={handleConfigUpdate}
                  disabled
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <FeatureConfigCard
              podName={podName}
              featureType="daily_summary"
              config={getConfigForFeature('daily_summary')}
              globalConfig={getGlobalConfigForFeature('daily_summary')}
              onUpdate={handleConfigUpdate}
            />
            <FeatureConfigCard
              podName={podName}
              featureType="ad_error"
              config={getConfigForFeature('ad_error')}
              globalConfig={getGlobalConfigForFeature('ad_error')}
              onUpdate={handleConfigUpdate}
            />
          </>
        )}
      </section>
    </div>
  )
}

function FeatureConfigCard({
  podName,
  featureType,
  config,
  globalConfig,
  onUpdate,
  disabled = false,
}: FeatureConfigCardProps) {
  const info = FEATURE_INFO[featureType]
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Determine if using global config as fallback
  const isUsingGlobal = !config && globalConfig?.is_active
  const effectiveConfig = config || (isUsingGlobal ? globalConfig : null)

  const [formData, setFormData] = useState({
    isActive: config?.is_active ?? false,
    customMessage: config?.custom_message_header || '',
    frequency: config?.frequency || globalConfig?.frequency || 'daily',
    scheduledTime:
      config?.scheduled_time || getGlobalScheduledTime(globalConfig),
    activeDays:
      config?.active_days || daysOfWeekToString(globalConfig?.days_of_week),
  })

  const handleToggle = async () => {
    const newState = !formData.isActive
    setFormData((prev) => ({ ...prev, isActive: newState }))

    // If no config exists, create one with defaults
    if (!config) {
      const result = await upsertConfig({
        pod_name: podName,
        feature_type: featureType,
        is_active: newState,
        custom_message_header: null,
        frequency: formData.frequency,
        scheduled_time: formData.scheduledTime,
        active_days: formData.activeDays || null,
      })

      if (result.success && result.config) {
        onUpdate(result.config)
      } else {
        alert(result.error || 'Failed to enable feature')
        setFormData((prev) => ({ ...prev, isActive: !newState }))
      }
    } else {
      // Update existing config
      const result = await toggleConfigActive(podName, featureType, newState)
      if (result.success) {
        onUpdate({ ...config, is_active: newState })
      } else {
        alert(result.error || 'Failed to toggle feature')
        setFormData((prev) => ({ ...prev, isActive: !newState }))
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    const result = await upsertConfig({
      pod_name: podName,
      feature_type: featureType,
      is_active: formData.isActive,
      custom_message_header: formData.customMessage || null,
      frequency: formData.frequency,
      scheduled_time: formData.scheduledTime,
      active_days: formData.activeDays || null,
    })

    setIsSaving(false)

    if (result.success && result.config) {
      onUpdate(result.config)
      setIsEditing(false)
    } else {
      alert(result.error || 'Failed to save configuration')
    }
  }

  const toggleDay = (day: string) => {
    const days = formData.activeDays
      ? formData.activeDays.split(',').map((d) => d.trim())
      : []
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day]

    setFormData((prev) => ({
      ...prev,
      activeDays: newDays.join(','),
    }))
  }

  return (
    <div
      className={`rounded-lg border p-6 transition-all ${
        formData.isActive || isUsingGlobal
          ? 'border-zinc-700 bg-night-starlit'
          : 'border-zinc-800 bg-night-dusk opacity-70'
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h3 className="text-lg font-semibold">{info.title}</h3>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                formData.isActive
                  ? 'bg-green-500'
                  : isUsingGlobal
                    ? 'bg-blue-500'
                    : 'bg-zinc-500'
              }`}
            />
            {isUsingGlobal && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                Using Global
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">{info.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggle}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              formData.isActive
                ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {formData.isActive ? 'Disable' : 'Enable'}
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-600/20 px-3 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
            >
              Configure
            </button>
          )}
        </div>
      </div>

      {/* Current Configuration Display - Pod specific */}
      {!isEditing && config && (
        <div className="space-y-2 rounded-md border border-zinc-800 bg-night-midnight p-4 text-sm">
          <div>
            <span className="text-zinc-500">Schedule:</span>{' '}
            <span className="text-white">
              {config.frequency} at {config.scheduled_time}
            </span>
          </div>
          {config.active_days && (
            <div>
              <span className="text-zinc-500">Active Days:</span>{' '}
              <span className="text-white">{config.active_days}</span>
            </div>
          )}
          <div>
            <span className="text-zinc-500">Message:</span>{' '}
            <span className="text-white">
              {config.custom_message_header || (
                <em className="text-zinc-500">Using default message</em>
              )}
            </span>
          </div>
          {config.last_sent_at && (
            <div>
              <span className="text-zinc-500">Last Sent:</span>{' '}
              <span className="text-white">
                {new Date(config.last_sent_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Global Config Display - When using global fallback */}
      {!isEditing && !config && isUsingGlobal && globalConfig && (
        <div className="space-y-2 rounded-md border border-blue-800/50 bg-blue-950/20 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
            <span className="text-xs font-medium text-blue-300">
              Using Global Config
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Schedule:</span>{' '}
            <span className="text-white">
              {globalConfig.frequency} at {globalConfig.time}
            </span>
          </div>
          {globalConfig.days_of_week &&
            globalConfig.days_of_week.length > 0 && (
              <div>
                <span className="text-zinc-500">Active Days:</span>{' '}
                <span className="text-white">
                  {daysOfWeekToString(globalConfig.days_of_week)}
                </span>
              </div>
            )}
          <div>
            <span className="text-zinc-500">Message:</span>{' '}
            <span className="text-white">
              {globalConfig.custom_message || (
                <em className="text-zinc-500">Using default message</em>
              )}
            </span>
          </div>
          <p className="mt-2 text-xs text-blue-200/60">
            Click &quot;Configure&quot; to override with pod-specific settings
          </p>
        </div>
      )}

      {/* No Config Message */}
      {!isEditing && !config && !isUsingGlobal && (
        <div className="rounded-md border border-zinc-800 bg-night-midnight p-4 text-center text-sm text-zinc-500">
          No configuration set. Click &quot;Enable&quot; or
          &quot;Configure&quot; to set up this feature.
        </div>
      )}

      {/* Configuration Form */}
      {isEditing && (
        <div className="space-y-4 rounded-md border border-zinc-700 bg-night-midnight p-4">
          {/* Frequency */}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, frequency: e.target.value }))
              }
              className="w-full rounded-md border border-zinc-700 bg-night-dusk px-3 py-2 text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Scheduled Time (UTC)
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduledTime: e.target.value + ':00',
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-night-dusk px-3 py-2 text-white"
            />
          </div>

          {/* Active Days */}
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Active Days (leave empty for all days)
            </label>
            <div className="flex gap-1">
              {DAYS.map((day) => {
                const days = formData.activeDays
                  ? formData.activeDays.split(',').map((d) => d.trim())
                  : []
                const isSelected = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Message Header */}
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Custom Message Header (optional)
            </label>
            <textarea
              value={formData.customMessage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customMessage: e.target.value,
                }))
              }
              rows={2}
              placeholder={info.defaultMessage}
              className="w-full rounded-md border border-zinc-700 bg-night-dusk px-3 py-2 text-white placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Leave empty to use default: &quot;{info.defaultMessage}&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
