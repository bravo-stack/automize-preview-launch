import { createAdminClient } from '../db/admin'
import crypto from 'crypto'

const admin = createAdminClient()

// Skip list — emails you don't want to reset
const SKIP_EMAILS = ['automate@insightxmedia.com'].map((email) =>
  email.toLowerCase(),
) // normalize for comparison

function generatePassword(length = 12) {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length)
}

export async function resetAllPasswords() {
  console.log('\nFetching users...')
  const { data: users, error } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  const updatedUsers: { email: string; password: string }[] = []

  for (const user of users.users) {
    const email = user.email?.toLowerCase()

    if (!email) continue

    if (SKIP_EMAILS.includes(email)) {
      console.log(`Skipping: ${email}`)
      continue
    }

    const newPassword = generatePassword(12)

    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      },
    )

    if (updateError) {
      console.error(`❌ Failed to update ${email}:`, updateError.message)
    } else {
      updatedUsers.push({ email, password: newPassword })
    }
  }

  // Console Table
  console.log('\n✅ Updated Passwords:\n')
  console.table(updatedUsers)

  // Copy-Paste Friendly Log
  console.log('\n--- Copy-Paste Friendly Log ---\n')
  updatedUsers.forEach(({ email, password }) => {
    console.log(`${email.padEnd(40)} => ${password}`)
  })
}
