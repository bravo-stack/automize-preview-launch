import Link from 'next/link'

export default function Nav() {
  const dropdowns = [
    {
      text: 'Solutions',
      content: [
        {
          text: 'Auto-Metric',
          href: '/solutions',
        },
        {
          text: 'Test',
          href: '/solutions',
        },
        {
          text: 'Test',
          href: '/solutions',
        },
        {
          text: 'Test',
          href: '/solutions',
        },
      ],
    },
    {
      text: 'Resources',
      content: [
        {
          text: 'Test',
          href: '/solutions',
        },
      ],
    },
  ]

  const statics = [
    { text: 'Docs', href: '/docs' },
    { text: 'Pricing', href: '/pricing' },
    { text: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="absolute items-center flex px-7 py-5 border-b border-zinc-900/70 shadow-lg min-w-full">
      <Link href="/" className="font-mono mr-5 font-bold tracking-wide">
        Automize
      </Link>

      <ul className="flex gap-3 text-sm text-zinc-500/80">
        {dropdowns.map((link, index) => {
          return (
            <li key={index} className="group relative">
              <span className="group-hover:text-white transition-colors inline-block">
                {link.text}{' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-4 inline-block"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div className="absolute w-48 bg-zinc-900 p-3 gap-3 rounded hidden duration-1000 transition-all group-hover:flex flex-col">
                {link.content.map((inner, index) => (
                  <Link
                    key={index}
                    href={inner.href}
                    className="transition-colors group-hover:text-white"
                  >
                    {inner.text}
                  </Link>
                ))}
              </div>
            </li>
          )
        })}

        {statics.map((link, index) => (
          <li key={index} className="transition-colors hover:text-white">
            <Link href={link.href}>{link.text}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
