'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { WatchtowerRuleWithRelations } from '@/types/watchtower'
import { getTimeRangeDaysLabel } from '@/types/watchtower'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// ============================================================================
// Target Table Labels - Maps to Hub Data Domains
// ============================================================================

const TARGET_TABLE_LABELS: Record<string, string> = {
  facebook_metrics: 'Facebook (Autometric)',
  finance_metrics: 'Finance (FinancialX)',
  api_records: 'API Data Records',
  form_submissions: 'Form Submissions',
  api_snapshots: 'API Snapshots',
  sheet_snapshots: 'Sheet Snapshots',
}

function getTargetTableLabel(table: string | null): string {
  if (!table) return 'Any'
  return TARGET_TABLE_LABELS[table] || table.replace(/_/g, ' ')
}

function getTimeRangeLabel(timeRangeDays: number | null): string {
  return getTimeRangeDaysLabel(timeRangeDays)
}

/**
 * Calculate days since deletion
 */
function getDaysSinceDeleted(deletedAt: string | null): number {
  if (!deletedAt) return 0
  const deleted = new Date(deletedAt)
  const now = new Date()
  return Math.floor((now.getTime() - deleted.getTime()) / (24 * 60 * 60 * 1000))
}

/**
 * Calculate days until eligible for hard deletion (30 days after soft delete)
 */
function getDaysUntilHardDelete(deletedAt: string | null): number {
  if (!deletedAt) return 30
  const daysSince = getDaysSinceDeleted(deletedAt)
  return Math.max(0, 30 - daysSince)
}

/**
 * Check if rule is eligible for permanent deletion (30+ days since soft delete)
 */
function isEligibleForHardDelete(deletedAt: string | null): boolean {
  return getDaysUntilHardDelete(deletedAt) === 0
}

interface DeletedRuleListProps {
  rules: WatchtowerRuleWithRelations[]
  onRestore: (ruleId: string, restoreGroup?: boolean) => void
  onHardDelete: (ruleId: string, deleteGroup?: boolean) => void
  isLoading?: boolean
}

interface HardDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  ruleName: string
  isCompound?: boolean
  isLoading?: boolean
  isEligible: boolean
  daysRemaining: number
}

function HardDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  ruleName,
  isCompound = false,
  isLoading = false,
  isEligible,
  daysRemaining,
}: HardDeleteDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

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
        aria-labelledby="hard-delete-dialog-title"
        aria-describedby="hard-delete-dialog-description"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm text-white/50 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        <h2
          id="hard-delete-dialog-title"
          className="mb-2 text-center text-lg font-semibold text-white"
        >
          Permanently Delete Rule
        </h2>

        <div
          id="hard-delete-dialog-description"
          className="mb-6 text-center text-sm"
        >
          {isEligible ? (
            <>
              <p className="text-white/60">
                Are you sure you want to permanently delete{' '}
                <span className="font-medium text-white">
                  &quot;{ruleName}&quot;
                </span>
                ?
              </p>
              {isCompound && (
                <p className="mt-2 text-yellow-400">
                  This will permanently delete all clauses in this compound
                  rule.
                </p>
              )}
              <p className="mt-2 text-red-400">
                This action is irreversible. The rule and all its data will be
                permanently removed.
              </p>
            </>
          ) : (
            <>
              <p className="text-white/60">
                <span className="font-medium text-white">
                  &quot;{ruleName}&quot;
                </span>{' '}
                cannot be permanently deleted yet.
              </p>
              <p className="mt-2 text-yellow-400">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                until eligible for permanent deletion.
              </p>
              <p className="mt-2 text-white/40">
                Rules can only be permanently deleted 30 days after being moved
                to trash.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          {isEligible && (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Forever
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DeletedRuleList({
  rules,
  onRestore,
  onHardDelete,
  isLoading = false,
}: DeletedRuleListProps) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [hardDeleteDialog, setHardDeleteDialog] = useState<{
    isOpen: boolean
    ruleId: string
    ruleName: string
    isCompound: boolean
    deleteGroup: boolean
    deletedAt: string | null
  }>({
    isOpen: false,
    ruleId: '',
    ruleName: '',
    isCompound: false,
    deleteGroup: false,
    deletedAt: null,
  })

  const openHardDeleteDialog = (
    ruleId: string,
    ruleName: string,
    deletedAt: string | null,
    isCompound: boolean = false,
    deleteGroup: boolean = false,
  ) => {
    setHardDeleteDialog({
      isOpen: true,
      ruleId,
      ruleName,
      isCompound,
      deleteGroup,
      deletedAt,
    })
  }

  const closeHardDeleteDialog = () => {
    setHardDeleteDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const confirmHardDelete = () => {
    if (isEligibleForHardDelete(hardDeleteDialog.deletedAt)) {
      onHardDelete(hardDeleteDialog.ruleId, hardDeleteDialog.deleteGroup)
    }
    closeHardDeleteDialog()
  }

  const toggleExpand = (ruleId: string) => {
    setExpandedRules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId)
      } else {
        newSet.add(ruleId)
      }
      return newSet
    })
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 bg-red-500/20 text-red-400"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Critical
          </Badge>
        )
      case 'warning':
        return (
          <Badge
            variant="outline"
            className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/20 text-blue-400"
          >
            <Info className="mr-1 h-3 w-3" />
            Info
          </Badge>
        )
    }
  }

  const getConditionDisplay = (condition: string, threshold: string | null) => {
    const conditionMap: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      greater_than: '>',
      less_than: '<',
      greater_than_or_equal: '≥',
      less_than_or_equal: '≤',
      changed: '⟳ changed',
      changed_by_percent: '⟳ changed by %',
      contains: 'contains',
      not_contains: 'not contains',
      is_null: 'is null',
      is_not_null: 'is not null',
    }

    const symbol = conditionMap[condition] || condition
    return threshold ? `${symbol} ${threshold}` : symbol
  }

  // Show loading skeleton
  if (isLoading && rules.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-5 rounded bg-white/10" />
                <div>
                  <div className="h-5 w-40 rounded bg-white/10" />
                  <div className="mt-2 h-4 w-60 rounded bg-white/5" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded bg-white/10" />
                <div className="h-8 w-8 rounded bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <div className="text-center">
          <Trash2 className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/60">No deleted rules</p>
          <p className="text-sm text-white/40">
            Deleted rules will appear here for 30 days before they can be
            permanently removed
          </p>
        </div>
      </div>
    )
  }

  // Group rules by group_id for compound rules display
  const groupedRules = new Map<string | null, WatchtowerRuleWithRelations[]>()
  const standaloneRules: WatchtowerRuleWithRelations[] = []

  rules.forEach((rule) => {
    if (rule.group_id) {
      const existing = groupedRules.get(rule.group_id) || []
      existing.push(rule)
      groupedRules.set(rule.group_id, existing)
    } else {
      standaloneRules.push(rule)
    }
  })

  const compoundRules = Array.from(groupedRules.values()).map((group) => ({
    mainRule: group[0],
    clauses: group,
  }))

  return (
    <div className="space-y-4">
      {/* Standalone Deleted Rules */}
      {standaloneRules.map((rule) => {
        const daysSince = getDaysSinceDeleted(rule.deleted_at)
        const daysUntil = getDaysUntilHardDelete(rule.deleted_at)
        const isEligible = isEligibleForHardDelete(rule.deleted_at)

        return (
          <div
            key={rule.id}
            className="rounded-lg border border-red-500/20 bg-red-500/5 opacity-75"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleExpand(rule.id)}
                  className="text-white/60 hover:text-white"
                >
                  {expandedRules.has(rule.id) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white/70 line-through">
                      {rule.name}
                    </h3>
                    {getSeverityBadge(rule.severity)}
                    <Badge
                      variant="outline"
                      className="border-red-500/30 text-red-400"
                    >
                      Deleted {daysSince}d ago
                    </Badge>
                    {!isEligible && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-400"
                      >
                        {daysUntil}d until permanent delete
                      </Badge>
                    )}
                    {isEligible && (
                      <Badge
                        variant="outline"
                        className="border-red-500/50 bg-red-500/10 text-red-400"
                      >
                        Eligible for permanent deletion
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/40">
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                      {rule.field_name}
                    </code>{' '}
                    {getConditionDisplay(rule.condition, rule.threshold_value)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestore(rule.id)}
                  disabled={isLoading}
                  title="Restore rule"
                  className="text-green-400 hover:text-green-300"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    openHardDeleteDialog(rule.id, rule.name, rule.deleted_at)
                  }
                  disabled={isLoading}
                  className={`${
                    isEligible
                      ? 'text-red-400 hover:text-red-300'
                      : 'cursor-not-allowed text-white/30'
                  }`}
                  title={
                    isEligible
                      ? 'Permanently delete'
                      : `${daysUntil} days until eligible`
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRules.has(rule.id) && (
              <div className="border-t border-red-500/20 px-4 py-3">
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-white/50">Data Domain</span>
                    <p className="text-white/70">
                      {getTargetTableLabel(rule.target_table)}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Time Range</span>
                    <p className="flex items-center gap-1 text-white/70">
                      <Calendar className="h-3 w-3 text-white/40" />
                      {getTimeRangeLabel(rule.time_range_days)}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Deleted At</span>
                    <p className="text-white/70">
                      {rule.deleted_at
                        ? new Date(rule.deleted_at).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Created</span>
                    <p className="text-white/70">
                      {new Date(rule.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {rule.description && (
                  <p className="mt-3 text-sm text-white/50">
                    {rule.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Compound Deleted Rules */}
      {compoundRules.map(({ mainRule, clauses }) => {
        const daysSince = getDaysSinceDeleted(mainRule.deleted_at)
        const daysUntil = getDaysUntilHardDelete(mainRule.deleted_at)
        const isEligible = isEligibleForHardDelete(mainRule.deleted_at)

        return (
          <div
            key={mainRule.group_id}
            className="rounded-lg border border-red-500/20 bg-red-500/5 opacity-75"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleExpand(mainRule.group_id!)}
                  className="text-white/60 hover:text-white"
                >
                  {expandedRules.has(mainRule.group_id!) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white/70 line-through">
                      {mainRule.name}
                    </h3>
                    {getSeverityBadge(mainRule.severity)}
                    <Badge
                      variant="outline"
                      className="border-purple-500/30 text-purple-400/70"
                    >
                      {clauses.length} clauses ({mainRule.logic_operator})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-red-500/30 text-red-400"
                    >
                      Deleted {daysSince}d ago
                    </Badge>
                    {!isEligible && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-400"
                      >
                        {daysUntil}d until permanent delete
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/40">
                    Compound rule with {clauses.length} conditions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRestore(mainRule.id, true)}
                  disabled={isLoading}
                  title="Restore rule group"
                  className="text-green-400 hover:text-green-300"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    openHardDeleteDialog(
                      mainRule.id,
                      mainRule.name,
                      mainRule.deleted_at,
                      true,
                      true,
                    )
                  }
                  disabled={isLoading}
                  className={`${
                    isEligible
                      ? 'text-red-400 hover:text-red-300'
                      : 'cursor-not-allowed text-white/30'
                  }`}
                  title={
                    isEligible
                      ? 'Permanently delete group'
                      : `${daysUntil} days until eligible`
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Clauses */}
            {expandedRules.has(mainRule.group_id!) && (
              <div className="border-t border-red-500/20 px-4 py-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/50">Clauses:</p>
                  {clauses.map((clause, index) => (
                    <div
                      key={clause.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {index > 0 && (
                        <span className="text-purple-400/70">
                          {mainRule.logic_operator}
                        </span>
                      )}
                      <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                        {clause.field_name}
                      </code>
                      <span className="text-white/40">
                        {getConditionDisplay(
                          clause.condition,
                          clause.threshold_value,
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {mainRule.description && (
                  <p className="mt-3 text-sm text-white/50">
                    {mainRule.description}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Hard Delete Confirmation Dialog */}
      <HardDeleteDialog
        isOpen={hardDeleteDialog.isOpen}
        onClose={closeHardDeleteDialog}
        onConfirm={confirmHardDelete}
        ruleName={hardDeleteDialog.ruleName}
        isCompound={hardDeleteDialog.isCompound}
        isLoading={isLoading}
        isEligible={isEligibleForHardDelete(hardDeleteDialog.deletedAt)}
        daysRemaining={getDaysUntilHardDelete(hardDeleteDialog.deletedAt)}
      />
    </div>
  )
}
