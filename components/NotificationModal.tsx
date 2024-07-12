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
    <div className="fixed right-0 top-0 p-5">
      <div
        className={`mt-20 flex items-center justify-between rounded-md bg-night-dusk p-3 shadow-md`}
      >
        {state === 'loading' && (
          <span className="mr-2 h-6 w-6 animate-spin rounded-full border-b-2 border-t-2" />
        )}
        <p>{final}</p>
        {state !== 'loading' && (
          <button onClick={onClose} className="ml-2">
            &times;
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationModal
