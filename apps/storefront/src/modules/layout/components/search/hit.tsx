"use client"

import { indexedCurrency, priceAttribute } from "@/lib/search-client"
import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "@/modules/products/components/thumbnail"
import { Text, clx } from "@medusajs/ui"
import type { Hit as HitType } from "instantsearch.js"

/**
 * The price fields are per currency, e.g. `min_price_eur`, so they're read
 * through `priceAttribute` rather than declared one by one.
 */
export type ProductHit = HitType<
  {
    title: string | null
    handle: string | null
    thumbnail: string | null
  } & Record<string, unknown>
>

const amount = (value: unknown) => (typeof value === "number" ? value : null)

export const hitPricing = (hit: ProductHit, currencyCode: string) => {
  const min_price = amount(hit[priceAttribute("min_price", currencyCode)])
  const original_price = amount(
    hit[priceAttribute("original_price", currencyCode)]
  )
  const on_sale =
    hit[priceAttribute("on_sale", currencyCode)] === true &&
    original_price !== null &&
    min_price !== null &&
    original_price > min_price

  return {
    currency_code: indexedCurrency(currencyCode),
    min_price,
    max_price: amount(hit[priceAttribute("max_price", currencyCode)]),
    original_price,
    on_sale,
    // The index dropped the precomputed percentage when it went per-currency.
    discount_percentage: on_sale
      ? Math.round(((original_price! - min_price!) / original_price!) * 100)
      : 0,
  }
}

type SearchHitProps = {
  hit: ProductHit
  currencyCode: string
  onNavigate?: () => void
}

const SearchHit = ({ hit, currencyCode, onNavigate }: SearchHitProps) => {
  // Without a handle there's no product page to link to.
  if (!hit.handle) {
    return null
  }

  const pricing = hitPricing(hit, currencyCode)
  const onSale = pricing.on_sale

  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code: pricing.currency_code })

  return (
    <li>
      <LocalizedClientLink
        href={`/products/${hit.handle}`}
        onClick={onNavigate}
        className="flex items-center gap-x-4 p-3 rounded-lg hover:bg-neutral-100"
        data-testid="search-hit-link"
      >
        <div className="w-16 shrink-0">
          <Thumbnail
            thumbnail={hit.thumbnail as string | null}
            size="square"
            type="preview"
          />
        </div>

        <div className="flex flex-col gap-y-1 min-w-0">
          <Text
            className="text-ui-fg-base line-clamp-2"
            data-testid="search-hit-title"
          >
            {hit.title}
          </Text>

          {pricing.min_price !== null && (
            <div className="flex items-center gap-x-2">
              {onSale && (
                <Text className="line-through text-ui-fg-muted text-xs">
                  {format(pricing.original_price!)}
                </Text>
              )}
              <Text
                className={clx("text-neutral-950 font-medium text-sm", {
                  "text-ui-fg-interactive": onSale,
                })}
              >
                {format(pricing.min_price)}
              </Text>
            </div>
          )}
        </div>
      </LocalizedClientLink>
    </li>
  )
}

export default SearchHit
