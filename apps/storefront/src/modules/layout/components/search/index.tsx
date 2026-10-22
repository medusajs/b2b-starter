"use client"

import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import { MagnifyingGlass } from "@medusajs/icons"
import { Drawer } from "@medusajs/ui"
import type { SearchClient } from "instantsearch.js"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Configure, InstantSearch } from "react-instantsearch"

import SearchPanel from "./panel"

const HITS_PER_PAGE = 12

const Search = ({ currencyCode }: { currencyCode: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { countryCode } = useParams<{ countryCode: string }>()

  // Close the panel when a hit navigates, matching the cart drawer.
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      {/* A real link so search works without JavaScript; with JS it opens the drawer instead. */}
      <Link
        href={`/${countryCode}/search`}
        onClick={(event) => {
          event.preventDefault()
          setIsOpen(true)
        }}
        aria-label="Search for products"
        title="Search for products"
        className="transition-fg inline-flex w-fit items-center justify-center outline-none px-3 py-1.5 rounded-full hover:bg-neutral-100"
        data-testid="nav-search-button"
      >
        <MagnifyingGlass />
      </Link>

      <Drawer.Content
        className="z-50 rounded-none m-0 p-0 inset-y-0 sm:right-0"
        data-testid="search-drawer"
      >
        <Drawer.Header className="flex self-center">
          <Drawer.Title>Search products</Drawer.Title>
        </Drawer.Header>

        <div className="flex flex-col h-full overflow-hidden">
          <InstantSearch
            indexName={PRODUCT_INDEX_NAME}
            searchClient={searchClient as unknown as SearchClient}
            future={{ preserveSharedStateOnUnmount: true }}
          >
            <Configure hitsPerPage={HITS_PER_PAGE} />
            <SearchPanel
              currencyCode={currencyCode}
              onNavigate={() => setIsOpen(false)}
            />
          </InstantSearch>
        </div>
      </Drawer.Content>
    </Drawer>
  )
}

export default Search
