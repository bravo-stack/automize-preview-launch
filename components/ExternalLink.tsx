// create an external link component

import { ReactNode } from 'react'

interface ExternalLinkProps {
  children: ReactNode
  href: string
  className?: string
  onClick?: () => void
}

export default function ExternalLink({
  children,
  href,
  className,
  onClick,
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}

// Usage example:
// <ExternalLink href="https://example.com" className="text-blue-500 hover:text-blue-600">
//   Visit Example
// </ExternalLink>
