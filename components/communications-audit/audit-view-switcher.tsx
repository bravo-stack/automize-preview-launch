'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CommunicationsAuditData } from '@/types/communications-audit'
import { LayoutGrid, Table2 } from 'lucide-react'
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
            className="flex-1 gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 sm:flex-none"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Response Queue</span>
            <span className="sm:hidden">Queue</span>
          </TabsTrigger>
          <TabsTrigger
            value="spreadsheet"
            className="flex-1 gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-zinc-600 data-[state=active]:to-zinc-500 sm:flex-none"
          >
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">Spreadsheet View</span>
            <span className="sm:hidden">Sheet</span>
          </TabsTrigger>
        </TabsList>

        {activeView === 'queue' && (
          <p className="text-sm text-zinc-500">
            Clients grouped by response priority and time slots
          </p>
        )}
        {activeView === 'spreadsheet' && (
          <p className="text-sm text-zinc-500">
            Full audit data in spreadsheet format
          </p>
        )}
      </div>

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
