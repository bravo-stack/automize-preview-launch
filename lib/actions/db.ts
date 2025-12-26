'use server'

import { encrypt } from '../crypto'
import { createAdminClient } from '../db/admin'
import { createClient } from '../db/server'
import { podFromEmail } from '../utils'

export async function createItem(table, data): Promise<any> {
  const db = createAdminClient()
  const { data: item, error } = await db
    .from(table)
    .insert(data)
    .select('id')
    .single()

  if (error) console.log(error)

  return { data: item, error: error ? true : false }
}

export async function updateKeys(data) {
  const db = createAdminClient()
  const payload = {
    ...(data.fb_key && { fb_key: `act_${data.fb_key}` }),
    ...(data.shopify_key && { shopify_key: encrypt(data.shopify_key) }), // Encrypt here
    ...(data.store_id && { store_id: data.store_id }),
    ...(data.omni_keys && { omni_keys: encrypt(data.omni_keys) }),
  }

  const { error } = await db.from('clients').update(payload).eq('id', data.id)

  return { error: error ? true : false }
}

export async function upsertItem(table, data): Promise<any> {
  const db = createAdminClient()
  const { data: item, error } = await db.from(table).upsert(data)
  // .select('id')
  // .single()

  if (error) console.log(error)

  return { data: item, error: error ? true : false }
}

export async function deleteItem(table: string, id, column = 'id') {
  const db = createClient()
  const { error } = await db.from(table).delete().eq(column, id)

  if (error) {
    console.error('Error deleting item:', error)
    return false
  }

  return true
}

export async function updateItem(table, data, id, identifier = 'id') {
  const db = createAdminClient()
  const { error } = await db.from(table).update(data).eq(identifier, id)

  if (error) console.error('Error updating item:', error)
  return { error: error ? true : false }
}

export async function createUser(email, password, pod, discord): Promise<any> {
  const db = createAdminClient()

  const {
    data: { user },
    error,
  } = await db.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: 'pod' },
    email_confirm: true,
  })

  if (error || !user) {
    return { error: true }
  } else {
    const { error } = await createItem('pod', {
      name: pod,
      discord_id: discord,
      user_id: user.id,
    })

    return { error: error ? true : false }
  }
}

export async function deleteUser(user_id: string): Promise<{ error: boolean }> {
  const db = createAdminClient()
  const { error } = await db.auth.admin.deleteUser(user_id)
  if (error) console.error(error)
  return { error: error ? true : false }
}

export async function getPod() {
  const db = createClient()
  const {
    data: { user },
  } = await db.auth.getUser()

  if (user && user.email) {
    const pod = podFromEmail(user.email)
    return pod
  }
}
