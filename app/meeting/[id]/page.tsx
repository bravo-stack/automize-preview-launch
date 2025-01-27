import { ShootingStars } from '@/components/ui/shooting-stars'
import { StarsBackground } from '@/components/ui/stars-background'
import { createClient } from '@/lib/db/server'
import dynamic from 'next/dynamic'
const MeetingCountdown = dynamic(
  () => import('./meeting-countdown').then((mod) => mod.MeetingCountdown),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 w-full animate-pulse rounded-lg bg-zinc-700" />
    ),
  },
)

export default async function MeetingPage({ params }) {
  const { id } = params
  const db = createClient()

  const { data: meeting } = await db
    .from('booking')
    .select('start_time, end_time')
    .eq('id', id)
    .single()

  return (
    <main className="flex h-screen items-center justify-center p-6">
      <div className="z-50 w-full max-w-lg rounded-lg border border-zinc-800 bg-night-starlit p-5 shadow-sm shadow-slate-300/50">
        <h1 className="mb-4 text-center text-2xl font-semibold tracking-tighter text-white">
          InsightXMedia Onboarding
        </h1>

        {meeting ? (
          <div className="text-center">
            <MeetingCountdown
              startTime={meeting.start_time}
              endTime={meeting.end_time}
            />
          </div>
        ) : (
          <div className="text-center">
            The meeting you are looking for does not exist. If this is
            unexpected, please contact the InsightXMedia team for support.
          </div>
        )}
      </div>

      {/* Background elements */}
      <ShootingStars />
      <StarsBackground />
    </main>
  )
}
