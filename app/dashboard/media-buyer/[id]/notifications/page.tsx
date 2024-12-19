import Section from '@/components/common/section'
import { createClient } from '@/lib/db/server'

export default async function NotificationPage({ params }) {
  const { id: pod } = params
  const db = createClient()

  const { data } = await db
    .from('clients')
    .select('brand, drop_day')
    .eq('pod', pod)

  if (!data) {
    return (
      <main className="space-y-7 p-7">
        <Section title="Upcoming Drop Days">
          <div>No data available</div>
        </Section>
      </main>
    )
  }

  const categorizeDates = (dates) => {
    const now = new Date()
    const next3Days = []
    const next2Weeks = []
    const next30Days = []

    dates.forEach(({ drop_day }) => {
      const dropDate = new Date(drop_day) // Parse the drop_day
      const diffInDays = Math.ceil((dropDate - now) / (1000 * 60 * 60 * 24)) // Calculate difference in days

      if (diffInDays <= 3 && diffInDays > 0) {
        next3Days.push(drop_day)
      } else if (diffInDays <= 14 && diffInDays > 3) {
        next2Weeks.push(drop_day)
      } else if (diffInDays <= 30 && diffInDays > 14) {
        next30Days.push(drop_day)
      }
    })

    return { next3Days, next2Weeks, next30Days }
  }

  // Categorize data
  const { next3Days, next2Weeks, next30Days } = categorizeDates(data)

  return (
    <main className="space-y-7 p-7">
      <Section title="Upcoming Drop Days">
        <div className="space-y-5 p-5">
          <div>
            <h2>Next 3 Days</h2>
            {next3Days.length > 0 ? (
              <ul>
                {next3Days.map((date, index) => (
                  <li key={index}>{new Date(date).toDateString()}</li>
                ))}
              </ul>
            ) : (
              <p>No drops in the next 3 days.</p>
            )}
          </div>

          <div>
            <h2>Next 2 Weeks</h2>
            {next2Weeks.length > 0 ? (
              <ul>
                {next2Weeks.map((date, index) => (
                  <li key={index}>{new Date(date).toDateString()}</li>
                ))}
              </ul>
            ) : (
              <p>No drops in the next 2 weeks.</p>
            )}
          </div>

          <div>
            <h2>Next 30 Days</h2>
            {next30Days.length > 0 ? (
              <ul>
                {next30Days.map((date, index) => (
                  <li key={index}>{new Date(date).toDateString()}</li>
                ))}
              </ul>
            ) : (
              <p>No drops in the next 30 days.</p>
            )}
          </div>
        </div>
      </Section>
    </main>
  )
}
