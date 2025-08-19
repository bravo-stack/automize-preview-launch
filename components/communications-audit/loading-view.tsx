'use client'

const LoadingView = () => {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-600 border-t-white"></div>
        <p className="text-sm text-zinc-400">Loading audit data...</p>
      </div>
    </div>
  )
}

export default LoadingView
