'use server'

import { google } from 'googleapis'
import { createClient } from './db/server'
import { authorizeDrive, authorizeSheets } from './google'
import { createSpreadsheet, getPermissionId, updatePermission } from './api'
import { getTemplateById } from '@/content/templates'

export async function createUser(
  email: string,
  password: string,
  company: string,
) {
  const db = createClient()

  const { data, error } = await db.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        company: company,
      },
    },
  })

  if (data.user && !error) {
    // await db.from('user_detail').insert({ id: data.user.id, company: company })
  } else {
    return {
      error: true,
    }
  }

  return { error: false }
}

export async function signInUser(email: string, password: string) {
  const db = createClient()

  const { error } = await db.auth.signInWithPassword({
    email,
    password,
  })

  return error ? true : false
}

export async function signOutUser() {
  const db = createClient()

  const { error } = await db.auth.signOut()

  return error ? true : false
}

export async function createSheet(
  title: string,
  email: string,
  sheetData: any,
) {
  const sheets = google.sheets({ version: 'v4', auth: await authorizeSheets() })
  const drive = google.drive({ version: 'v3', auth: await authorizeDrive() })
  const db = createClient()

  const sheet_id = await createSpreadsheet(sheets, title)
  const permissionId = await getPermissionId(drive, sheet_id, email)
  const res2Data = await updatePermission(drive, sheet_id, permissionId)

  const { user_id, frequency, templateId } = sheetData
  const { data, error } = await db
    .from('sheets')
    .insert({ title, user_id, refresh: frequency, sheet_id })
    .select()

  if (templateId) {
    const template = getTemplateById(templateId)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheet_id,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: template,
      },
    })
  }

  return true

  // const test = await drive.files.list({
  //   q: "mimeType='application/vnd.google-apps.spreadsheet'",
  // })
  // const res1 = await drive.permissions.list({
  //   fileId: '19SvDtxM9IDJKxiTCcI91ZMYYz3xc53wMRQhwVQD6qCY',
  //   supportsAllDrives: true,
  //   pageSize: 100,
  //   fields: '*',
  // })
  // console.log(test.data)
}

export async function deleteSheet(sheetId: string) {
  const db = createClient()
  const response = await db.from('sheets').delete().eq('sheet_id', sheetId)

  if (!response.error) {
    return true
  }
  return false
}

export async function deleteAccount(accountId: string) {
  const db = createClient()
  const response = await db.from('account').delete().eq('account_id', accountId)

  if (!response.error) {
    return true
  }
  return false
}

export async function createAccount(accountData: any) {
  const db = createClient()
  const { name, account_id, pod } = accountData
  const { data, error } = await db
    .from('account')
    .insert({ name, account_id, pod })
    .select()

  if (data && !error) {
    return true
  } else {
    console.log(error)
    return false
  }
}

export async function updateAccount(accountData: any) {
  const db = createClient()
  const { name, account_id, pod } = accountData

  const { data, error } = await db
    .from('account')
    .update({ name, pod })
    .eq('account_id', account_id)

  if (data && !error) {
    return true
  } else {
    console.log(error)
    return false
  }
}
