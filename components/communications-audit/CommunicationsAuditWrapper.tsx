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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625ZM21 9.375A.375.375 0 0 0 20.625 9h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5ZM10.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5ZM3.375 15h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375Zm0-3.75h7.5a.375.375 0 0 0 .375-.375v-1.5A.375.375 0 0 0 10.875 9h-7.5A.375.375 0 0 0 3 9.375v1.5c0 .207.168.375.375.375Z"
                  clipRule="evenodd"
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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
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
