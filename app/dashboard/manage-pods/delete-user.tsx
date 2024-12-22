'use client'

import { deleteUser } from '@/lib/actions/db'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteUser({ user_id }) {
  const [isOpen, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      const { error } = await deleteUser(user_id)
      alert(error ? 'Error deleting user.' : 'Successfully deleted user.')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 hover:text-red-700"
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-black">
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
