'use client'

import { deleteItem } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteItemProps {
  table: string
  id: string | number
  column?: string
  button?: boolean
}

export default function DeleteItem({
  table,
  id,
  column = 'id',
  button = false,
}: DeleteItemProps) {
  const [isOpen, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await deleteItem(table, id, column)
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <>
      {button ? (
        <button
          onClick={() => setOpen(true)}
          className="absolute -right-2 -top-2 hidden rounded-full text-red-500 group-hover/p:block"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-black">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete this item?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md border border-red-700 px-4 py-2 text-red-700 shadow-sm transition-colors hover:bg-red-700/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
