import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateSheet from '@/components/CreateSheet'
import Section from '@/components/common/section'
import Table from '@/components/common/table'

export default async function Autometric() {
  const db = createClient()

  const id = '38817360-608e-438f-93b2-a208c35a8da7'
  const { data: sheets } = await db
    .from('sheets')
    .select('*')
    .eq('user_id', id)
    .eq('pod', '')
  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: onboarded } = await db
    .from('clients')
    .select(
      'id, brand, closed_by, closed_at, fb_key, shopify_key, store_id, discord_id, email, phone_number, closed_at, rebill_date, rebill_amt, website, instagram, drive',
    )
    .eq('onboarded', true)
    .or(
      'fb_key.is.null,shopify_key.is.null,email.is.null,phone_number.is.null,discord_id.is.null,rebill_amt.is.null,rebill_date.is.null,website.is.null,instagram.is.null,drive.is.null',
    )

  const onboardedData = onboarded?.map(({ id, discord_id, ...rest }) => ({
    details: (
      <Link
        href={`/dashboard/notes/${id}/edit`}
        className="block w-fit rounded-md border border-zinc-800 bg-night-dusk px-1.5 py-0.5 text-neutral-400 transition-colors hover:border-zinc-700"
      >
        Edit Details
      </Link>
    ),
    ...rest,
    discord_access: discord_id === null ? 'No' : 'Yes',
    shopify_key: rest.shopify_key === null ? 'N/A' : 'Exists',
  }))

  return (
    <main className="space-y-10 p-7">
      <Section title="All Automize Sheets">
        <div className="p-5">
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

            <CreateSheet user={user} />

            <Link
              href="/dashboard/autometric/manage-accounts"
              className="rounded-md border border-white px-3 py-1.5 font-medium"
            >
              Manage&nbsp;Accounts
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sheets?.map((sheet, index) => {
              const href = `/dashboard/autometric/${sheet.sheet_id}`

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
        </div>
      </Section>

      <Section title="Clients Pending Access">
        <div className="space-y-5 p-5">
          <p className="mx-auto max-w-prose text-center font-medium">
            {onboardedData?.length} clients listed below have gone through the
            full onboarding process, and are missing at least one of the
            following: Facebook key, Shopify key, Store ID, Email, Phone Number,
            Rebill Amount, Rebill Date, Closed Date, Website, Instagram, or
            Drive.
          </p>
          <Table data={onboardedData} priority />
        </div>
      </Section>
    </main>
  )
}
