'use client'

import type { NavItem, NavSection } from '@/content/nav'
import { signOutUser } from '@/lib/actions'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  links: NavSection[]
  prefix?: string
  expanded?: boolean
}

export default function NavLinks({
  links,
  prefix = 'dashboard',
  expanded = true,
}: NavLinksProps) {
  const path = usePathname()

  return (
    <div
      className={`flex select-none flex-col pb-4 ${expanded ? 'gap-6' : 'gap-2'}`}
    >
      {links.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-1">
          {/* Section Label - only show when expanded */}
          {expanded && (
            <div className="mb-1.5 px-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {section.label}
              </span>
            </div>
          )}

          {/* Divider when collapsed */}
          {!expanded && sectionIndex > 0 && (
            <div className="mx-auto mb-2 h-px w-8 bg-zinc-800" />
          )}

          {/* Section Items */}
          <ul
            className={`flex flex-col gap-0.5 ${expanded ? 'pl-2' : 'items-center'}`}
          >
            {section.items.map((item, itemIndex) => (
              <NavLinkItem
                key={itemIndex}
                item={item}
                prefix={prefix}
                expanded={expanded}
                path={path}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface NavLinkItemProps {
  item: NavItem
  prefix: string
  expanded: boolean
  path: string
}

function NavLinkItem({ item, prefix, expanded, path }: NavLinkItemProps) {
  const { text, url, svg, target } = item
  const isActive =
    url === ''
      ? path === `/${prefix}` || path === `/${prefix}/`
      : path.startsWith(`/${prefix}/${url}`)

  const baseClasses = expanded
    ? 'flex h-8 items-center gap-2.5 rounded-md px-2'
    : 'flex size-10 items-center justify-center rounded-md'

  const stateClasses = isActive
    ? 'bg-zinc-500/15 text-neutral-300 hover:bg-zinc-500/30'
    : 'text-neutral-500 hover:bg-zinc-500/30 hover:text-neutral-400'

  if (target) {
    return (
      <li className="relative">
        <a
          href={url}
          target={target}
          title={!expanded ? text : undefined}
          className={`group ${baseClasses} ${stateClasses} transition-colors`}
        >
          <span className="flex-shrink-0 transition-transform group-hover:rotate-12">
            {svg}
          </span>
          {expanded && (
            <span className="whitespace-nowrap text-sm">{text}</span>
          )}
        </a>
      </li>
    )
  }

  return (
    <li className="relative">
      <Link
        href={`/${prefix}/${url}`}
        title={!expanded ? text : undefined}
        className={`group ${baseClasses} ${stateClasses} transition-colors`}
      >
        <span className="flex-shrink-0 transition-transform group-hover:rotate-12">
          {svg}
        </span>
        {expanded && <span className="whitespace-nowrap text-sm">{text}</span>}
      </Link>
    </li>
  )
}

interface NavbarSignOutProps {
  expanded?: boolean
}

export function NavbarSignOut({ expanded = true }: NavbarSignOutProps) {
  const handleClick = async () => {
    await signOutUser()
  }

  return (
    <button
      onClick={handleClick}
      title={!expanded ? 'Sign Out' : undefined}
      className={`group flex items-center rounded-md text-neutral-500 transition-colors hover:bg-zinc-500/30 hover:text-neutral-400 ${
        expanded ? 'w-full gap-2.5 px-2 py-2' : 'mx-auto size-10 justify-center'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-5 transition-transform group-hover:rotate-12"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
      </svg>
      {expanded && <span className="text-sm">Sign Out</span>}
    </button>
  )
}
