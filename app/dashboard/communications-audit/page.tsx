import CommunicationsAuditWrapper from '@/components/communications-audit/CommunicationsAuditWrapper'
import { createAdminClient } from '@/lib/db/admin'
import { createClient } from '@/lib/db/server'
import type {
  CommunicationReport,
  CommunicationsAuditData,
  Pod,
} from '@/types/communications-audit'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function CommunicationsAudit() {
  // Check authentication with regular client
  const authDb = createClient()

  const {
    data: { user },
  } = await authDb.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use admin client for data queries
  const db = await createAdminClient()

  // Get all available report dates
  const { data: reportDates } = await db
    .from('communication_reports')
    .select('report_date')
    .order('report_date', { ascending: false })

  const uniqueDates = Array.from(
    new Set(reportDates?.map((r) => r.report_date).filter(Boolean) || []),
  )

  // Get all available pods/guilds
  const { data: pods } = await db
    .from('communication_reports')
    .select('guild_name, guild_id')
    .not('guild_name', 'is', null)
    .not('guild_id', 'is', null)
    .order('guild_name')

  const uniquePods: Pod[] = Array.from(
    new Map(pods?.map((p) => [p.guild_id, p]) || []).values(),
  )

  // Get the latest date
  const latestDate = uniqueDates.length > 0 ? uniqueDates[0] : null

  // If we have a latest date, fetch the initial data for that date
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
          {uniqueDates.length > 0 ? (
            <CommunicationsAuditWrapper initialData={auditData} />
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
