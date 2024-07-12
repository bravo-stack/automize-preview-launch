const NotificationModal = ({
  state,
  onClose,
  message,
}: {
  state: string
  onClose: () => void
  message: string
}) => {
  return (
    <div className="fixed right-0 top-0 p-5">
      <div
        className={`mt-20 flex items-center justify-between rounded-md bg-night-dusk p-3 shadow-md`}
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
