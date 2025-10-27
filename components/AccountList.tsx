'use client'

import { deleteItem, updateItem } from '@/lib/actions/db'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import CreateAccount from './CreateAccount'

interface Account {
  id: string
  brand: string
  fb_key: string
  pod: string
  status: string
  full_name: string
  phone_number: string
  is_monitored: boolean
  rebill_amt: number
}

export default function AccountList({
  accounts,
  pods,
}: {
  accounts: Account[]
  pods: string[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAccounts, setFilteredAccounts] = useState(accounts)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [updatingMonitored, setUpdatingMonitored] = useState<string | null>(
    null,
  )
  const router = useRouter()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = accounts.filter(
      (account) =>
        account.brand.toLowerCase().includes(term) ||
        (account.full_name?.toLowerCase().includes(term) ?? false) ||
        (account.phone_number?.toLowerCase().includes(term) ?? false),
    )

    setFilteredAccounts(filtered)
  }

  const handleDelete = async (clientId: string) => {
    await deleteItem('clients', clientId)
    setConfirmDelete(null)
    router.refresh()
  }

  const closeDeleteModal = () => setConfirmDelete(null)

  const closeEditModal = () => setEditAccount(null)

  const handleEdit = async (updatedAccount: Account) => {
    const accountData = {
      brand: updatedAccount.brand,
      pod: updatedAccount.pod,
      status: updatedAccount.status,
      churn_date: updatedAccount.status === 'left' ? new Date() : null,
    }

    // please test this TODO
    const { error } = await updateItem(
      'clients',
      accountData,
      updatedAccount.id,
    )

    if (error) {
      toast.error('Error updating account.')
      return
    } else {
      toast.success('Account updated successfully.')
    }

    setEditAccount(null)
    router.refresh()
  }

  const handleMonitoredToggle = async (
    accountId: string,
    currentStatus: boolean,
  ) => {
    setUpdatingMonitored(accountId)
    toast.loading('Updating monitored status...')

    const { error } = await updateItem(
      'clients',
      { is_monitored: !currentStatus },
      accountId,
    )

    toast.dismiss()

    if (error) {
      toast.error('Error updating monitored status.')
    } else {
      toast.success(
        `Client ${!currentStatus ? 'marked as monitored' : 'unmarked from monitored'}.`,
      )
      router.refresh()
    }

    setUpdatingMonitored(null)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col justify-center px-4">
      <div className="mb-10 flex gap-2">
        <search className="flex w-full items-center gap-2 rounded-md border border-zinc-800 bg-night-starlit px-2 outline-none transition-colors hover:border-zinc-700 focus:ring focus:ring-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
              clipRule="evenodd"
              className="block"
            />
          </svg>

          <input
            type="text"
            placeholder="E.g. InsightX..."
            value={searchTerm}
            onChange={handleSearch}
            className="flex w-full items-center gap-2 rounded-md bg-night-starlit px-2 outline-none"
          />
        </search>

        <CreateAccount pods={pods} />
      </div>

      <div className="relative w-full">
        <div className="mx-auto max-w-screen-2xl overflow-x-auto overflow-y-hidden rounded border border-zinc-200 bg-white pb-4 pt-2">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Brand
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Monitored
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Pod
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Rebill Amount
                </th>

                <th scope="col" className="relative px-3 py-3">
                  <span className="sr-only">Edit</span>
                </th>
                <th scope="col" className="relative px-3 py-3">
                  <span className="sr-only">Edit</span>
                </th>
                <th scope="col" className="relative py-3 pr-6">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAccounts.map((account, index) => (
                <tr key={index}>
                  <td className="max-w-[20ch] truncate whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {account.brand ? (
                      account.brand
                    ) : (
                      <span className=" text-red-700">Missing</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <button
                      onClick={() =>
                        handleMonitoredToggle(account.id, account.is_monitored)
                      }
                      disabled={updatingMonitored === account.id}
                      className="text-xl text-yellow-500 transition-transform hover:scale-110 disabled:opacity-50"
                      title={
                        account.is_monitored
                          ? 'Click to unmark as monitored'
                          : 'Click to mark as monitored'
                      }
                    >
                      {account.is_monitored ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {account.full_name ? (
                      account.full_name
                    ) : (
                      <span className="text-red-700">Missing</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {account.phone_number ? (
                      account.phone_number
                    ) : (
                      <span className="text-red-700">Missing</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {account.fb_key ? (
                      account.fb_key
                    ) : (
                      <span className="text-red-700">Missing</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {account.pod ? account.pod : <span>n/a</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {account.rebill_amt ? (
                      `$${account.rebill_amt.toLocaleString()}`
                    ) : (
                      <span className="text-red-700">Missing</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/notes/${account.id}`}
                      className="inline-block text-gray-500 underline"
                    >
                      Portfolio
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => setEditAccount(account)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="whitespace-nowrap py-4 pr-6 text-right text-sm font-medium">
                    <button
                      onClick={() => setConfirmDelete(account.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-black">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete this account?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={closeDeleteModal}
                className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-md border border-red-700 px-4 py-2 text-red-700 shadow-sm transition-colors hover:bg-red-700/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editAccount && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-black">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold">Edit Account</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEdit(editAccount)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={editAccount.brand}
                    onChange={(e) =>
                      setEditAccount({ ...editAccount, brand: e.target.value })
                    }
                    required
                    placeholder="E.g. InsightX Media"
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={editAccount.fb_key}
                    disabled
                    onChange={(e) =>
                      setEditAccount({
                        ...editAccount,
                        fb_key: e.target.value,
                      })
                    }
                    required
                    placeholder="E.g. 1234567890..."
                    className="w-full rounded border bg-zinc-300/50 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Pod</label>

                <input
                  type="text"
                  value={editAccount.pod}
                  onChange={(e) =>
                    setEditAccount({
                      ...editAccount,
                      pod: e.target.value.toLowerCase(),
                    })
                  }
                  required
                  placeholder="E.g. maps"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Client Status
                </label>
                <select
                  value={editAccount.status}
                  onChange={(e) =>
                    setEditAccount({
                      ...editAccount,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="left">Left</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md bg-black px-4 py-2 text-white shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 px-4 py-2 shadow-sm transition-colors hover:bg-zinc-800/10"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
