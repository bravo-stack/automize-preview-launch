const NotificationModal = ({
  state,
  onClose,
}: {
  state: string
  onClose: () => void
}) => {
  let message

  switch (state) {
    case 'loading':
      message = 'Submitting Request...'
      break
    case 'success':
      message = 'Message sent successfully!'
      break
    case 'signup':
      message = 'Account created successfully!'
      break
    case 'signin':
      message = 'Logged in successfully!'
      break
    case 'error':
      message = 'There was an error fulfilling your request. Please try again.'
      break
    case 'password':
      message = 'Incorrect login details. Please try again.'
      break
  }

  return (
    <div className="fixed right-0 top-0 p-3">
      <div
        className={`bg-xps-deepBlue mt-20 flex items-center justify-between rounded-md p-3 shadow-md`}
      >
        {state === 'loading' && (
          <span className="mr-2 h-6 w-6 animate-spin rounded-full border-b-2 border-t-2" />
        )}
        <p>{message}</p>
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
