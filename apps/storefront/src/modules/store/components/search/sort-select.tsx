"use client"

import { PRODUCT_INDEX_NAME, priceAttribute } from "@/lib/search-client"
import { ChevronUpDown } from "@medusajs/icons"
import { useSortBy } from "react-instantsearch"

export const getSortItems = (currencyCode: string) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [
    { value: PRODUCT_INDEX_NAME, label: "Relevance" },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
      label: "Latest Arrivals",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:asc`,
      label: "Price: Low -> High",
    },
    {
      value: `${PRODUCT_INDEX_NAME}/sort/${minPrice}:desc`,
      label: "Price: High -> Low",
    },
  ]
}

const SortSelect = ({ currencyCode }: { currencyCode: string }) => {
  const { currentRefinement, options, refine } = useSortBy({
    items: getSortItems(currencyCode),
  })

  return (
    <div className="flex items-center gap-2 text-sm p-2 justify-between">
      <span className="text-neutral-500">Sort by:</span>
      <div className="relative">
        <select
          className="w-full pr-8 overflow-hidden focus:outline-none appearance-none"
          title="Sort by"
          value={currentRefinement}
          onChange={(event) => refine(event.target.value)}
          data-testid="sort-by-container"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronUpDown className="w-4 h-4 text-neutral-500" />
        </div>
      </div>
    </div>
  )
}

export default SortSelect
