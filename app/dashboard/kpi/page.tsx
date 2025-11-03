import { createClient } from '@/lib/db/server'
import { authorizeSheets } from '@/lib/google'
import { google } from 'googleapis'
import { unstable_cache as cache } from 'next/cache'
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

async function getSheetData(sheet_id: string) {
  if (!sheet_id) {
    console.error('Error: The Google Sheet ID is missing')
    return { label: 'Error', value: [] }
  }

  const cachedData = await cache(
    async () => {
      try {
        const sheets = google.sheets({
          version: 'v4',
          auth: await authorizeSheets(),
        })

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheet_id,
          range: 'Sheet1!A:Z',
        })

        const rows = response.data.values

        if (rows && rows.length > 1) {
          const headers = rows[0]
          const lastRow = rows[rows.length - 1]

          // Define fields to exclude
          const excludedFields = [
            'monitored',
            'is rebillable',
            'last rebill date',
            'name',
          ]

          const mappedValues = headers
            .map((header, index) => {
              // Rename 'pod' to 'last refresh date'
              const displayKey =
                header.toLowerCase() === 'pod' ? 'Last refresh date' : header

              return {
                key: displayKey,
                value: lastRow[index] || null,
              }
            })
            .filter(
              (item) =>
                !excludedFields.some((excluded) =>
                  item.key.toLowerCase().includes(excluded.toLowerCase()),
                ),
            )

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
    },
    [`google-sheet-data-${sheet_id}`],

    {
      revalidate: 600,
      tags: ['sheets-kpi', `sheet-${sheet_id}`],
    },
  )()

  return cachedData
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
      const sheetKPI = await getSheetData(sheet?.sheet_id)
      return {
        ...sheet,
        kpi: sheetKPI,
      }
    }),
  )

  console.log('sheets with kpi: ', sheetsWithKpi)

  return (
    <main className="space-y-7 p-7">
      <header className="mb-8 space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="w-fit bg-gradient-to-r from-white via-zinc-300 to-white/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
            KPIs
          </h1>
          <p className="text-base text-zinc-400 sm:text-lg">
            Financial overview pulled directly from FinanceX sheets.
          </p>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </header>

      <section className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sheetsWithKpi
            .sort((a, b) => {
              const timeOrder = {
                yesterday: 1,
                today: 2,
                last_3d: 3,
                last_7d: 4,
                last_14d: 5,
                last_30d: 6,
                this_month: 7,
                maximum: 8,
              }

              return (
                timeOrder[a.refresh.toLowerCase()] -
                timeOrder[b.refresh.toLowerCase()]
              )
            })
            .map((item) => (
              <KPICard
                key={item.id}
                sheetId={item.sheet_id ?? ''}
                title={item.title}
                kpi={item.kpi.value}
                sheetRefresh={item.refresh}
                sheetTitle={item.title}
              />
            ))}
        </div>
      </section>
    </main>
  )
}
