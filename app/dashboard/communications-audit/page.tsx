import AuditSpreadsheet from '@/components/communications-audit/audit-spreadsheet'
import RevalidateButton from '@/components/revalidate-button'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import type {
  CommunicationReport,
  CommunicationsAuditData,
  Pod,
} from '@/types/communications-audit'
import { unstable_noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import UpdateIxmValue from './update-ixm-value'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'

export default async function CommunicationsAudit() {
  const authDb = createClient()
  const db = await createAdminClient()

  unstable_noStore()

  const {
    data: { user },
  } = await authDb.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: dates } = await db
    .from('report_dates')
    .select('*')
    .order('report_date', { ascending: false })

  const latestDate = dates && dates.length > 0 ? dates[0].report_date : null

  const uniqueDates = Array.from(
    new Set(dates?.map((d) => d.report_date).filter(Boolean)),
  )

  const uniquePods: Pod[] =
    dates
      ?.map((d) => {
        return { guild_name: d.guild_name, guild_id: d.guild_id }
      })
      .filter(Boolean)
      .sort() || []

  let initialReports: CommunicationReport[] = []
  if (latestDate) {
    const { data: reports } = await db
      .from('communication_reports')
      .select('*')
      .eq('report_date', latestDate)
      .order('channel_name')

    initialReports = (reports as CommunicationReport[]) || []
  }

  const auditData: CommunicationsAuditData = {
    reports: initialReports,
    availableDates: uniqueDates,
    availablePods: uniquePods,
    latestDate,
  }

  const { data: timeframe } = await db
    .from('timeframe')
    .select(
      'id, didnt_reach_out_hours, client_silent_days, updated_at, created_at',
    )
    .single()

  const timeFrameDidntReactOutHours = timeframe?.didnt_reach_out_hours ?? 48
  const timeFrameClientSilentDays = timeframe?.client_silent_days ?? 5

  return (
    <main className="min-h-screen bg-gradient-to-br from-night-midnight via-night-starlit to-night-dusk">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-4">
          <div className="flex flex-col space-y-2">
            <h1 className="w-fit bg-gradient-to-r from-white via-zinc-300 to-white/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
              Communications Audit
            </h1>
            <p className="text-base text-zinc-400 sm:text-lg">
              Monitor client communication status across all pods
            </p>
          </div>

          <RevalidateButton />

          <UpdateIxmValue
            didnt_reach_out_hours={timeFrameDidntReactOutHours}
            client_silent_days={timeFrameClientSilentDays}
          />

          <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
        </header>

        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-600 border-t-white"></div>
                <p className="text-sm text-zinc-400">Loading audit data...</p>
              </div>
            </div>
          }
        >
          {uniqueDates && uniqueDates.length > 0 ? (
            <AuditSpreadsheet
              ixm_didnt_reach_out_hours={timeFrameDidntReactOutHours}
              client_silent_days={timeFrameClientSilentDays}
              initialData={auditData}
            />
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="max-w-lg rounded-xl border border-zinc-800/50 bg-gradient-to-br from-night-starlit to-night-moonlit p-8 text-center shadow-2xl">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-zinc-800/50 p-3">
                    <svg
                      className="h-8 w-8 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="mb-4 text-xl font-semibold text-white">
                  No Communication Reports Found
                </h3>
                <p className="mb-4 text-zinc-300">
                  There are no communication audit reports in the database yet.
                  Reports will appear here once data is populated in the{' '}
                  <code className="mx-1 rounded bg-zinc-800/50 px-2 py-1 font-mono text-sm text-zinc-200">
                    communication_reports
                  </code>{' '}
                  table.
                </p>
                <p className="text-sm text-zinc-400">
                  Make sure your data ingestion process is running to populate
                  communication audit data.
                </p>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </main>
  )
}
