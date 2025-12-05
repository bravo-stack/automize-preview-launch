'use client'

import {
  toggleConfigActive,
  updatePodWhatsAppNumber,
  upsertConfig,
} from '@/lib/actions/pod-whatsapp-configs'
import { runTestWhatsAppJob } from '@/lib/actions/whatsapp-test'
import type { PodWhatsAppConfig, WaFeatureType } from '@/types/whatsapp'
import { useState } from 'react'

interface WhatsAppSettingsClientProps {
  podName: string
  initialWhatsAppNumber: string | null
  initialConfigs: PodWhatsAppConfig[]
  podServers: string[]
  podWhatsappNumber: string | null
}

interface FeatureConfigCardProps {
  podName: string
  featureType: WaFeatureType
  config: PodWhatsAppConfig | undefined
  onUpdate: (config: PodWhatsAppConfig) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FEATURE_INFO: Record<
  WaFeatureType,
  { title: string; description: string; defaultMessage: string }
> = {
  daily_summary: {
    title: 'Daily Summary',
    description: 'Get a list of clients that need responses from your team',
    defaultMessage: 'DAILY SUMMARY - Clients needing response:',
  },
  late_alert: {
    title: 'Late Response Alerts',
    description: 'Urgent alerts when clients are waiting too long for replies',
    defaultMessage: '🚨 LATE RESPONSE ALERTS',
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
  podServers,
  podWhatsappNumber,
}: WhatsAppSettingsClientProps) {
  // STATES
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialWhatsAppNumber || '',
  )
  const [configs, setConfigs] = useState<PodWhatsAppConfig[]>(initialConfigs)
  const [isSavingNumber, setIsSavingNumber] = useState(false)
  const [numberSaved, setNumberSaved] = useState(false)
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testResults, setTestResults] = useState<{
    messagesSent: number
    results: { type: string; sent: boolean; preview: string; error?: string }[]
  } | null>(null)

  // HANDLERS
  const handleTestJob = async () => {
    setIsTestRunning(true)
    setTestResults(null)
    const result = await runTestWhatsAppJob(
      podName,
      podServers,
      podWhatsappNumber,
    )
    setIsTestRunning(false)
    setTestResults({
      messagesSent: result.messagesSent,
      results: result.results,
    })
  }

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

  return (
    <div className="space-y-8">
      {/* Test Job Section */}
      <section className="rounded-lg border border-amber-800 bg-amber-950/20 p-6">
        <h2 className="mb-2 text-lg font-semibold text-amber-400">
          Test WhatsApp Job
        </h2>
        <p className="mb-4 text-sm text-amber-200/70">
          Test all WhatsApp notifications. Messages will be sent to:{' '}
          <code className="rounded bg-amber-900/30 px-2 py-0.5">
            +2349048188177
          </code>
        </p>
        <button
          onClick={handleTestJob}
          disabled={isTestRunning}
          className="rounded-md bg-amber-600 px-6 py-2 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {isTestRunning ? 'Running Job...' : 'Run Test Job'}
        </button>

        {/* Test Results */}
        {testResults && (
          <div className="mt-4 space-y-2 rounded-md border border-amber-700 bg-amber-950/30 p-4">
            <div className="mb-3 text-sm font-medium text-amber-300">
              Job Complete - {testResults.messagesSent} message
              {testResults.messagesSent !== 1 ? 's' : ''} sent
            </div>
            {testResults.results.map((result, index) => (
              <div
                key={index}
                className={`rounded border p-3 text-sm ${
                  result.sent
                    ? 'border-green-800 bg-green-950/30'
                    : 'border-red-800 bg-red-950/30'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">
                    {result.sent ? '✓' : '✗'} {result.type}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">{result.preview}</div>
                {result.error && (
                  <div className="mt-1 text-xs text-red-400">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

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
            Configure when and how each notification type is sent
          </p>
        </div>

        <FeatureConfigCard
          podName={podName}
          featureType="daily_summary"
          config={getConfigForFeature('daily_summary')}
          onUpdate={handleConfigUpdate}
        />
        <FeatureConfigCard
          podName={podName}
          featureType="late_alert"
          config={getConfigForFeature('late_alert')}
          onUpdate={handleConfigUpdate}
        />
        <FeatureConfigCard
          podName={podName}
          featureType="ad_error"
          config={getConfigForFeature('ad_error')}
          onUpdate={handleConfigUpdate}
        />
      </section>
    </div>
  )
}

function FeatureConfigCard({
  podName,
  featureType,
  config,
  onUpdate,
}: FeatureConfigCardProps) {
  const info = FEATURE_INFO[featureType]
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    isActive: config?.is_active ?? false,
    customMessage: config?.custom_message_header || '',
    frequency: config?.frequency || 'daily',
    scheduledTime: config?.scheduled_time || '09:00:00',
    activeDays: config?.active_days || '',
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
        formData.isActive
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
                formData.isActive ? 'bg-green-500' : 'bg-zinc-500'
              }`}
            />
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

      {/* Current Configuration Display */}
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
