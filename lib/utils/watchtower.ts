import type { TargetTable } from '@/types/api-storage'

// ============================================================================
// Watchtower Utility Functions
// These are pure utility functions that don't require server actions
// ============================================================================

/**
 * Maps logical target table names to actual database table configurations.
 * This bridges the gap between Hub data domains and underlying database tables.
 *
 * Hub Data Domain Mapping:
 * - facebook_metrics → refresh_snapshot_metrics (where snapshot.refresh_type = 'autometric')
 * - finance_metrics → refresh_snapshot_metrics (where snapshot.refresh_type = 'financialx')
 * - api_records → api_records (via api_snapshots → api_sources)
 * - form_submissions → form_submissions
 * - api_snapshots → api_snapshots
 * - sheet_snapshots → sheet_refresh_snapshots
 */
export interface TableMapping {
  actualTable: string
  joinConfig?: {
    joinTable: string
    joinCondition: string
    filterField?: string
    filterValue?: string
  }
}

export function getTableMapping(targetTable: TargetTable): TableMapping {
  switch (targetTable) {
    case 'facebook_metrics':
      return {
        actualTable: 'refresh_snapshot_metrics',
        joinConfig: {
          joinTable: 'sheet_refresh_snapshots',
          joinCondition: 'snapshot_id',
          filterField: 'refresh_type',
          filterValue: 'autometric',
        },
      }
    case 'finance_metrics':
      return {
        actualTable: 'refresh_snapshot_metrics',
        joinConfig: {
          joinTable: 'sheet_refresh_snapshots',
          joinCondition: 'snapshot_id',
          filterField: 'refresh_type',
          filterValue: 'financialx',
        },
      }
    case 'api_records':
      return { actualTable: 'api_records' }
    case 'form_submissions':
      return { actualTable: 'form_submissions' }
    case 'api_snapshots':
      return { actualTable: 'api_snapshots' }
    case 'sheet_snapshots':
      return { actualTable: 'sheet_refresh_snapshots' }
    default:
      return { actualTable: targetTable }
  }
}

/**
 * Gets a human-readable label for a target table
 */
export function getTargetTableLabel(targetTable: TargetTable): string {
  const labels: Record<TargetTable, string> = {
    facebook_metrics: 'Facebook (Autometric)',
    finance_metrics: 'Finance (FinancialX)',
    api_records: 'API Data Records',
    form_submissions: 'Form Submissions',
    api_snapshots: 'API Snapshots',
    sheet_snapshots: 'Sheet Snapshots',
  }
  return labels[targetTable] || targetTable
}

/**
 * Gets a description for a target table / data domain
 */
export function getTargetTableDescription(targetTable: TargetTable): string {
  const descriptions: Record<TargetTable, string> = {
    facebook_metrics:
      'Monitors Facebook Ads performance metrics from Autometric sheets. Fields include ad spend, ROAS, CPA, CTR, and other Facebook advertising KPIs.',
    finance_metrics:
      'Monitors financial rebill metrics from FinancialX sheets. Fields include rebill spend, rebill ROAS, and revenue tracking.',
    api_records:
      'Monitors individual records fetched from external APIs like Omnisend, Shopify, and other integrations.',
    form_submissions:
      'Monitors form submission status for Day Drop requests and Website Revamp requests.',
    api_snapshots:
      'Monitors API data sync health and status. Alert on failed syncs or high error rates.',
    sheet_snapshots:
      'Monitors Google Sheet refresh status. Alert on sync failures or stale data.',
  }
  return (
    descriptions[targetTable] ||
    'No description available for this data domain.'
  )
}
