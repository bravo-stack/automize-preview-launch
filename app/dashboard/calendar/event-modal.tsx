'use client'

interface EventModalProps {
  event: {
    id: number
    pod: string | null
    name: string
    start_time: string
    end_time: string
    notes: string | null
    clients: {
      brand: string
    }
  } | null
  onClose: () => void
}

export default function EventModal({ event, onClose }: EventModalProps) {
  if (!event) return null

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format time to be more readable
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Event details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{event.name}</h2>

          <div className="space-y-2">
            <div>
              <span className="font-medium">Client:</span>{' '}
              <span>{event.clients.brand}</span>
            </div>

            {event.pod && (
              <div>
                <span className="font-medium">Pod:</span>{' '}
                <span>{event.pod}</span>
              </div>
            )}

            <div>
              <span className="font-medium">Date:</span>{' '}
              <span>{formatDate(event.start_time)}</span>
            </div>

            <div>
              <span className="font-medium">Time:</span>{' '}
              <span>
                {formatTime(event.start_time)} - {formatTime(event.end_time)}
              </span>
            </div>

            {event.notes && (
              <div>
                <p className="font-medium">Notes:</p>
                <p className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3">
                  {event.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
