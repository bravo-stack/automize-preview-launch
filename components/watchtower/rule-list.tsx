'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DeleteRuleDialog from '@/components/watchtower/delete-rule-dialog'
import type { WatchtowerRuleWithRelations } from '@/types/watchtower'
import { getTimeRangeDaysLabel } from '@/types/watchtower'
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Info,
  Link2,
  MessageCircle,
  Pause,
  Play,
  Trash2,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

// Discord icon component (custom SVG)
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

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
 * Format a date string as relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface RuleListProps {
  rules: WatchtowerRuleWithRelations[]
  onEdit: (rule: WatchtowerRuleWithRelations) => void
  onDelete: (ruleId: string, deleteGroup?: boolean) => void
  onToggle: (ruleId: string, isActive: boolean) => void
  isLoading?: boolean
}

export default function RuleList({
  rules,
  onEdit,
  onDelete,
  onToggle,
  isLoading = false,
}: RuleListProps) {
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    ruleId: string
    ruleName: string
    isCompound: boolean
    deleteGroup: boolean
  }>({
    isOpen: false,
    ruleId: '',
    ruleName: '',
    isCompound: false,
    deleteGroup: false,
  })

  const openDeleteDialog = (
    ruleId: string,
    ruleName: string,
    isCompound: boolean = false,
    deleteGroup: boolean = false,
  ) => {
    setDeleteDialog({
      isOpen: true,
      ruleId,
      ruleName,
      isCompound,
      deleteGroup,
    })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const confirmDelete = () => {
    onDelete(deleteDialog.ruleId, deleteDialog.deleteGroup)
    closeDeleteDialog()
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
      increased_by_value: '↑ increased by',
      decreased_by_value: '↓ decreased by',
      increased_by_percent: '↑ increased by %',
      decreased_by_percent: '↓ decreased by %',
      contains: 'contains',
      not_contains: 'not contains',
      is_null: 'is null',
      is_not_null: 'is not null',
    }

    const symbol = conditionMap[condition] || condition
    return threshold ? `${symbol} ${threshold}` : symbol
  }

  // Show loading skeleton during initial load
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
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/60">No rules configured</p>
          <p className="text-sm text-white/40">
            Create your first rule to get started
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

  // Get first rule of each group to display as the main rule
  const compoundRules = Array.from(groupedRules.values()).map((group) => ({
    mainRule: group[0],
    clauses: group,
  }))

  return (
    <div className="space-y-4">
      {/* Standalone Rules */}
      {standaloneRules.map((rule) => (
        <div
          key={rule.id}
          className={`rounded-lg border transition-all ${
            rule.is_active
              ? 'border-white/10 bg-white/5'
              : 'border-white/5 bg-white/[0.02] opacity-60'
          }`}
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
                  <h3 className="font-medium text-white">{rule.name}</h3>
                  {getSeverityBadge(rule.severity)}
                  {!rule.is_active && (
                    <Badge variant="outline" className="text-white/50">
                      Inactive
                    </Badge>
                  )}
                  {/* Notification indicators */}
                  {rule.notify_discord && (
                    <span
                      title={`Discord notifications enabled${rule.pod_ids && rule.pod_ids.length > 0 ? ` (${rule.pod_ids.length + 1} channels)` : ''}${rule.extra_discord_channel_ids && rule.extra_discord_channel_ids.length > 0 ? ` (+${rule.extra_discord_channel_ids.length} extra)` : ''}`}
                      className="flex items-center"
                    >
                      <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                    </span>
                  )}
                  {rule.notify_whatsapp && (
                    <span
                      title="WhatsApp notifications enabled"
                      className="flex items-center"
                    >
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    </span>
                  )}
                  {/* Trigger indicator */}
                  {rule.trigger_count > 0 && (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-green-400"
                      title={`Triggered ${rule.trigger_count} time${rule.trigger_count > 1 ? 's' : ''}, last: ${formatTimeAgo(rule.last_triggered_at)}`}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {rule.trigger_count}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/60">
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                    {rule.field_name}
                  </code>{' '}
                  {getConditionDisplay(rule.condition, rule.threshold_value)}
                  {rule.last_triggered_at && (
                    <span className="ml-2 text-xs text-white/40">
                      • Last triggered: {formatTimeAgo(rule.last_triggered_at)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {rule.parent_rule_id && (
                <span title="Has dependency">
                  <Link2 className="h-4 w-4 text-blue-400" />
                </span>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggle(rule.id, !rule.is_active)}
                disabled={isLoading}
                title={rule.is_active ? 'Pause rule' : 'Activate rule'}
              >
                {rule.is_active ? (
                  <Pause className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Play className="h-4 w-4 text-green-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(rule)}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(rule.id, rule.name)}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedRules.has(rule.id) && (
            <div className="border-t border-white/10 px-4 py-3">
              {/* Trigger Stats */}
              <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                  <Zap className="h-4 w-4" />
                  Trigger Activity
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-white/50">Total Triggers</span>
                    <p
                      className={`font-mono text-lg ${rule.trigger_count > 0 ? 'text-green-400' : 'text-white/40'}`}
                    >
                      {rule.trigger_count || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Last Triggered</span>
                    <p className="text-white/80">
                      {rule.last_triggered_at
                        ? new Date(rule.last_triggered_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Last Notified</span>
                    <p className="text-white/80">
                      {rule.last_notified_at
                        ? new Date(rule.last_notified_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                <div>
                  <span className="text-white/50">Data Domain</span>
                  <p className="text-white/80">
                    {getTargetTableLabel(rule.target_table)}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Time Range</span>
                  <p className="flex items-center gap-1 text-white/80">
                    <Calendar className="h-3 w-3 text-white/40" />
                    {getTimeRangeLabel(rule.time_range_days)}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Source</span>
                  <p className="text-white/80">
                    {rule.source?.display_name || 'Any'}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Created</span>
                  <p className="text-white/80">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Last Updated</span>
                  <p className="text-white/80">
                    {new Date(rule.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {rule.description && (
                <p className="mt-3 text-sm text-white/60">{rule.description}</p>
              )}

              {/* Notification Details */}
              <div className="mt-3 flex flex-wrap gap-2">
                {rule.notify_discord && (
                  <Badge variant="outline" className="text-white/60">
                    Discord:{' '}
                    {rule.discord_channel_id?.slice(0, 8) || 'configured'}...
                  </Badge>
                )}
                {rule.notify_whatsapp && (
                  <Badge variant="outline" className="text-green-400/60">
                    WhatsApp
                  </Badge>
                )}
                {rule.notify_schedule && (
                  <Badge variant="outline" className="text-white/60">
                    Schedule: {rule.notify_schedule} at {rule.notify_time}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Compound Rules */}
      {compoundRules.map(({ mainRule, clauses }) => (
        <div
          key={mainRule.group_id}
          className={`rounded-lg border transition-all ${
            mainRule.is_active
              ? 'border-white/10 bg-white/5'
              : 'border-white/5 bg-white/[0.02] opacity-60'
          }`}
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
                  <h3 className="font-medium text-white">{mainRule.name}</h3>
                  {getSeverityBadge(mainRule.severity)}
                  <Badge
                    variant="outline"
                    className="border-purple-500/30 text-purple-400"
                  >
                    {clauses.length} clauses ({mainRule.logic_operator})
                  </Badge>
                  {!mainRule.is_active && (
                    <Badge variant="outline" className="text-white/50">
                      Inactive
                    </Badge>
                  )}
                  {/* Notification indicators for compound rules */}
                  {mainRule.notify_discord && (
                    <span
                      title={`Discord notifications enabled${mainRule.pod_ids && mainRule.pod_ids.length > 0 ? ` (${mainRule.pod_ids.length + 1} channels)` : ''}${mainRule.extra_discord_channel_ids && mainRule.extra_discord_channel_ids.length > 0 ? ` (+${mainRule.extra_discord_channel_ids.length} extra)` : ''}`}
                      className="flex items-center"
                    >
                      <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                    </span>
                  )}
                  {mainRule.notify_whatsapp && (
                    <span
                      title="WhatsApp notifications enabled"
                      className="flex items-center"
                    >
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    </span>
                  )}
                  {/* Trigger indicator for compound rules */}
                  {mainRule.trigger_count > 0 && (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-green-400"
                      title={`Triggered ${mainRule.trigger_count} time${mainRule.trigger_count > 1 ? 's' : ''}, last: ${formatTimeAgo(mainRule.last_triggered_at)}`}
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {mainRule.trigger_count}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/60">
                  Compound rule with {clauses.length} conditions
                  {mainRule.last_triggered_at && (
                    <span className="ml-2 text-xs text-white/40">
                      • Last triggered:{' '}
                      {formatTimeAgo(mainRule.last_triggered_at)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggle(mainRule.id, !mainRule.is_active)}
                disabled={isLoading}
                title={mainRule.is_active ? 'Pause rule' : 'Activate rule'}
              >
                {mainRule.is_active ? (
                  <Pause className="h-4 w-4 text-yellow-400" />
                ) : (
                  <Play className="h-4 w-4 text-green-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(mainRule)}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  openDeleteDialog(mainRule.id, mainRule.name, true, true)
                }
                disabled={isLoading}
                className="text-red-400 hover:text-red-300"
                title="Delete entire rule group"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Clauses */}
          {expandedRules.has(mainRule.group_id!) && (
            <div className="border-t border-white/10 px-4 py-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/70">Clauses:</p>
                {clauses.map((clause, index) => (
                  <div
                    key={clause.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {index > 0 && (
                      <span className="text-purple-400">
                        {mainRule.logic_operator}
                      </span>
                    )}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                      {clause.field_name}
                    </code>
                    <span className="text-white/60">
                      {getConditionDisplay(
                        clause.condition,
                        clause.threshold_value,
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {mainRule.description && (
                <p className="mt-3 text-sm text-white/60">
                  {mainRule.description}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <DeleteRuleDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        ruleName={deleteDialog.ruleName}
        isCompound={deleteDialog.isCompound}
        isLoading={isLoading}
      />
    </div>
  )
}
