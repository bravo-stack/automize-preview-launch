'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'

type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

interface SyncResult {
  status: SyncStatus
  message?: string
  data?: {
    totalContacts?: number
    savedRecords?: number
  }
}

export default function ServicesPage() {
  const [contactsSync, setContactsSync] = useState<SyncResult>({
    status: 'idle',
  })

  async function syncContacts() {
    setContactsSync({ status: 'loading' })

    try {
      const res = await fetch('/api/omnisend/contacts', { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        setContactsSync({ status: 'error', message: data.error })
        return
      }

      setContactsSync({
        status: 'success',
        message: `Synced ${data.savedRecords} contacts`,
        data: {
          totalContacts: data.totalContacts,
          savedRecords: data.savedRecords,
        },
      })
    } catch (err) {
      setContactsSync({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return (
    <main className="min-h-screen px-24 pb-24 pt-10">
      <hgroup className="mb-10">
        <h1 className="text-3xl font-semibold text-white">Services</h1>
        <p className="text-white/60">Sync data from external services</p>
      </hgroup>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Omnisend Card */}
        <Card>
          <CardHeader>
            <CardTitle>Omnisend</CardTitle>
            <CardDescription>
              Sync contacts from your Omnisend account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={syncContacts}
                disabled={contactsSync.status === 'loading'}
              >
                {contactsSync.status === 'loading'
                  ? 'Syncing...'
                  : 'Sync Contacts'}
              </Button>

              {contactsSync.status === 'success' && (
                <span className="text-sm text-green-500">
                  ✓ {contactsSync.message}
                </span>
              )}

              {contactsSync.status === 'error' && (
                <span className="text-sm text-red-500">
                  ✗ {contactsSync.message}
                </span>
              )}
            </div>

            {contactsSync.data && (
              <div className="text-sm text-muted-foreground">
                <p>Total fetched: {contactsSync.data.totalContacts}</p>
                <p>Saved to DB: {contactsSync.data.savedRecords}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
