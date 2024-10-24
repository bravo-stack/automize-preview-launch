import { authorizeSheets } from './google'
import { google } from 'googleapis'

export async function appendFinancials(id: string, data: any) {
  const auth = await authorizeSheets()
  const sheets = google.sheets({ version: 'v4', auth })

  const requestBody = {
    values: data,
  }

  sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: 'Sheet1!A2',
    valueInputOption: 'RAW',
    requestBody,
  })
}

export async function appendDataToSheet(
  sheetId: string,
  data: any,
  name?: string,
) {
  const auth = await authorizeSheets()
  const sheets = google.sheets({ version: 'v4', auth })

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  })

  const sheetExists = spreadsheet.data.sheets?.some(
    (sheet) => sheet.properties?.title === name,
  )

  // Step 2: If the sheet doesn't exist, create it
  if (!sheetExists && name) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: name,
              },
            },
          },
        ],
      },
    })

    // Step 3: If the sheet name is "ROAS" and it's newly created, add the header row
    if (name === 'ROAS') {
      const headerRow = [
        [
          'Name',
          'Spend 1',
          'ROAS 1',
          'Spend 3',
          'ROAS 3',
          'Spend 7',
          'ROAS 7',
          'Spend 14',
          'ROAS 14',
          'Spend 30',
          'ROAS 30',
        ],
      ]

      // Insert the header row at the first row (A1)
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${name}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: headerRow,
        },
      })
    }
  }

  // Step 3: Append the data to the correct sheet
  const requestBody = {
    values: data,
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: name ? `${name}!A2` : 'Sheet1!A2',
    valueInputOption: 'RAW',
    requestBody,
  })
}

export async function createSpreadsheet(
  sheets: any,
  title: string,
): Promise<string> {
  const {
    data: { spreadsheetId },
  } = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title,
      },
    },
    fields: 'spreadsheetId',
  })

  return spreadsheetId ?? ''
}

export async function getPermissionId(
  drive: any,
  fileId: string,
  newOwnerEmail: string,
): Promise<string> {
  const res1 = await drive.permissions.list({
    fileId,
    supportsAllDrives: true,
    pageSize: 100,
    fields: '*',
  })
  const permission = res1.data.permissions?.find(
    ({ emailAddress }: { emailAddress: string }) =>
      emailAddress == newOwnerEmail,
  )
  let permissionId = ''
  if (permission) {
    permissionId = permission.id as string
  } else {
    const {
      data: { id },
    } = await drive.permissions.create({
      fileId: fileId,
      sendNotificationEmail: true,
      supportsAllDrives: true,
      requestBody: {
        role: 'writer',
        type: 'user',
        pendingOwner: true,
        emailAddress: newOwnerEmail,
      },
    })
    permissionId = id as string
  }
  return permissionId
}

export async function updatePermission(
  drive: any,
  fileId: string,
  permissionId: string,
): Promise<any> {
  const res2 = await drive.permissions.update({
    fileId,
    permissionId,
    supportsAllDrives: true,
    requestBody: {
      role: 'writer',
      pendingOwner: true,
    },
  })
  return res2.data
}
