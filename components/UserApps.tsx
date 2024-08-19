'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function UserApps({ userApps }: { userApps: any[] }) {
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleButtonClick = (index: number) => {
    setOpenModalIndex(index === openModalIndex ? null : index)
  }

  const handleClickOutside = (event: any) => {
    if (modalRef.current && modalRef.current.contains(event.target)) {
      setOpenModalIndex(null)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <ul className="grid grid-cols-4 gap-3">
      {userApps.map((app, index) => {
        return (
          <li
            key={app.name}
            className="relative rounded-md border border-zinc-800 px-3 py-2 transition-colors hover:border-zinc-700 lg:px-5 lg:py-3"
          >
            <h4 className="flex justify-between">
              <Link href={app.link} className="group hover:underline">
                {app.name}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-1.5 hidden size-3 group-hover:inline-block"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <button
                onClick={() => handleButtonClick(index)}
                className="rounded-sm transition-colors hover:bg-zinc-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </h4>
            <div
              ref={modalRef}
              className={`absolute right-0 z-10 mt-4 w-48 rounded-md border border-zinc-700 bg-night-twilight p-2 shadow-lg transition-transform duration-200 ease-in-out ${
                openModalIndex === index ? 'scale-100' : 'scale-0'
              }`}
              style={{
                transformOrigin: 'top right',
              }}
            >
              <ul className="py-1">
                {['Settings', 'Make Favourite', 'Remove'].map((link, idx) => (
                  <li
                    key={idx}
                    className="rounded-md px-1.5 text-base hover:bg-zinc-900/70"
                  >
                    <Link
                      href="/dashboard"
                      className="block h-full w-full py-1.5"
                    >
                      {link}
                    </Link>
                  </li>
                ))}{' '}
              </ul>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
