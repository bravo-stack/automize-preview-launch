'use client'

import { deleteJob } from '@/lib/jobs'
import { useState } from 'react'

export default function DeleteJob({ jobId }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    const res = await deleteJob(jobId)
    alert(res ? 'Deleted successfully' : 'Error deleting scheduled message.')
    setConfirmDelete(false)
  }

  return (
    <>
      <button
        onClick={() => setConfirmDelete(true)}
        className="text-red-500 hover:text-red-700"
      >
        Delete
      </button>

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-black">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete this scheduled message?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDelete(false)}
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
