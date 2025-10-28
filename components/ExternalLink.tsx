import { ReactNode } from 'react'

interface ExternalLinkProps {
  children: ReactNode
  href?: string | null
  className?: string
  onClick?: () => void
}

export default function ExternalLink({
  children,
  href,
  className,
  onClick,
}: ExternalLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href) {
      e.preventDefault() // stop navigation
      console.warn(
        'ExternalLink: href is null or undefined, navigation prevented.',
      )
      return
    }

    if (onClick) onClick()
  }

  return (
    <a
      href={href || '#'}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className={`${!href ? 'cursor-not-allowed opacity-60' : ''} ${className || ''}`}
    >
      {children}
    </a>
  )
}
