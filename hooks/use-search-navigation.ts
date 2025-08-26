'use client'

import { useEffect } from 'react'

export default function useSearchNavigation(
  matches: Element[],
  currentIndex: number,
  setCurrentIndex: (i: number) => void,
) {
  const goToMatch = (index: number) => {
    if (matches.length === 0) return
    const newIndex = (index + matches.length) % matches.length
    setCurrentIndex(newIndex)
    matches[newIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })

    const el = matches[newIndex]
    if (el instanceof HTMLElement) {
      el.setAttribute('data-highlight', 'true')
    }

    matches.forEach((match, i) => {
      if (i === newIndex) return

      if (match instanceof HTMLElement) {
        match.setAttribute('data-highlight', 'false')
      }
    })
  }

  const goToNextMatch = () => goToMatch(currentIndex + 1)
  const goToPrevMatch = () => goToMatch(currentIndex - 1)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          goToPrevMatch()
        } else {
          goToNextMatch()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, currentIndex])
}
