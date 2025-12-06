'use client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type {
  CVRAggregates,
  CVRMetricsComparison,
  DateRange,
} from '@/types/cvr-hub'
import { useState } from 'react'

interface SaveCVRButtonProps {
  metrics: CVRMetricsComparison[]
  aggregates: CVRAggregates
  dateRange: DateRange
  clientId?: number
  disabled?: boolean
}

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
