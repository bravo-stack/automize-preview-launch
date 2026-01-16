'use client'

import UpdateIxmValue from '@/app/dashboard/communications-audit/update-ixm-value'
import RevalidateButton from '@/components/revalidate-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CommunicationsAuditData } from '@/types/communications-audit'
import { List, Table2 } from 'lucide-react'
import { memo, useState } from 'react'
import AuditSpreadsheet from './audit-spreadsheet'
import ClientQueueView from './client-queue-view'

interface AuditViewSwitcherProps {
  initialData: CommunicationsAuditData
  ixmDidntReachOutHours: number
  clientSilentDays: number
  highPriorityDays: number
  highPriorityColor: string
  userRole: string
  defaultView?: 'queue' | 'spreadsheet'
}

function AuditViewSwitcher({
  initialData,
  ixmDidntReachOutHours,
  clientSilentDays,
  highPriorityDays,
  highPriorityColor,
  userRole,
  defaultView = 'queue',
}: AuditViewSwitcherProps) {
  // For pod users, default to queue view. For exec, default to spreadsheet
  const initialView = userRole === 'exec' ? 'spreadsheet' : defaultView
  const [activeView, setActiveView] = useState<'queue' | 'spreadsheet'>(
    initialView,
  )

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => setActiveView(value as 'queue' | 'spreadsheet')}
      className="w-full"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="h-12 w-full bg-zinc-900/50 p-1 sm:w-auto">
          <TabsTrigger
            value="queue"
            className="flex-1 gap-2 px-4 py-2.5 data-[state=active]:bg-zinc-700 sm:flex-none"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Client List</span>
            <span className="sm:hidden">List</span>
          </TabsTrigger>
          <TabsTrigger
            value="spreadsheet"
            className="flex-1 gap-2 px-4 py-2.5 data-[state=active]:bg-zinc-700 sm:flex-none"
          >
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">Spreadsheet</span>
            <span className="sm:hidden">Sheet</span>
          </TabsTrigger>
        </TabsList>

        {activeView === 'queue' && (
          <p className="text-sm text-zinc-500">Clients awaiting response</p>
        )}
        {activeView === 'spreadsheet' && (
          <div className="flex w-fit items-center gap-4">
            <p className="text-sm text-zinc-500">Full audit data</p>
            <RevalidateButton />
          </div>
        )}
      </div>

      {activeView === 'spreadsheet' && (
        <div className="mb-6 space-y-4">
          <UpdateIxmValue
            didnt_reach_out_hours={ixmDidntReachOutHours}
            client_silent_days={clientSilentDays}
            high_priority_days={highPriorityDays}
            high_priority_color={highPriorityColor}
            role={userRole}
          />
        </div>
      )}

      <TabsContent value="queue" className="mt-0">
        <ClientQueueView
          initialData={initialData}
          ixmDidntReachOutHours={ixmDidntReachOutHours}
          clientSilentDays={clientSilentDays}
          highPriorityDays={highPriorityDays}
          highPriorityColor={highPriorityColor}
          userRole={userRole}
        />
      </TabsContent>

      <TabsContent value="spreadsheet" className="mt-0">
        <AuditSpreadsheet
          initialData={initialData}
          ixm_didnt_reach_out_hours={ixmDidntReachOutHours}
          client_silent_days={clientSilentDays}
          high_priority_days={highPriorityDays}
          high_priority_color={highPriorityColor}
        />
      </TabsContent>
    </Tabs>
  )
}

export default memo(AuditViewSwitcher)
