import Link from 'next/link'

export default function Footer() {
  const footerItems = [
    {
      title: 'Services',
      links: [
        { href: '/service', text: 'Spreadsheets' },
        { href: '/dashboard', text: 'Data Visualization' },
        { href: '/dashboard', text: 'AI' },
      ],
    },
    {
      title: 'About',
      links: [
        { href: '/about', text: 'About' },
        { href: '/about', text: 'Customers' },
        { href: '/contact', text: 'Hiring' },
      ],
    },
    {
      title: 'Contact',
      links: [
        {
          href: null,
          text: '150 King St W #396, Toronto, ON M5H 1J9, Canada',
        },
        { href: 'mailto:info@insightxmedia.ca', text: 'info@insightxmedia.ca' },
        { href: 'tel:+16474511600', text: '+1 647-451-1600' },
      ],
    },
  ]

  return (
    <div className="px-3 md:px-5">
      <footer
        className="bg-xps-blue rounded-t-2xl border border-b-0 border-zinc-800 py-5 text-sm leading-6 text-white lg:pt-10"
        role="contentinfo"
      >
        <div className="container mx-auto grid grid-cols-1 items-start gap-10 px-4 pb-12 sm:px-6 md:grid-cols-4 md:gap-16 lg:px-8 lg:pb-20">
          <Link
            href={'/'}
            className="text-xps-orange text-xl font-bold tracking-wider"
          >
            Automize
          </Link>
          {footerItems.map((section, index) => (
            <dl key={index}>
              <dt className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                {section.title}
              </dt>
              <dd className="flex flex-col items-start font-medium">
                {section.links.map((link, idx) =>
                  link.href ? (
                    <Link
                      key={idx}
                      href={link.href}
                      className="transition-colors hover:text-zinc-500"
                    >
                      {link.text}
                    </Link>
                  ) : (
                    <span
                      key={idx}
                      className="transition-colors hover:text-zinc-500"
                    >
                      {link.text}
                    </span>
                  ),
                )}
              </dd>
            </dl>
          ))}
        </div>
        <p className="text-xps-orange mb-0 text-center text-xs text-zinc-500">
          Copyright &copy;&nbsp;2024&nbsp;Automize
        </p>
      </footer>
    </div>
  )
}
