import { createClient } from '@/lib/db/server'
import { authorizeSheets } from '@/lib/google'
import { google } from 'googleapis'
import { KPICard } from './kpi-card'

type SheetsData = {
  id: number
  user_id: string
  sheet_id: string
  refresh: string
  title: string
  last_refresh: string
  pod: string
  is_finance: boolean
}

async function getTotalData(sheet_id: string) {
  if (!sheet_id) {
    console.error('Error: The Google Sheet ID is missing')
    return { label: 'Error', value: [] }
  }

  try {
    const scopes = ['https://www.googleapis.com/auth/drive']
    const jwt = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      undefined,
      (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      scopes,
    )

    const sheets = google.sheets({
      version: 'v4',
      auth: await authorizeSheets(),
    })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheet_id,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values

    if (rows && rows.length > 1) {
      const headers = rows[0]
      const lastRow = rows[rows.length - 1]

      const mappedValues = headers.map((header, index) => {
        return {
          key: header,
          value: lastRow[index] || null,
        }
      })

      return {
        label: lastRow[0] || 'Total',
        value: mappedValues,
      }
    }

    console.warn('Google Sheet has no data or only a header row.')
    return { label: 'Error', value: [] }
  } catch (err) {
    console.error('Error fetching from Google Sheets:', err)
    return { label: 'Error', value: [] }
  }
}

export default async function KPIPage() {
  const db = await createClient()
  const {
    data: sheets,
  }: {
    data: SheetsData[] | null
  } = await db.from('sheets').select('*').eq('is_finance', true)

  const sheetsWithKpi = await Promise.all(
    (sheets ?? []).map(async (sheet) => {
      const sheetKPI = await getTotalData(sheet?.sheet_id)
      return {
        ...sheet,
        kpi: sheetKPI,
      }
    }),
  )

  return (
    <main className="space-y-7 p-7">
      <header className="mb-8 space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="w-fit bg-gradient-to-r from-white via-zinc-300 to-white/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            KPIs
          </h1>
          <p className="text-base text-zinc-400 sm:text-lg">
            Key Performance Indicators pulled directly from the Financials
          </p>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </header>

      <section className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {sheetsWithKpi.map((item) => (
            <KPICard
              key={item.id}
              title={item.title}
              kpi={item.kpi}
              lastRefresh={item.last_refresh}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
