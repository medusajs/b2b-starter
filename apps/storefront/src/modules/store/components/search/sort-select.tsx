"use client"

import { PRODUCT_INDEX_NAME } from "@/lib/search-client"
import { ChevronUpDown } from "@medusajs/icons"
import { useSortBy } from "react-instantsearch"

export const SORT_ITEMS = [
  { value: PRODUCT_INDEX_NAME, label: "Relevance" },
  {
    value: `${PRODUCT_INDEX_NAME}/sort/created_at:desc`,
    label: "Latest Arrivals",
  },
  {
    value: `${PRODUCT_INDEX_NAME}/sort/min_price:asc`,
    label: "Price: Low -> High",
  },
  {
    value: `${PRODUCT_INDEX_NAME}/sort/min_price:desc`,
    label: "Price: High -> Low",
  },
]

const SortSelect = () => {
  const { currentRefinement, options, refine } = useSortBy({
    items: SORT_ITEMS,
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
