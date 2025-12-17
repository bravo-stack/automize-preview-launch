'use client'

import Link from 'next/link'
import { useState } from 'react'
import NavLinks, { NavbarSignOut } from './nav-links'

export default function DashboardNav({ links }) {
  const [expanded, setExpanded] = useState(true)

  const toggleSidebar = () => {
    const newState = !expanded
    setExpanded(newState)

    const targetDiv = document.getElementById('main-focus')
    if (targetDiv) {
      setTimeout(() => {
        targetDiv.style.width = newState
          ? 'calc(100% - 250px)'
          : 'calc(100% - 70px)'
      }, 500)
    }
  }

  return (
    <aside
      className={`relative hidden h-screen flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 py-2 transition-all duration-500 md:flex ${
        expanded ? 'w-[250px] px-4' : 'w-[70px] px-2'
      }`}
    >
      <div
        className={`flex h-[60px] flex-shrink-0 items-center ${expanded ? 'justify-between' : 'justify-center'}`}
      >
        {expanded ? (
          <Link
            className="px-2 font-black tracking-tighter text-neutral-200 underline"
            href="/dashboard"
          >
            AUTOMIZE
          </Link>
        ) : (
          <Link
            className="flex size-10 items-center justify-center rounded-lg bg-zinc-800/50 font-black text-neutral-200"
            href="/dashboard"
          >
            A
          </Link>
        )}

        {expanded && (
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-zinc-800 hover:text-neutral-200"
          >
            <ChevronDoubleLeft />
          </button>
        )}
      </div>

      {!expanded && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 flex size-10 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-zinc-800 hover:text-neutral-200"
        >
          <ChevronDoubleLeft className="rotate-180" />
        </button>
      )}

      <nav className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600 -mr-2 mt-4 flex-1 overflow-y-auto pr-2">
        <NavLinks links={links} expanded={expanded} />
      </nav>

      <div className="flex-shrink-0 border-t border-zinc-900 py-4">
        <NavbarSignOut expanded={expanded} />
      </div>
    </aside>
  )
}

function ChevronDoubleLeft({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`size-5 ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M10.72 11.47a.75.75 0 0 0 0 1.06l7.5 7.5a.75.75 0 1 0 1.06-1.06L12.31 12l6.97-6.97a.75.75 0 0 0-1.06-1.06l-7.5 7.5Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M4.72 11.47a.75.75 0 0 0 0 1.06l7.5 7.5a.75.75 0 1 0 1.06-1.06L6.31 12l6.97-6.97a.75.75 0 0 0-1.06-1.06l-7.5 7.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
