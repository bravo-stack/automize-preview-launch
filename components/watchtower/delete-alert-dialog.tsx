'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface DeleteAlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  alertMessage?: string
  isLoading?: boolean
}

export default function DeleteAlertDialog({
  isOpen,
  onClose,
  onConfirm,
  alertMessage,
  isLoading = false,
}: DeleteAlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-alert-dialog-title"
        aria-describedby="delete-alert-dialog-description"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm text-white/50 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        {/* Title */}
        <h2
          id="delete-alert-dialog-title"
          className="mb-2 text-center text-lg font-semibold text-white"
        >
          Delete Alert
        </h2>

        {/* Description */}
        <p
          id="delete-alert-dialog-description"
          className="mb-6 text-center text-sm text-white/60"
        >
          Are you sure you want to delete this alert?
          {alertMessage && (
            <>
              <br />
              <span className="mt-2 block truncate font-medium text-white/80">
                &quot;{alertMessage}&quot;
              </span>
            </>
          )}
          <br />
          <span className="mt-2 block text-white/40">
            This action cannot be undone.
          </span>
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            size="lg"
            disabled={isLoading}
            className="flex-1 border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            size="lg"
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading ? (
              'Deleting...'
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
