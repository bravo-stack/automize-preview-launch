import DashboardNav from '@/components/nav/dashboard-nav'
import type { NavSection } from '@/content/nav'
import { exec, icons, onboarder } from '@/content/nav'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user || !user.email) {
    redirect('/login')
  }

  const role = user.user_metadata.role ?? 'exec'

  let podData: { id: number; name: string | null } | null = null
  let sheetId
  let sheet

  if (role === 'pod') {
    // Fetch pod data using user_id
    const { data: fetchedPod } = await db
      .from('pod')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    podData = fetchedPod

    // Fetch sheet using pod name
    if (podData?.name) {
      const { data } = await db
        .from('sheets')
        .select('sheet_id, refresh')
        .eq('pod', podData.name)
        .single()

      sheetId = data?.sheet_id
      sheet = data
    }
  }

  let links: NavSection[]
  switch (role) {
    case 'exec':
      links = exec
      break
    case 'pod':
      links = [
        {
          label: 'Overview',
          items: [
            { text: 'Home', url: '', svg: icons.home },
            {
              text: 'Facebook Sheets',
              url: 'autometric',
              svg: icons.facebookSheets,
            },
            { text: 'FinancialX', url: 'financialx', svg: icons.financialX },
          ],
        },
        {
          label: 'Communication',
          items: [
            {
              text: 'Communications Audit',
              url: 'communications-audit',
              svg: icons.communicationsAudit,
            },
          ],
        },
        {
          label: 'Pod Tools',
          items: [
            {
              text: 'Pod',
              url: `media-buyer/${user.id}/accounts`,
              svg: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              ),
            },
            {
              text: 'Backend',
              url: `media-buyer/${user.id}/backend`,
              svg: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
                  />
                </svg>
              ),
            },
            {
              text: 'Notifications',
              url: `media-buyer/${user.id}/notifications`,
              svg: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
              ),
            },
            {
              text: 'WhatsApp',
              url: `media-buyer/${podData?.id}/whatsapp`,
              svg: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              ),
            },
            {
              text: 'Pod Hub',
              url: 'media-buyer/clients',
              svg: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                  />
                </svg>
              ),
            },
          ],
        },
        ...(sheetId
          ? [
              {
                label: 'External',
                items: [
                  {
                    text: `${podData?.name ? podData.name.charAt(0).toUpperCase() + podData.name.slice(1) : ''} Sheet`,
                    url: `https://docs.google.com/spreadsheets/d/${sheetId}`,
                    target: '_blank',
                    svg: icons.podSheets,
                  },
                ],
              },
            ]
          : []),
      ]
      break
    case 'onboarding':
      links = onboarder
      break
    default:
      links = exec
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="hidden h-full lg:flex">
        <DashboardNav links={links} />

        <div
          id="main-focus"
          style={{ width: 'calc(100% - 250px)' }}
          className="flex flex-col transition-transform duration-300"
        >
          <div className="flex h-[60px] items-center justify-start gap-2.5 border-b border-zinc-800 px-6">
            {/* {role === 'pod' && <RefreshPodButtons data={sheet} pod={pod} />} */}
          </div>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}
