'use client'

import Link from 'next/link'
import NavLinks, { NavbarSignOut } from './nav-links'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function DashboardNav({ links }) {
  const [expanded, setExpanded] = useState(true)

  const toggleSidebar = () => {
    setExpanded(!expanded)

    const targetDiv = document.getElementById('main-focus')
    if (targetDiv) {
      setTimeout(() => {
        targetDiv.style.width = expanded
          ? 'calc(100% - 70px)'
          : 'calc(100% - 250px)'
      }, 500) // 500 milliseconds = half a second
    }
  }

  return (
    <aside
      className={`dark:border-dark-outline relative hidden h-screen flex-shrink-0 flex-col border-r border-zinc-800 px-4 pb-6 pt-4 transition-all duration-500 md:flex ${expanded ? 'w-[250px]' : 'w-[70px]'}`}
    >
      <div className="flex h-[60px] justify-between">
        {expanded && (
          <Link
            className="my-auto px-2 font-black text-neutral-200 underline"
            href="/dashboard"
          >
            AUTOMIZE
          </Link>
        )}

        <button className="-mt-4" onClick={toggleSidebar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`size-6 transform ${!expanded && 'rotate-180'}`}
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
        </button>
      </div>

      <nav className="mt-6 flex-1">
        <NavLinks links={links} expanded={expanded} />
      </nav>

      <NavbarSignOut />
    </aside>
  )
}
