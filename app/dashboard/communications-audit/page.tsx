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
import { Fragment, Suspense } from 'react'
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

  const { data: pod } = await db
    .from('pod')
    .select('name, servers')
    .eq('user_id', user.id)
    .single()

  const role = user?.user_metadata?.role ?? 'exec'

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
  let previousDayReports: CommunicationReport[] = []

  // if (latestDate) {
  //   let reportsQuery = db
  //     .from('communication_reports')
  //     .select('*')
  //     .eq('report_date', latestDate)
  //     .order('channel_name')

  //   // Filter reports by pod for non-exec users
  //   // Include reports where: (guild_id IN pod.servers) OR (pod = pod.name)
  //   if ((role !== 'exec' && pod?.servers) || (role !== 'exec' && pod?.name)) {
  //     const guildIdsFilter = (pod?.servers ?? [])
  //       .map((id: string) => `guild_id.eq.${id}`)
  //       .join(',')
  //     const podNameFilter = `pod.eq.${pod.name?.trim()}`
  //     reportsQuery = reportsQuery.or(`${guildIdsFilter},${podNameFilter}`)
  //   }

  //   const { data: reports } = await reportsQuery

  //   initialReports = (reports as CommunicationReport[]) || []

  //   // Fetch previous day's data for high-priority detection
  //   const currentDate = new Date(latestDate)
  //   currentDate.setDate(currentDate.getDate() - 1)
  //   const previousDate = currentDate.toISOString().split('T')[0]

  //   let prevReportsQuery = db
  //     .from('communication_reports')
  //     .select('*')
  //     .eq('report_date', previousDate)
  //     .order('channel_name')

  //   // Filter previous day reports by pod for non-exec users
  //   // Include reports where: (guild_id IN pod.servers) OR (pod = pod.name)
  //   if ((role !== 'exec' && pod?.servers) || (role !== 'exec' && pod?.name)) {
  //     const guildIdsFilter = (pod?.servers ?? [])
  //       .map((id: string) => `guild_id.eq.${id}`)
  //       .join(',')
  //     const podNameFilter = `pod.eq.${pod.name}`
  //     prevReportsQuery = prevReportsQuery.or(
  //       `${guildIdsFilter},${podNameFilter}`,
  //     )
  //   }

  //   const { data: prevReports } = await prevReportsQuery
  //   previousDayReports = (prevReports as CommunicationReport[]) || []
  // }

  if (latestDate) {
    // 1. Helper: Determine which filter strategy to use
    // This avoids using .or() unless we absolutely have two conflicting conditions
    const applyPodFilter = (query: any) => {
      if (role === 'exec') return query

      const hasName = !!pod?.name
      const hasServers = pod?.servers && pod.servers.length > 0

      // CASE 1: Both filters exist -> Use OR
      // We strictly format the string for PostgREST
      if (hasName && hasServers) {
        const safeName = pod.name.trim()
        // Note: We use .map to wrap IDs in quotes for safety
        const serverList = pod.servers.map((id: string) => `"${id}"`).join(',')

        return query.or(`pod.eq."${safeName}",guild_id.in.(${serverList})`)
      }

      // CASE 2: Only Pod Name exists -> Use direct EQ (Fixes your issue)
      // Supabase handles the quoting/escaping automatically here
      else if (hasName) {
        return query.eq('pod', pod.name.trim())
      }

      // CASE 3: Only Servers exist -> Use direct IN
      else if (hasServers) {
        return query.in('guild_id', pod.servers)
      }

      return query
    }

    // 2. Fetch Function
    const fetchReports = async (date: string) => {
      let query = db
        .from('communication_reports')
        .select('*')
        .eq('report_date', date)
        .order('channel_name')

      // Apply the smart filter logic
      query = applyPodFilter(query)

      const { data, error } = await query

      if (error) {
        console.error(`Error fetching reports for ${date}:`, error)
        return []
      }

      return (data as CommunicationReport[]) || []
    }

    // 3. Execution
    const currentDate = new Date(latestDate)
    currentDate.setDate(currentDate.getDate() - 1)
    const previousDate = currentDate.toISOString().split('T')[0]

    const [reports, prevReports] = await Promise.all([
      fetchReports(latestDate),
      fetchReports(previousDate),
    ])

    initialReports = reports
    previousDayReports = prevReports
  }

  const auditData: CommunicationsAuditData = {
    reports: initialReports,
    previousDayReports: previousDayReports,
    availableDates: uniqueDates,
    availablePods: uniquePods,
    latestDate,
  }

  const { data: timeframe } = await db
    .from('timeframe')
    .select(
      'id, didnt_reach_out_hours, client_silent_days, high_priority_days, high_priority_color, updated_at, created_at',
    )
    .single()

  const timeFrameDidntReactOutHours = timeframe?.didnt_reach_out_hours ?? 48
  const timeFrameClientSilentDays = timeframe?.client_silent_days ?? 5
  const timeFrameHighPriorityDays = timeframe?.high_priority_days ?? 2
  const timeFrameHighPriorityColor = timeframe?.high_priority_color ?? '#06b6d4'

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

          {uniqueDates?.length > 0 &&
          uniquePods?.length > 0 &&
          initialReports?.length > 0 ? (
            <Fragment>
              <RevalidateButton />

              <UpdateIxmValue
                didnt_reach_out_hours={timeFrameDidntReactOutHours}
                client_silent_days={timeFrameClientSilentDays}
                high_priority_days={timeFrameHighPriorityDays}
                high_priority_color={timeFrameHighPriorityColor}
                role={role}
              />
            </Fragment>
          ) : null}

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
          {uniqueDates?.length > 0 &&
          uniquePods?.length > 0 &&
          initialReports?.length > 0 ? (
            <AuditSpreadsheet
              ixm_didnt_reach_out_hours={timeFrameDidntReactOutHours}
              client_silent_days={timeFrameClientSilentDays}
              high_priority_days={timeFrameHighPriorityDays}
              high_priority_color={timeFrameHighPriorityColor}
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
