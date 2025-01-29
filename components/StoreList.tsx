'use client'

import Link from 'next/link'

export default function StoreList({ stores }: { stores: any[] }) {
  return (
    <div className="overflow-x-auto">
      <p className="mb-1">
        Showing all {stores?.length} currently active clients that have been
        assigned a store ID:
      </p>
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Store Name
            </th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Last Rebill Date
            </th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Update Rebilling
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {stores?.map((store, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {store.brand}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {store.rebill_date ?? 'No Rebill Date Provided'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <Link
                  href={`/dashboard/notes/${store.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Visit Portfolio
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
