import Section from '@/components/common/section'
import { createClient } from '@/lib/db/server'
import ClientCard from './client-card'
import NotesCard from './notes-card'
import { textFromSQL } from '@/lib/utils'
import { getRole } from '@/lib/actions'

export default async function ClientPortfolioPage({ params }) {
  const db = createClient()
  const { id } = params

  const { data: c } = await db.from('clients').select('*').eq('id', id).single()

  const role = await getRole()

  let details, access, links, rebill, metrics, other

  if (role === 'exec') {
    details = [
      'full_name',
      'email',
      'phone_number',
      'address',
      'discord_id',
      'starting_mrr',
    ]

    access = [
      'onboarded',
      'fb_access',
      'shopify_access',
      'fb_key',
      'shopify_key',
      'store_id',
    ]

    links = ['website', 'instagram', 'whimsicals', 'drive']
    rebill = ['rebill_amt', 'rebill_date']
    metrics = ['margins', 'cogs', 'break_even_roas', 'bc_review', 'passed_bcr']
    other = ['drop_day', 'client_reports', 'closed_by', 'outside_issues']
  } else {
    access = [
      'onboarded',
      'fb_access',
      'shopify_access',
      'fb_key',
      'shopify_key',
      'store_id',
    ]

    links = ['website', 'instagram', 'whimsicals', 'drive']
    metrics = [
      'margins',
      'cogs',
      'break_even_roas',
      'bc_review',
      'passed_bcr',
      'starting_mrr',
    ]
    other = ['drop_day', 'client_reports', 'closed_by', 'outside_issues']
  }

  const notes = [
    'mb_notes',
    'intro_notes',
    'education_info',
    'organic_notes',
    'backend_notes',
  ]

  const notesData = notes.map((noteKey) => ({
    heading: textFromSQL(noteKey),
    content: c[noteKey] ?? 'N/A',
  }))
  return (
    <main className="space-y-7 p-7">
      <header>
        <h1 className="text-2xl font-bold tracking-tighter">{c.brand}</h1>
        <p>Client Portfolio&nbsp;&nbsp;&bull;&nbsp;&nbsp;{c.status}</p>
      </header>

      <Section title="Overview">
        <div className="grid grid-cols-2 gap-5 p-5">
          {details && (
            <ClientCard
              title="Client Details"
              properties={details}
              client={c}
            />
          )}
          <ClientCard title="Access Info" properties={access} client={c} />
          <ClientCard title="Relevant Links" properties={links} client={c} />
          {rebill && (
            <ClientCard title="Rebill Info" properties={rebill} client={c} />
          )}
          <ClientCard title="Metrics" properties={metrics} client={c} />
          <ClientCard title="Other Info" properties={other} client={c} />

          <NotesCard notes={notesData} client={c} />
        </div>
      </Section>
    </main>
  )
}
