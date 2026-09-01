"use client"

import useSearchSettled from "@/lib/hooks/use-search-settled"
import type { ProductHit } from "@/modules/layout/components/search/hit"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import { Container, Text } from "@medusajs/ui"
import { useHits, useInstantSearch, useStats } from "react-instantsearch"

import ProductHitCard from "./product-hit-card"
import SearchPagination from "./search-pagination"

const SearchResults = () => {
  const { items } = useHits<ProductHit>()
  const { nbHits } = useStats()
  const { status, error } = useInstantSearch()
  const { isSettled } = useSearchSettled()

  if (status === "error") {
    const errorStatus = (error as unknown as { status?: number } | undefined)
      ?.status

    return (
      <Container className="flex flex-col gap-2 text-center text-sm">
        <Text className="text-ui-fg-error font-medium">
          Couldn&apos;t load products{errorStatus ? ` (${errorStatus})` : ""}
        </Text>
        {error?.message && (
          <Text className="text-ui-fg-error text-xs break-words">
            {error.message}
          </Text>
        )}
      </Container>
    )
  }

  if (!items.length && !isSettled) {
    return <SkeletonProductGrid />
  }

  return (
    <div className="flex flex-col gap-4">
      <Text className="text-sm text-neutral-500" data-testid="product-count">
        {nbHits} {nbHits === 1 ? "product" : "products"}
      </Text>

      {items.length === 0 ? (
        <Container className="text-center text-sm text-neutral-500">
          No products match these filters.
        </Container>
      ) : (
        <ul
          className="grid grid-cols-1 w-full small:grid-cols-3 medium:grid-cols-4 gap-3"
          data-testid="products-list"
        >
          {items.map((hit) => (
            <li key={hit.objectID}>
              <ProductHitCard hit={hit} />
            </li>
          ))}
        </ul>
      )}

      <SearchPagination />
    </div>
  )
}

export default SearchResults
