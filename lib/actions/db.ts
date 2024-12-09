'use server'

import { createClient } from '../db/server'

export async function createItem(table, data): Promise<any> {
  const db = createClient()
  const { data: item, error } = await db
    .from(table)
    .insert(data)
    .select('id')
    .single()

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
  const db = createClient()
  const { error } = await db.from(table).update(data).eq(identifier, id)
  console.log(error)
  return error ? false : true
}
