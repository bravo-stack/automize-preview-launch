import AddJob from '@/components/jobs/add-job'
import DeleteJob from '@/components/jobs/delete-job'
import UpdateJob from '@/components/jobs/update-job'
import RefreshButton from '@/components/refresh-button'
import { createClient } from '@/lib/db/server'

export default async function JobForm() {
  const res = await fetch('https://api.cron-job.org/jobs', {
    headers: {
      Authorization: `Bearer n4mS6HyELzWXFtyR5qIAqCUuaL4PHvVaA/HUQ44Jz90=`,
      'Content-Type': 'application/json',
    },
  })

  const db = createClient()
  const { data: messages } = await db.from('job').select('*')

  const data = await res.json()
  const jobs = data.jobs.filter((job) => job.title !== 'IXM bot uptime')

  const mergedJobs = jobs
    .map((job) => {
      const messageData = messages?.find((msg) => msg.jobId === job.jobId)

      if (messageData) {
        return {
          ...job,
          channel_name: messageData.channel_name,
          message: messageData.message,
        }
      }
      return job
    })
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex items-center justify-between bg-night-starlit px-5  py-2.5">
          <h2 className="text-lg font-semibold tracking-tighter">
            Scheduled Messages
          </h2>

          <div className="flex items-center gap-2.5">
            <RefreshButton path={'/dashboard/ixm-bot'} />

            <AddJob />
          </div>
        </div>
        <div className="p-5 shadow">
          {jobs.length === 0 ? (
            <p>No automations found. Add your first scheduled message.</p>
          ) : (
            <ul className="space-y-2.5">
              {mergedJobs.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-night-starlit p-3"
                >
                  <div className="space-y-1.5">
                    <h3 className="inline-flex items-center font-semibold">
                      <span className="mr-2">{job.title}</span>
                      <span className="inline-flex items-center text-sm text-neutral-400">
                        <span
                          className={`mr-1.5 block h-2 w-2  rounded-full ${job.enabled ? 'animate-pulse bg-green-300' : 'bg-yellow-500'}`}
                        />
                        {job.enabled ? (
                          <>Active &bull; Scheduled </>
                        ) : (
                          'Inactive'
                        )}
                        {job.enabled &&
                          new Date(job.nextExecution * 1000).toLocaleString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            },
                          )}
                      </span>
                    </h3>

                    <div className="flex flex-col justify-start">
                      <p className="max-w-prose text-sm text-neutral-400">
                        To channel <strong>{job.channel_name}</strong>:
                      </p>
                      <p className="max-w-prose text-sm text-neutral-400">
                        {job.message}
                      </p>
                    </div>
                  </div>

                  <div className="space-x-1.5 text-sm">
                    <UpdateJob job={job} />
                    <DeleteJob jobId={job.jobId} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
