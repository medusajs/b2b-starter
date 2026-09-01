"use client"

import CheckboxWithLabel from "@/modules/common/components/checkbox"
import { Text } from "@medusajs/ui"
import { useRefinementList } from "react-instantsearch"

import FacetSection from "./facet-section"

type CheckboxFacetProps = {
  attribute: string
  title: string
  limit?: number
  showMoreLimit?: number
}

const CheckboxFacet = ({
  attribute,
  title,
  limit = 8,
  showMoreLimit = 30,
}: CheckboxFacetProps) => {
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } =
    useRefinementList({
      attribute,
      limit,
      showMore: true,
      showMoreLimit,
      sortBy: ["count:desc", "name:asc"],
    })

  return (
    <FacetSection value={attribute} title={title}>
      {items.length === 0 ? (
        <Text className="text-xs text-neutral-500">
          No values for the current results.
        </Text>
      ) : (
        <div className="flex flex-col gap-y-2">
          {items.map((item) => (
            <div
              key={item.value}
              className="flex items-center justify-between gap-x-2"
            >
              <CheckboxWithLabel
                label={item.label}
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                data-testid={`facet-${attribute}-${item.value}`}
              />
              <Text className="text-xs text-neutral-500 tabular-nums">
                {item.count}
              </Text>
            </div>
          ))}

          {canToggleShowMore && (
            <button
              type="button"
              onClick={toggleShowMore}
              className="self-start text-xs text-neutral-600 underline hover:text-neutral-900"
            >
              {isShowingMore ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </FacetSection>
  )
}

export default CheckboxFacet
