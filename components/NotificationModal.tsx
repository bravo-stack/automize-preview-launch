const NotificationModal = ({
  state,
  onClose,
  message,
}: {
  state: string
  onClose: () => void
  message?: string
}) => {
  let final

  if (!message) {
    switch (state) {
      case 'loading':
        final = 'Submitting Request...'
        break
      case 'success':
        final = 'Message sent successfully!'
        break
      case 'signup':
        final = 'Account created successfully!'
        break
      case 'signin':
        final = 'Logged in successfully!'
        break
      case 'error':
        final = 'There was an error fulfilling your request. Please try again.'
        break
      case 'password':
        final = 'Incorrect login details. Please try again.'
        break
    }
  } else {
    final = message
  }

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-5">
      <div
        className={`flex w-full items-center gap-3 rounded-lg border p-4 shadow-lg ${
          state === 'success' || state === 'signup' || state === 'signin'
            ? 'border-emerald-800 bg-slate-800 text-emerald-400'
            : state === 'error' || state === 'password'
              ? 'border-red-800 bg-slate-800 text-red-400'
              : 'border-slate-700 bg-slate-800 text-slate-300'
        }`}
      >
        {state === 'loading' ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
            <p className="text-sm font-medium">{final}</p>
          </>
        ) : (
          <>
            <div className="flex-1">
              {state === 'success' ||
              state === 'signup' ||
              state === 'signin' ? (
                <svg
                  className="h-5 w-5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : state === 'error' || state === 'password' ? (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : null}
            </div>
            <p className="flex-grow text-sm font-medium">{final}</p>
            <button
              onClick={onClose}
              className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/10"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationModal
