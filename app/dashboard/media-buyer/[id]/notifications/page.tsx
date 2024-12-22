import Section from '@/components/common/section'
import { createAdminClient } from '@/lib/db/admin'

interface DropDay {
  brand: string
  drop_day: string
}

interface NotificationPageProps {
  params: { id: string }
}

export default async function NotificationPage({
  params,
}: NotificationPageProps) {
  const { id } = params
  const db = createAdminClient()

  const { data, error } = await db
    .from('drop_days')
    .select('brand, drop_day')
    .eq('user_id', id)

  if (error || !data) {
    return (
      <main className="space-y-7 p-7">
        <Section title="Upcoming Drop Days">
          <div>No data available</div>
        </Section>
      </main>
    )
  }

  const categorizeDates = (dates: DropDay[]) => {
    const now = new Date()
    const next3Days: DropDay[] = []
    const next2Weeks: DropDay[] = []
    const next30Days: DropDay[] = []

    dates.forEach(({ brand, drop_day }) => {
      const dropDate = new Date(drop_day)
      const diffInDays = Math.ceil(
        (dropDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (diffInDays <= 3 && diffInDays > 0) {
        next3Days.push({ brand, drop_day })
      } else if (diffInDays <= 14 && diffInDays > 3) {
        next2Weeks.push({ brand, drop_day })
      } else if (diffInDays <= 30 && diffInDays > 14) {
        next30Days.push({ brand, drop_day })
      }
    })

    return { next3Days, next2Weeks, next30Days }
  }

  const { next3Days, next2Weeks, next30Days } = categorizeDates(data)

  return (
    <main className="space-y-7 p-7">
      <Section title="Upcoming Drop Days">
        <div className="grid grid-cols-3 gap-5 divide-x divide-zinc-800">
          <DropDaySection title="Next 3 Days" dropDays={next3Days} />
          <DropDaySection title="Next 2 Weeks" dropDays={next2Weeks} />
          <DropDaySection title="Next 30 Days" dropDays={next30Days} />
        </div>
      </Section>
    </main>
  )
}

interface DropDaySectionProps {
  title: string
  dropDays: DropDay[]
}

function DropDaySection({ title, dropDays }: DropDaySectionProps) {
  return (
    <div className="p-5">
      <h2 className="mb-1.5 font-semibold tracking-tighter">{title}</h2>
      {dropDays.length > 0 ? (
        <ul className="">
          {dropDays.map(({ brand, drop_day }, index) => (
            <DropDayNotification key={index} brand={brand} date={drop_day} />
          ))}
        </ul>
      ) : (
        <p>No drops in this time period.</p>
      )}
    </div>
  )
}

interface DropDayNotificationProps {
  brand: string
  date: string
}

function DropDayNotification({ brand, date }: DropDayNotificationProps) {
  return (
    <li className="rounded-md border border-zinc-800 bg-night-starlit p-3">
      <h3 className="font-medium">{brand}</h3>
      Drop Day: {new Date(date + 'T00:00:00').toDateString()}
    </li>
  )
}
