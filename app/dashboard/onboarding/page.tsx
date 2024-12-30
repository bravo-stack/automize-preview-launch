import Link from 'next/link'
import ClosingForm from './closing-form'
import OnboarderForm, { CopyOnboardingLink } from './onboarder-form'
import { createClient } from '@/lib/db/server'
import DeleteItem from '@/components/actions/delete-item'

export default async function OnboardingPage({ searchParams }) {
  const db = createClient()
  const { client, id } = searchParams

  const { data: closed } = await db
    .from('clients')
    .select('id, brand, email, closed_by')
    .eq('onboarded', false)

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex items-center justify-between bg-night-starlit px-5  py-2.5">
          <h2 className="text-lg font-semibold tracking-tighter">
            Closed Clients
          </h2>

          <ClosingForm />
        </div>

        {client && id && (
          <div className="p-5">
            <OnboarderForm client={client} id={id} />
          </div>
        )}

        <ul className="2xl:grid-cols- grid grid-cols-2 gap-5 p-5 shadow">
          {closed && closed.length !== 0 ? (
            closed.map((client, index) => (
              <li
                key={index}
                className="group/p relative rounded border border-zinc-800 bg-night-starlit p-3"
              >
                <div className="flex items-center justify-between gap-0.5">
                  <h3 className="font-semibold">{client.brand}</h3>
                  <p>{client.email}</p>
                </div>

                <DeleteItem table="clients" id={client.id} button />

                <div className="flex items-center justify-between gap-0.5 text-sm text-neutral-400">
                  {client.email ? (
                    <Link
                      href={`/dashboard/onboarding?client=${client.brand}&id=${client.id}`}
                      className="group cursor-pointer rounded-full transition-all duration-500 hover:bg-neutral-700/50 hover:px-2"
                    >
                      <h3>
                        <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500 group-hover:bg-teal-500" />
                        <span className="group-hover:hidden">
                          Pending Onboarding
                        </span>
                        <span
                          className={`hidden underline group-hover:inline-block`}
                        >
                          Click to onboard
                        </span>
                      </h3>
                    </Link>
                  ) : (
                    <CopyOnboardingLink brand={client.brand} id={client.id} />
                  )}
                  <p className=""> Closed by {client.closed_by}</p>
                </div>
              </li>
            ))
          ) : (
            <li>No clients currently awaiting onboarding.</li>
          )}
        </ul>
      </section>
    </main>
  )
}
