'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CommunicationsAuditData } from '@/types/communications-audit'
import { useState } from 'react'
import CommunicationsAuditSpreadsheet from './CommunicationsAuditSpreadsheet'
import CommunicationsAuditTable from './CommunicationsAuditTable'

interface Props {
  initialData: CommunicationsAuditData
}

type ViewType = 'spreadsheet' | 'table'

export default function CommunicationsAuditWrapper({ initialData }: Props) {
  const [currentView, setCurrentView] = useState<ViewType>('spreadsheet') // Default to spreadsheet view

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">View Mode:</h2>
          <div className="flex gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 p-1">
            <Button
              variant={currentView === 'spreadsheet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('spreadsheet')}
              className={`${
                currentView === 'spreadsheet'
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5v14M16 5v14M3 9h18M3 15h18"
                />
              </svg>
              Spreadsheet View
            </Button>
            <Button
              variant={currentView === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('table')}
              className={`${
                currentView === 'table'
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              List View
            </Button>
          </div>
        </div>

        {/* View Description */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
            {currentView === 'spreadsheet' ? 'Matrix View' : 'Detailed List'}
          </Badge>
          <span className="text-sm text-zinc-400">
            {currentView === 'spreadsheet'
              ? 'Categories vs Pods overview'
              : 'Detailed channel information'}
          </span>
        </div>
      </div>

      {/* Render the appropriate view */}
      {currentView === 'spreadsheet' ? (
        <CommunicationsAuditSpreadsheet initialData={initialData} />
      ) : (
        <CommunicationsAuditTable initialData={initialData} />
      )}
    </div>
  )
}
