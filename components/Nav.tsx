'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Nav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const links = []
  return (
    <>
      <nav className="sticky left-0 right-0 top-0 z-50 mx-auto max-w-6xl px-3 py-2 lg:px-5 lg:py-3">
        <div className="z-10 flex rounded-2xl border border-night-dusk bg-night-twilight px-7 py-5 shadow-md shadow-zinc-700/15 md:px-0 md:py-0">
          <Link
            href="/"
            className="flex items-center font-mono text-xl font-bold uppercase tracking-wider md:mr-auto md:px-5"
          >
            Automize
          </Link>

          <ul className="relative hidden items-stretch text-sm text-zinc-500/80 md:flex md:flex-grow md:justify-center">
            {/* {links.map((link, index) => (
              <li
                key={index}
                className="group flex cursor-pointer items-stretch px-3"
              >
                <Link
                  href={link.href}
                  className="flex items-center text-base transition-colors group-hover:text-white"
                >
                  {link.text}
                </Link>
              </li>
            ))} */}
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

        <ul className="text flex flex-col gap-5"></ul>
      </nav>
    </>
  )
}
