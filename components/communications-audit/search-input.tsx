'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

type Props = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  matches: Element[]
  onPrevClick: () => void
  onNextClick: () => void
  isPreviousDisabled: boolean
  isNextDisabled: boolean
}

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  matches,
  onPrevClick,
  onNextClick,
  isPreviousDisabled,
  isNextDisabled,
}: Props) => {
  // STATES
  const [isSearching, setIsSearching] = useState(false)

  // SIDE EFFECTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Works cross-platform: Ctrl on Windows/Linux, Cmd on macOS
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()

        document.getElementById('custom-search-input')?.focus()

        if (!isSearching) {
          setIsSearching(true)
        } else {
          setIsSearching(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className={cn(
        'fixed right-[3dvw] top-0 flex w-full max-w-[55dvh] translate-y-[-15dvh] flex-col gap-2 rounded-lg border border-zinc-700 bg-background p-3 shadow-md transition-all duration-500',
        {
          'z-50 translate-y-[3dvh]': isSearching,
        },
      )}
    >
      <Label htmlFor="custom-search-input">{`Search for Clients${matches.length > 0 ? ': "found ' + matches.length + ' Clients"' : ''}`}</Label>
      <div className="flex w-full items-center gap-2">
        <Input
          id="custom-search-input"
          type="search"
          autoComplete="off"
          autoCorrect="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter client name..."
          className="h-10 flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
        />
        <Button
          onClick={onPrevClick}
          variant="outline"
          className="inline-flex size-7 items-center justify-center border-none hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={isPreviousDisabled}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          onClick={onNextClick}
          variant="outline"
          className="inline-flex size-7 items-center justify-center border-none hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={isNextDisabled}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            setSearchQuery('')
            setIsSearching(false)
          }}
          variant="outline"
          className="inline-flex size-7 items-center justify-center border-none hover:opacity-85"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default SearchInput
