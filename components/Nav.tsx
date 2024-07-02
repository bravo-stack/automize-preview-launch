'use client'

import { useState, useRef, useEffect } from 'react'
import { dropdowns } from '@/content/nav'
import Link from 'next/link'

export default function Nav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<boolean[]>([])
  const [hoveredDropdownIndex, setHoveredDropdownIndex] = useState<
    number | null
  >(null)
  const [arrowStyle, setArrowStyle] = useState<{ left: number; width: number }>(
    { left: 0, width: 0 },
  )

  const navRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (hoveredDropdownIndex !== null && navRef.current) {
      const dropdownItem = navRef.current.children[
        hoveredDropdownIndex
      ] as HTMLElement
      setArrowStyle({
        left: dropdownItem.offsetLeft,
        width: dropdownItem.offsetWidth,
      })
    }
  }, [hoveredDropdownIndex])

  const toggleDropdown = (index: number) => {
    setOpenDropdowns((prev) => {
      const newOpenDropdowns = [...prev]
      newOpenDropdowns[index] = !newOpenDropdowns[index]
      return newOpenDropdowns
    })
  }

  return (
    <>
      <nav className="sticky left-0 right-0 top-0 z-50 px-3 py-2 backdrop-blur-md lg:px-5 lg:py-3">
        <div className="z-10 flex items-stretch justify-between rounded-2xl border border-night-dusk bg-gradient-to-r from-night-witchingHour to-night-dusk px-7 py-5 shadow-sm shadow-white/10 md:px-0 md:py-0">
          <Link
            href="/"
            className="flex items-center font-mono text-xl font-bold tracking-wide md:mr-auto md:px-5"
          >
            Automize
          </Link>

          <ul
            ref={navRef}
            className="relative hidden items-stretch text-sm text-zinc-500/80 md:flex md:flex-grow md:justify-center"
          >
            {dropdowns.map((link, index) => (
              <li
                key={index}
                className="group flex cursor-pointer items-stretch px-3"
                onMouseEnter={() => setHoveredDropdownIndex(index)}
                onMouseLeave={() => setHoveredDropdownIndex(null)}
              >
                <Link
                  href={link.text.toLowerCase()}
                  className="flex items-center text-base transition-colors group-hover:text-white"
                >
                  {link.text}
                </Link>

                <span
                  className="absolute bottom-0 hidden h-0.5 bg-white transition-all duration-300 group-hover:block"
                  style={{
                    left: `${arrowStyle.left}px`,
                    width: `${arrowStyle.width}px`,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.47 7.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 0 1-1.06-1.06l7.5-7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>

                <div className="fixed left-48 right-48 top-[4.8rem] z-50 hidden cursor-default items-center justify-center rounded-xl border border-night-dusk bg-gradient-to-tr from-night-twilight via-night-dusk to-night-twilight p-5 hover:flex group-hover:flex">
                  <div className="grid grid-cols-3 gap-5">
                    {link.sections.map((section, index) => (
                      <div key={index} className="space-y-2">
                        <h3>{section.header}</h3>

                        {section.content.map((link, index) => (
                          <Link
                            key={index}
                            href={link.href}
                            className="group/link flex items-center gap-2 transition-colors group-hover:text-white"
                          >
                            <span className="rounded border p-1.5 transition-colors group-hover/link:bg-white group-hover/link:text-black">
                              {link.svg}
                            </span>
                            <span>
                              <h4 className="tracking-wide">{link.text}</h4>
                              <p className="text-xs text-white/50 transition-colors group-hover/link:text-white">
                                {link.desc}
                              </p>
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden items-stretch space-x-2 md:flex">
            <Link
              href="/login"
              className="flex items-stretch rounded-md border border-zinc-800 px-3 py-2 text-center font-semibold text-white/80 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white hover:shadow hover:shadow-white/15 md:mx-5 md:my-3"
            >
              Login
            </Link>
          </div>

          <button
            className="ml-auto text-white md:hidden"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </nav>

      <nav
        className={`fixed inset-0 z-50 transform bg-night-dusk px-6 py-6 transition-transform duration-300 lg:hidden ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-10 flex justify-between">
          <h1 className="font-mono text-xl font-semibold tracking-wide">
            Automize
          </h1>
          <button
            className="rounded-sm border border-white text-white"
            onClick={() => setIsDrawerOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <ul className="text flex flex-col gap-5">
          {dropdowns.map((link, index) => (
            <li key={index} className="border-b border-zinc-500 pb-1">
              <div>
                <Link
                  href={link.text.toLowerCase()}
                  className="mr-2 text-xl tracking-wide decoration-1 underline-offset-2 transition-all hover:underline"
                >
                  {link.text}
                </Link>

                <button onClick={() => toggleDropdown(index)} className="group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`ml-1 inline-block size-5 rounded-full border transition-all group-hover:border-zinc-800 group-hover:bg-white group-hover:text-zinc-800 ${openDropdowns[index] ? 'rotate-180 transform' : ''}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {openDropdowns[index] && (
                <ul
                  className={`flex w-full flex-col gap-1.5 ${openDropdowns[index] && 'my-4'}`}
                >
                  {link.sections.map((section, sectionIndex) => (
                    <li key={sectionIndex} className="flex flex-col">
                      <h3 className="my-2.5 tracking-tight">
                        {section.header}
                      </h3>

                      {section.content.map((inner, innerIndex) => (
                        <Link
                          key={innerIndex}
                          href={inner.href}
                          className="mb-0.5 underline decoration-white/20 underline-offset-1 transition-colors hover:decoration-white"
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          {inner.text}
                        </Link>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
