import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { authorizeSheets } from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log(data)
    const sheets = google.sheets({
      version: 'v4',
      auth: await authorizeSheets(),
    })

    const spreadsheetId = '19SvDtxM9IDJKxiTCcI91ZMYYz3xc53wMRQhwVQD6qCY'

    const nonEmptyData = data.filter((row: any[]) =>
      row.some((cell) => cell !== ''),
    )
    const numRows = nonEmptyData.length
    const numCols = nonEmptyData[0].length
    const range = `Sheet1!A1:${String.fromCharCode(64 + numCols)}${numRows}`

    const resource = {
      values: nonEmptyData,
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: resource,
    })

    return NextResponse.json({ message: 'Data pushed successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
