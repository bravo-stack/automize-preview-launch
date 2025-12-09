'use client'

import type { FormsCategoryStats, PaginatedResponse } from '@/types/data-hub'
import {
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Globe,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import PaginatedTable from './paginated-table'
import SectionHeader from './section-header'
import StatCard from './stat-card'
import StatusBadge from './status-badge'

type FormsSubTab = 'day-drop' | 'website-revamp'

const DEFAULT_PAGE_SIZE = 15

const subTabs: { id: FormsSubTab; label: string; icon: typeof Calendar }[] = [
  { id: 'day-drop', label: 'Day Drop Requests', icon: Calendar },
  { id: 'website-revamp', label: 'Website Revamp', icon: Globe },
]

export default function FormsView() {
  const [activeSubTab, setActiveSubTab] = useState<FormsSubTab>('day-drop')
  const [stats, setStats] = useState<FormsCategoryStats | null>(null)
  const [tableData, setTableData] = useState<PaginatedResponse<
    Record<string, unknown>
  > | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/data-hub/forms/stats')
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch (err) {
      console.error('Error fetching forms stats:', err)
    }
  }, [])

  const fetchTableData = useCallback(
    async (tab: FormsSubTab, page: number, status?: string) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(DEFAULT_PAGE_SIZE),
        })
        if (status) params.set('status', status)

        const endpoint = tab === 'day-drop' ? 'day-drop' : 'website-revamp'
        const res = await fetch(`/api/data-hub/forms/${endpoint}?${params}`)
        const json = await res.json()

        if (json.success) {
          setTableData({
            data: json.data,
            pagination: json.pagination,
          })
        }
      } catch (err) {
        console.error(`Error fetching ${tab} forms:`, err)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    setCurrentPage(1)
    fetchTableData(activeSubTab, 1, statusFilter)
  }, [activeSubTab, fetchTableData, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchTableData(activeSubTab, page, statusFilter)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  const dayDropColumns = [
    { key: 'brand_name', header: 'Brand' },
    { key: 'discord_username', header: 'Discord' },
    { key: 'drop_name', header: 'Drop Name' },
    { key: 'collection_name', header: 'Collection' },
    {
      key: 'drop_date',
      header: 'Drop Date',
      render: (v: unknown): ReactNode =>
        v ? new Date(v as string).toLocaleDateString() : '-',
    },
    { key: 'timezone_and_time', header: 'Time' },
    {
      key: 'sms_required',
      header: 'SMS',
      render: (v: unknown): ReactNode => (v ? 'Yes' : 'No'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: unknown): ReactNode => <StatusBadge status={v as string} />,
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (v: unknown): ReactNode =>
        new Date(v as string).toLocaleDateString(),
    },
  ]

  const websiteRevampColumns = [
    { key: 'brand_name', header: 'Brand' },
    { key: 'email', header: 'Email' },
    { key: 'media_buyer_name', header: 'Media Buyer' },
    {
      key: 'home_page',
      header: 'Home Page',
      render: (v: unknown): ReactNode => (v ? 'Yes' : '-'),
    },
    {
      key: 'collection_page',
      header: 'Collection',
      render: (v: unknown): ReactNode => (v ? 'Yes' : '-'),
    },
    {
      key: 'product_pages',
      header: 'Products',
      render: (v: unknown): ReactNode => (v ? 'Yes' : '-'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: unknown): ReactNode => <StatusBadge status={v as string} />,
    },
    {
      key: 'created_at',
      header: 'Submitted',
      render: (v: unknown): ReactNode =>
        new Date(v as string).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white/90">
          Form Submissions
        </h2>
        <p className="mt-1 text-white/60">
          Day Drop and Website Revamp requests from clients
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Forms"
            value={stats.total}
            icon={ClipboardList}
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            variant={stats.pending > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Processing"
            value={stats.processing}
            icon={FileText}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
          />
          <StatCard
            title="Day Drop"
            value={stats.dayDropCount}
            icon={Calendar}
          />
          <StatCard
            title="Website Revamp"
            value={stats.websiteRevampCount}
            icon={Globe}
          />
        </div>
      )}

      {/* Status Summary */}
      {stats && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <SectionHeader
            title="Status Overview"
            description="Form submissions by status"
            icon={ClipboardList}
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-yellow-400/10">
                <Clock className="size-5 text-yellow-400" />
              </span>
              <div>
                <p className="text-sm text-white/60">Pending</p>
                <p className="text-lg font-medium text-yellow-400">
                  {stats.pending}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-blue-400/10">
                <FileText className="size-5 text-blue-400" />
              </span>
              <div>
                <p className="text-sm text-white/60">Processing</p>
                <p className="text-lg font-medium text-blue-400">
                  {stats.processing}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-green-400/10">
                <CheckCircle className="size-5 text-green-400" />
              </span>
              <div>
                <p className="text-sm text-white/60">Completed</p>
                <p className="text-lg font-medium text-green-400">
                  {stats.completed}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-red-400/10">
                <XCircle className="size-5 text-red-400" />
              </span>
              <div>
                <p className="text-sm text-white/60">Cancelled</p>
                <p className="text-lg font-medium text-red-400">
                  {stats.cancelled}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <PaginatedTable
        data={(tableData?.data as Record<string, unknown>[]) || []}
        columns={
          activeSubTab === 'day-drop' ? dayDropColumns : websiteRevampColumns
        }
        pagination={
          tableData?.pagination || {
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        }
        onPageChange={handlePageChange}
        isLoading={isLoading}
        emptyMessage={`No ${activeSubTab === 'day-drop' ? 'Day Drop' : 'Website Revamp'} requests found`}
      />
    </div>
  )
}
