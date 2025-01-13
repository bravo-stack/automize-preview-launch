import { createClient } from '@/lib/db/server'
import Link from 'next/link'
import UpdateItem from '@/components/actions/update-item'
import CreateAccount from './create-user'
import DeleteUser from './delete-user'
import Section from '@/components/common/section'
import UpdateClientPod from './update-pod'

export default async function ManagePodsPage({ searchParams }) {
  const db = createClient()
  const { pod } = searchParams

  let clients
  if (pod) {
    const { data } = await db
      .from('accounts')
      .select('name')
      .eq('pod', pod)
      .order('name')
    clients = data
  }

  const { data: pods } = await db
    .from('pod')
    .select('id, name, discord_id, user_id')
    .order('name')

  const { data: podAccounts } = await db
    .from('pod')
    .select('name, clients (id, brand)')

  const sortedByClientCount = podAccounts?.sort(
    (a, b) => b.clients.length - a.clients.length,
  )

  const accounts = pods?.filter((pod) => pod.user_id !== null)

  return (
    <main className="space-y-7 p-7">
      <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
        <div className="flex items-center justify-between bg-night-starlit px-5  py-2.5">
          <h2 className="text-lg font-semibold tracking-tighter">
            Full Pod List
          </h2>

          <CreateAccount />
        </div>

        <div className="p-5 shadow">
          {pods?.length === 0 ? (
            <p>No existing pods. Please add your first pod.</p>
          ) : (
            <ul className="grid grid-cols-4 gap-2.5">
              {pods?.map((p, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-0.5 rounded border border-zinc-800 bg-night-starlit p-3"
                >
                  <Link href={'?pod=' + p.name}>
                    <hgroup>
                      <h3 className="inline-flex items-center font-semibold">
                        {p.name}
                      </h3>
                    </hgroup>
                  </Link>

                  <div className="flex flex-col">
                    <DeleteUser user_id={p.user_id} />
                    <UpdateItem
                      id={p.id}
                      data={{ name: p.name, discord_id: p.discord_id }}
                      inputs={[
                        {
                          name: 'name',
                          label: 'Pod Name',
                          type: 'text',
                          placeholder: 'Enter Pod Name',
                        },
                        {
                          name: 'discord_id',
                          label: 'Discord ID',
                          type: 'text',
                          placeholder: 'Enter Discord ID',
                        },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {pod ? (
        <section className="mx-auto max-w-7xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800">
          <div className="flex items-center justify-between bg-night-starlit px-5  py-2.5">
            <h2 className="text-lg font-semibold tracking-tighter">
              Accounts for {pod}
            </h2>

            <div className="space-x-2.5">
              <Link
                href={'/dashboard/manage-pods'}
                className="rounded bg-white px-3 py-2 font-medium text-black"
              >
                Close &times;
              </Link>

              <Link
                href={'/dashboard/autometric/manage-accounts'}
                className="rounded bg-white px-3 py-2 font-medium text-black"
              >
                Manage Accounts
              </Link>
            </div>
          </div>

          <div className="p-5 shadow">
            {clients?.length === 0 ? (
              <p>No existing accounts. Please add your first accounts.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2.5">
                {clients?.map((p, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-0.5 rounded border border-zinc-800 bg-night-starlit p-3"
                  >
                    <hgroup>
                      <h3 className="inline-flex items-center font-semibold">
                        {p.name}
                      </h3>
                    </hgroup>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <Section title="Pod-Account List">
          <div className="flex divide-x divide-zinc-800 overflow-x-scroll p-5">
            {sortedByClientCount?.map(({ name, clients }, index) => (
              <div key={index} className="">
                <h3 className="border-y border-zinc-800 bg-night-starlit p-2.5 text-center text-lg font-semibold">
                  {name}
                </h3>
                <ul className="divide-y divide-zinc-800 border-b border-zinc-800">
                  <li className="p-0.5 text-center text-sm font-medium">
                    {clients.length}
                  </li>
                  {clients.map((client) => (
                    <li key={client.id}>
                      <UpdateClientPod
                        client={{ ...client, pod: name }}
                        pods={pods}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}
    </main>
  )
}
