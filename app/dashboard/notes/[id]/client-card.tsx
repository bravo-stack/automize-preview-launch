import { textFromSQL } from '@/lib/utils'

export default function ClientCard({ title = '', properties, client }) {
  return (
    <div className="rounded-md border border-zinc-900 bg-night-starlit p-5">
      <h2 className="font-semibold tracking-tighter">{title}</h2>

      <ul className="mt-2 space-y-2">
        {properties.map((property, index) => (
          <li key={index} className="space-y-0.5">
            <p className="text-xs font-medium 2xl:text-sm">
              {textFromSQL(property)}
            </p>
            <p>
              {client[property] === undefined ||
              client[property] === null ||
              client[property] === ''
                ? 'N/A'
                : typeof client[property] === 'boolean'
                  ? client[property]
                    ? 'Yes'
                    : 'No'
                  : client[property]}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
