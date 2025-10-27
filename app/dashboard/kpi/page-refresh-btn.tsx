'use client'

import { Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Fragment, useTransition } from 'react'

type Props = {}

const PageRefreshBtnKpi = (props: Props) => {
  // HOOKS
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()

  return (
    <button
      disabled={isRefreshing}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
      className="inline-flex items-center gap-2 rounded bg-white px-3 py-2 font-medium text-black"
    >
      {isRefreshing ? (
        <Fragment>
          <Loader className="size-4 animate-spin" /> Refreshing...{' '}
        </Fragment>
      ) : (
        'Refresh Data'
      )}
    </button>
  )
}

export default PageRefreshBtnKpi
