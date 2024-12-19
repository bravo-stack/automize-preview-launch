'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOutUser } from '@/lib/actions'

export default function NavLinks({
  links,
  prefix = 'dashboard',
  expanded = true,
}) {
  const path = usePathname()

  return (
    <ul className="flex select-none flex-col gap-2">
      {links.map(({ text, url, svg }, index) => {
        const isActive =
          path.startsWith(`/${prefix}/${url}`) ||
          (url === '/' && path === `/${prefix}`)
        return (
          <li key={index}>
            <Link
              href={`/${prefix}/${url}`}
              className={`group flex h-8 items-center gap-2.5 rounded-md px-2 transition-colors ${
                isActive
                  ? 'bg-zinc-500/15 text-neutral-300 hover:bg-zinc-500/30'
                  : 'text-neutral-500 hover:bg-zinc-500/30 hover:text-neutral-400'
              }`}
            >
              <span className="transition-transform group-hover:rotate-12">
                {svg}
              </span>
              <p
                className={`transition-transform duration-500 ${!expanded && 'scale-[.1]'}`}
              >
                <span
                  className={`transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}
                >
                  {text}
                </span>
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function NavbarSignOut() {
  const handleClick = async () => {
    await signOutUser()
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-md bg-neutral-800/50 py-1.5 text-neutral-400 transition-all hover:bg-neutral-800"
    >
      Sign Out
    </button>
  )
}
