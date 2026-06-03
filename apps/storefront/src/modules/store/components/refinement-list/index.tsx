"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import { Container } from "@medusajs/ui"
import SearchInResults from "./search-in-results"
import { HttpTypes } from "@medusajs/types"
import CategoryList from "./category-list"
import OptionsPicker from "./options-picker"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
  productOptions?: HttpTypes.StoreProductOption[]
  hideOptionsPicker?: boolean
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
  productOptions,
  hideOptionsPicker,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      params.delete("page")

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentSearch = searchParams.toString()
    const currentUrl = currentSearch
      ? `${pathname}?${currentSearch}`
      : pathname
    if (nextUrl === currentUrl) return
    router.push(nextUrl)
  }

  return (
    <div className="flex flex-col divide-neutral-200 small:w-1/5 w-full gap-3">
      <Container className="flex flex-col divide-y divide-neutral-200 p-0 w-full">
        <SearchInResults listName={listName} />
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      </Container>
      {categories && (
        <CategoryList
          categories={categories}
          currentCategory={currentCategory}
        />
      )}
      {!hideOptionsPicker && productOptions && productOptions.length > 0 && (
        <OptionsPicker options={productOptions} />
      )}
    </div>
  )
}

export default RefinementList
