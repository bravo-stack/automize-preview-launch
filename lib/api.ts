import { authorizeSheets } from './google'
import { google } from 'googleapis'

export async function appendDataToSheet(sheetId: string, data: any) {
  const auth = await authorizeSheets()
  const sheets = google.sheets({ version: 'v4', auth })

  const requestBody = {
    values: data,
  }

  sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'Sheet1!A2',
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
