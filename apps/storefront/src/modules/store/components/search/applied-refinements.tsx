"use client"

import { indexedCurrency, priceAttribute } from "@/lib/search-client"
import { convertToLocale } from "@/lib/util/money"
import { XMark } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import type { CurrentRefinementsConnectorParamsItem } from "instantsearch.js/es/connectors/current-refinements/connectCurrentRefinements"
import { useClearRefinements, useCurrentRefinements } from "react-instantsearch"

const OPTION_VALUES_ATTRIBUTE = "option_values"

const chipClassName =
  "flex items-center gap-x-1 rounded-full bg-white border border-neutral-200 px-3 py-1 text-xs text-neutral-700 transition-colors hover:border-neutral-400"

const priceLabelFor = (
  item: CurrentRefinementsConnectorParamsItem | undefined,
  currencyCode: string
) => {
  if (!item) {
    return undefined
  }

  const format = (amount: number) =>
    convertToLocale({
      amount,
      currency_code: indexedCurrency(currencyCode),
    })

  const min = item.refinements.find((r) => r.operator === ">=")?.value
  const max = item.refinements.find((r) => r.operator === "<=")?.value

  if (typeof min === "number" && typeof max === "number") {
    return `Price ${format(min)} - ${format(max)}`
  }

  if (typeof max === "number") {
    return `Price up to ${format(max)}`
  }

  if (typeof min === "number") {
    return `Price from ${format(min)}`
  }

  return undefined
}

/**
 * The price chip clears both edges at once. Removing them one refinement at a
 * time would run a search per edge and leave a half-applied range on screen in
 * between.
 */
const PriceChip = ({
  label,
  attribute,
}: {
  label: string
  attribute: string
}) => {
  const { refine } = useClearRefinements({
    includedAttributes: [attribute],
  })

  return (
    <button
      type="button"
      onClick={refine}
      className={chipClassName}
      data-testid={`remove-refinement-${attribute}`}
    >
      {label}
      <XMark className="w-3 h-3" />
    </button>
  )
}

/**
 * Label for one value refinement. Option values arrive as `"Size:S"`, and the
 * on/off facet's own value reads as `"true"`.
 */
const toLabel = (attribute: string, label: string) => {
  if (attribute === OPTION_VALUES_ATTRIBUTE) {
    const separatorIndex = label.indexOf(":")
    return separatorIndex > 0 ? label.slice(separatorIndex + 1) : label
  }

  if (attribute.startsWith("on_sale_")) {
    return "On sale"
  }

  return label
}

/**
 * The applied filters, each removable on its own, plus a single control that
 * clears them all. Both read from the same refinement state the facets write
 * to, so removing one here re-runs the search rather than hiding hits.
 */
const AppliedRefinements = ({ currencyCode }: { currencyCode: string }) => {
  const { items } = useCurrentRefinements()
  const { canRefine, refine: clearAll } = useClearRefinements()

  const priceAttributeName = priceAttribute("min_price", currencyCode)
  const priceItem = items.find((item) => item.attribute === priceAttributeName)
  const priceLabel = priceLabelFor(priceItem, currencyCode)

  if (!canRefine) {
    return null
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="applied-refinements"
    >
      <Text className="text-xs text-neutral-500">Filters:</Text>

      {priceLabel && (
        <PriceChip label={priceLabel} attribute={priceAttributeName} />
      )}

      {items
        .filter((item) => item.attribute !== priceAttributeName)
        .flatMap((item) =>
          item.refinements.map((refinement) => (
            <button
              key={`${item.attribute}-${refinement.label}`}
              type="button"
              onClick={() => item.refine(refinement)}
              className={chipClassName}
              data-testid={`remove-refinement-${item.attribute}`}
            >
              {toLabel(item.attribute, refinement.label)}
              <XMark className="w-3 h-3" />
            </button>
          ))
        )}

      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-neutral-600 underline hover:text-neutral-900"
        data-testid="clear-refinements"
      >
        Clear all
      </button>
    </div>
  )
}

export default AppliedRefinements
