"use client"

import CheckboxWithLabel from "@/modules/common/components/checkbox"
import { Text } from "@medusajs/ui"
import { useToggleRefinement } from "react-instantsearch"

import FacetSection from "./facet-section"

export const ON_SALE_ATTRIBUTE = "on_sale"

const OnSaleFacet = () => {
  const { value, refine } = useToggleRefinement({
    attribute: ON_SALE_ATTRIBUTE,
    on: true,
  })

  return (
    <FacetSection value={ON_SALE_ATTRIBUTE} title="Offers">
      <div className="flex items-center justify-between gap-x-2">
        <CheckboxWithLabel
          label="On sale"
          checked={value.isRefined}
          onChange={() => refine(value)}
          data-testid="facet-on-sale"
        />
        {typeof value.onFacetValue?.count === "number" && (
          <Text className="text-xs text-neutral-500 tabular-nums">
            {value.onFacetValue.count}
          </Text>
        )}
      </div>
    </FacetSection>
  )
}

export default OnSaleFacet
