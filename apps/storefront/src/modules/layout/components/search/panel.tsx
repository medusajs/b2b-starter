"use client"

import { useIntersection } from "@/lib/hooks/use-in-view"
import useSearchSettled from "@/lib/hooks/use-search-settled"
import Spinner from "@/modules/common/icons/spinner"
import { MagnifyingGlass } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  useInfiniteHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"

import SearchHit, { ProductHit } from "./hit"

const DEBOUNCE_MS = 250

const SearchPanel = ({ onNavigate }: { onNavigate: () => void }) => {
  const timer = useRef<number | undefined>(undefined)

  const queryHook = useCallback(
    (nextQuery: string, search: (value: string) => void) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => search(nextQuery), DEBOUNCE_MS)
    },
    []
  )

  const { query, refine } = useSearchBox({ queryHook })
  const { items, isLastPage, showMore } = useInfiniteHits<ProductHit>()
  const { status, error } = useInstantSearch()
  const { isSettled } = useSearchSettled()

  const [inputValue, setInputValue] = useState(query)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Infinite scroll: load the next page once the sentinel below the list is
  // near the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const sentinelInView = useIntersection(sentinelRef, "200px")

  useEffect(() => {
    if (sentinelInView && !isLastPage && isSettled) {
      showMore()
    }
  }, [sentinelInView, isLastPage, isSettled, showMore])

  const hasInput = Boolean(inputValue.trim())
  // True while the debounce timer is still pending, so the UI reads as busy
  // before InstantSearch itself does.
  const isPending = inputValue.trim() !== query.trim()
  const hasResults = items.length > 0
  const errorStatus = (error as unknown as { status?: number } | undefined)
    ?.status

  const renderBody = () => {
    if (!hasInput) {
      return (
        <Text
          className="p-6 text-center text-neutral-500 text-sm"
          data-testid="search-idle"
        >
          Start typing to search for products.
        </Text>
      )
    }

    if (status === "error") {
      return (
        <div
          className="p-6 flex flex-col gap-y-1 text-center text-ui-fg-error text-sm"
          data-testid="search-error"
        >
          <Text className="text-ui-fg-error font-medium">
            Couldn&apos;t search products
            {errorStatus ? ` (${errorStatus})` : ""}
          </Text>
          {error?.message && (
            <Text className="text-ui-fg-error text-xs break-words">
              {error.message}
            </Text>
          )}
        </div>
      )
    }

    // Nothing has come back for this query yet, so there is nothing truthful to
    // show but the spinner.
    if (!hasResults && (isPending || !isSettled)) {
      return (
        <div
          className="p-6 flex items-center justify-center text-neutral-500"
          data-testid="search-loading"
        >
          <Spinner />
        </div>
      )
    }

    if (!hasResults) {
      return (
        <Text
          className="p-6 text-center text-neutral-500 text-sm"
          data-testid="search-no-results"
        >
          No products found for &quot;{query}&quot;.
        </Text>
      )
    }

    return (
      <div className="flex flex-col gap-y-4">
        <ul className="flex flex-col" data-testid="search-results">
          {items.map((hit) => (
            <SearchHit key={hit.objectID} hit={hit} onNavigate={onNavigate} />
          ))}
        </ul>

        <div ref={sentinelRef} className="flex justify-center py-2">
          {/* The previous page's hits stay rendered above while this spins. */}
          {!isLastPage && (isPending || !isSettled) && (
            <span className="text-neutral-500">
              <Spinner />
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-x-3 border-b border-neutral-200 px-4">
        <MagnifyingGlass className="shrink-0 text-neutral-500" />
        <input
          type="search"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
            refine(event.target.value)
          }}
          placeholder="Search for products"
          aria-label="Search for products"
          autoFocus
          className="w-full bg-transparent py-4 text-sm text-zinc-900 outline-none placeholder:text-neutral-500"
          data-testid="search-input"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">{renderBody()}</div>
    </div>
  )
}

export default SearchPanel
