"use client"

import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import { MagnifyingGlass } from "@medusajs/icons"
import { Drawer } from "@medusajs/ui"
import type { SearchClient } from "instantsearch.js"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Configure, InstantSearch } from "react-instantsearch"

import SearchPanel from "./panel"

const HITS_PER_PAGE = 12

const Search = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close the panel when a hit navigates, matching the cart drawer.
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          aria-label="Search for products"
          title="Search for products"
          className="transition-fg inline-flex w-fit items-center justify-center outline-none px-3 py-1.5 rounded-full hover:bg-neutral-100"
          data-testid="nav-search-button"
        >
          <MagnifyingGlass />
        </button>
      </Drawer.Trigger>

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
            <SearchPanel onNavigate={() => setIsOpen(false)} />
          </InstantSearch>
        </div>
      </Drawer.Content>
    </Drawer>
  )
}

export default Search
