'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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

  // When collapsed, we force all items to be 'open' so icons show.
  // When expanded, we let the Accordion manage its own state.
  const openValues = links.map((_, i) => `section-${i}`)

  return (
    <Accordion
      type="multiple"
      value={!expanded ? openValues : undefined}
      defaultValue={openValues}
      className="flex w-full select-none flex-col gap-2 border-none pb-2"
    >
      {links.map((section, sectionIndex) => (
        <AccordionItem
          key={sectionIndex}
          value={`section-${sectionIndex}`}
          className="border-none"
        >
          <AccordionTrigger
            disabled={!expanded}
            className={`py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180 ${
              !expanded ? 'cursor-default justify-center' : 'px-2'
            }`}
          >
            {expanded ? (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                {section.label}
              </span>
            ) : (
              <div className="h-px w-6 bg-zinc-800" />
            )}

            {/* CSS Tweak: Hide the chevron when collapsed */}
            {!expanded && (
              <style jsx global>{`
                [data-state] > svg {
                  display: ${expanded ? 'block' : 'none'} !important;
                }
              `}</style>
            )}
          </AccordionTrigger>

          <AccordionContent className="pb-0 transition-all">
            <ul
              className={`flex flex-col gap-1 ${expanded ? 'pl-2' : 'items-center'}`}
            >
              {section?.items?.map((item, itemIndex) => (
                <NavLinkItem
                  key={itemIndex}
                  item={item}
                  prefix={prefix}
                  expanded={expanded}
                  path={path}
                />
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function NavLinkItem({
  item,
  prefix,
  expanded,
  path,
}: {
  item: NavItem
  prefix: string
  expanded: boolean
  path: string
}) {
  const { text, url, svg, target } = item
  const isExternal = url.startsWith('http')
  const fullUrl = isExternal ? url : `/${prefix}/${url}`

  const isActive = isExternal
    ? false
    : url === ''
      ? path === `/${prefix}` || path === `/${prefix}/`
      : path.startsWith(`/${prefix}/${url}`)

  const baseClasses = expanded
    ? 'flex h-9 items-center gap-2.5 rounded-md px-2'
    : 'flex size-10 items-center justify-center rounded-md'

  const stateClasses = isActive
    ? 'bg-zinc-500/15 text-neutral-200'
    : 'text-neutral-500 hover:bg-zinc-500/20 hover:text-neutral-300'

  const content = (
    <>
      <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
        {svg}
      </span>
      {expanded && (
        <span className="whitespace-nowrap text-sm font-medium">{text}</span>
      )}
    </>
  )

  return (
    <li className="list-none">
      {target ? (
        <a
          href={fullUrl}
          target={target}
          title={!expanded ? text : undefined}
          className={`group ${baseClasses} ${stateClasses} transition-all`}
        >
          {content}
        </a>
      ) : (
        <Link
          href={fullUrl}
          title={!expanded ? text : undefined}
          className={`group ${baseClasses} ${stateClasses} transition-all`}
        >
          {content}
        </Link>
      )}
    </li>
  )
}

export function NavbarSignOut({ expanded = true }: { expanded?: boolean }) {
  const handleClick = async () => await signOutUser()
  return (
    <button
      onClick={handleClick}
      title={!expanded ? 'Sign Out' : undefined}
      className={`group flex items-center rounded-md text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400 ${
        expanded ? 'w-full gap-2.5 px-3 py-2' : 'mx-auto size-10 justify-center'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-5 transition-transform group-hover:translate-x-0.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
      </svg>
      {expanded && <span className="text-sm font-medium">Sign Out</span>}
    </button>
  )
}
