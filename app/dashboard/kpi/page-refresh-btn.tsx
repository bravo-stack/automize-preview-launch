'use client'

import { refresh } from '@/lib/actions'
import { Loader } from 'lucide-react'
import { Fragment, useTransition } from 'react'

type Props = {}

const PageRefreshBtnKpi = (props: Props) => {
  // HOOKS
  const [isRefreshing, startTransition] = useTransition()

  return (
    <button
      disabled={isRefreshing}
      onClick={() => {
        startTransition(async () => {
          await refresh('/dashboard/kpi')
        })
      }}
      className="inline-flex items-center gap-2 rounded bg-white px-3 py-2 font-medium text-black disabled:cursor-not-allowed"
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
