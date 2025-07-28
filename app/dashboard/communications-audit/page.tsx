import CommunicationsAuditTable from '@/components/communications-audit/CommunicationsAuditTable'
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
    <main className="flex flex-col space-y-6 px-6 pb-24 pt-10 md:px-24">
      <header className="space-y-2">
        <h1 className="w-fit bg-gradient-to-b from-white via-zinc-500/90 to-white/60 bg-clip-text text-4xl tracking-wide text-transparent">
          Communications Audit
        </h1>
        <p className="text-lg text-white/70">
          Monitor client communication status across all pods
        </p>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
          </div>
        }
      >
        {uniqueDates.length > 0 ? (
          <CommunicationsAuditTable initialData={auditData} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="max-w-md rounded-lg border border-zinc-800 bg-night-starlit p-8">
              <h3 className="mb-4 text-xl font-semibold text-white">
                No Communication Reports Found
              </h3>
              <p className="mb-4 text-white/70">
                There are no communication audit reports in the database yet.
                Reports will appear here once data is populated in the
                <code className="mx-1 rounded bg-zinc-800 px-2 py-1 text-sm">
                  communication_reports
                </code>
                table.
              </p>
              <p className="text-sm text-white/50">
                Make sure your data ingestion process is running to populate
                communication audit data.
              </p>
            </div>
          </div>
        )}
      </Suspense>
    </main>
  )
}
