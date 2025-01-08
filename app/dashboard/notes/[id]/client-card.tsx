import { textFromSQL } from '@/lib/utils'

export default function ClientCard({ title = '', properties, client }) {
  return (
    <div className="rounded-md border border-zinc-900 bg-night-starlit p-5">
      <h2 className="font-semibold tracking-tighter">{title}</h2>

      <ul className="mt-2 space-y-2">
        {properties.map((property, index) => {
          const value = client[property]

          const displayValue =
            value === undefined || value === null || value === ''
              ? 'N/A'
              : property === 'closed_at' && value
                ? new Date(value).toDateString()
                : typeof value === 'boolean'
                  ? value
                    ? 'Yes'
                    : 'No'
                  : value

          return (
            <li key={index} className="space-y-0.5">
              <p className="text-xs font-medium 2xl:text-sm">
                {textFromSQL(property)}
              </p>
              <p>{displayValue}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
