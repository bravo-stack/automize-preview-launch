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
    <nav className="absolute z-10 flex min-w-full items-center border-b border-zinc-900/70 bg-[#0f0f0f] px-7 py-5 shadow-lg">
      <Link href="/" className="mr-5 font-mono font-bold tracking-wide">
        Automize
      </Link>

      <ul className="flex gap-3 text-sm text-zinc-500/80">
        {dropdowns.map((link, index) => {
          return (
            <li key={index} className="group relative">
              <span className="inline-block transition-colors group-hover:text-white">
                {link.text}{' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="inline-block size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div className="absolute hidden w-48 flex-col gap-3 rounded bg-zinc-900 p-3 transition-all duration-1000 group-hover:flex">
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

        <Link href={'/dashboard'}>Login</Link>
        <Link href={'/sign-up'}>Sign Up</Link>
      </ul>
    </nav>
  )
}
