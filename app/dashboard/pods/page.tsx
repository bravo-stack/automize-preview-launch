import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreatePodSheet from './CreatePodSheet'

export default async function Pods() {
  const db = createClient()

  const id = '38817360-608e-438f-93b2-a208c35a8da7'
  const { data: sheets } = await db
    .from('sheets')
    .select('*')
    .eq('user_id', id)
    .neq('pod', '')

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <main className="flex flex-col justify-center space-y-10 px-6 pb-24 pt-10 md:px-24">
      <header className="">
        <h1 className="w-fit bg-gradient-to-b from-white via-zinc-500/90 to-white/60 bg-clip-text text-4xl tracking-wide text-transparent">
          Organize, Create & Handle
        </h1>
        <h2 className="text-4xl text-white/70">Pod Spreadsheets</h2>
      </header>

      <section>
        <div className="mb-10 flex gap-3">
          <search className="flex w-full items-center gap-2 rounded-md border border-zinc-800 bg-night-starlit px-2 outline-none transition-colors hover:border-zinc-700 focus:ring focus:ring-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
                clipRule="evenodd"
                className="block"
              />
            </svg>

            <input
              className="bg-transparent outline-none"
              placeholder="Search by name"
            />
          </search>

          <CreatePodSheet user={user} />

          <Link
            href="/dashboard/pods/manage-accounts"
            className="rounded-md border border-white px-3 py-1.5 font-medium"
          >
            Manage&nbsp;Accounts
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {sheets?.map((sheet, index) => {
            const href = `/dashboard/pods/${sheet.sheet_id}`

            return (
              <li
                key={index}
                className="group rounded-lg border border-zinc-800 bg-night-starlit transition-colors hover:border-zinc-700"
              >
                <Link href={href} className="block h-full w-full p-3">
                  <h4>{sheet.title}</h4>
                  <h5 className="mb-3 overflow-clip text-ellipsis text-sm text-zinc-400 hover:underline">
                    <span>
                      docs.google.com/spreadsheets/d/{sheet.sheet_id}/edit
                    </span>
                  </h5>

                  <p className="mt-3 text-sm">
                    Data refreshes {sheet.refresh.toLocaleLowerCase()}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
