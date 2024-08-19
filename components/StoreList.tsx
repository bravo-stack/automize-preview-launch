'use client'

import UpdateStore from './UpdateStore'

export default function StoreList({ stores }: { stores: any[] }) {
  const handleUpdate = async () => {}

  return (
    <div className="overflow-x-auto">
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
                {store.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {store.last_rebill ?? 'No Rebill Date Provided'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <UpdateStore store={store} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
