'use client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type {
  CVRAggregates,
  CVRMetricsComparison,
  DateRange,
} from '@/types/cvr-hub'
import { Info, Save } from 'lucide-react'
import { useState } from 'react'

interface SaveCVRButtonProps {
  metrics: CVRMetricsComparison[]
  aggregates: CVRAggregates
  dateRange: DateRange
  clientId?: number
  disabled?: boolean
}

// Feature is currently disabled - will be enabled in future release
const FEATURE_ENABLED = false

export default function SaveCVRButton({
  metrics,
  aggregates,
  dateRange,
  clientId,
  disabled = false,
}: SaveCVRButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  // Feature is disabled - return disabled button with info
  if (!FEATURE_ENABLED) {
    return (
      <div className="relative">
        <Button
          disabled
          className="cursor-not-allowed opacity-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Save className="mr-2 h-4 w-4" />
          Save CVR Data
        </Button>
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm shadow-lg">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
              <div>
                <p className="font-medium text-blue-400">Coming Soon</p>
                <p className="mt-1 text-blue-400/80">
                  Save metrics to database and Google Sheets for historical
                  tracking.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      const response = await fetch('/api/cvr-hub/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          aggregates,
          dateRange,
          clientId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSaveStatus({
          success: true,
          message: `Successfully saved ${result.data.recordCount} records to ${
            result.data.savedToDatabase && result.data.savedToSheets
              ? 'database and Google Sheets'
              : result.data.savedToDatabase
                ? 'database'
                : 'Google Sheets'
          }`,
        })

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSaveStatus(null), 5000)
      } else {
        setSaveStatus({
          success: false,
          message: result.error || 'Failed to save CVR data',
        })
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSave}
        disabled={disabled || isSaving || metrics.length === 0}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isSaving ? 'Saving...' : 'Save CVR Data'}
      </Button>

      {saveStatus && (
        <Alert
          variant={saveStatus.success ? 'default' : 'destructive'}
          className={
            saveStatus.success
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : ''
          }
        >
          {saveStatus.message}
        </Alert>
      )}
    </div>
  )
}
