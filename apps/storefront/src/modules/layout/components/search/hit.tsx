"use client"

import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "@/modules/products/components/thumbnail"
import { Text, clx } from "@medusajs/ui"
import type { Hit as HitType } from "instantsearch.js"

export type ProductHit = HitType<{
  title: string | null
  handle: string | null
  thumbnail: string | null
  currency_code?: string | null
  min_price?: number | null
  original_price?: number | null
  on_sale?: boolean | null
  discount_percentage?: number | null
}>

type SearchHitProps = {
  hit: ProductHit
  onNavigate?: () => void
}

const SearchHit = ({ hit, onNavigate }: SearchHitProps) => {
  // Without a handle there's no product page to link to.
  if (!hit.handle) {
    return null
  }

  const currencyCode = hit.currency_code ?? undefined
  const hasPrice = typeof hit.min_price === "number" && Boolean(currencyCode)
  const onSale =
    Boolean(hit.on_sale) &&
    typeof hit.original_price === "number" &&
    hit.original_price > (hit.min_price ?? 0)

  return (
    <li>
      <LocalizedClientLink
        href={`/products/${hit.handle}`}
        onClick={onNavigate}
        className="flex items-center gap-x-4 p-3 rounded-lg hover:bg-neutral-100"
        data-testid="search-hit-link"
      >
        <div className="w-16 shrink-0">
          <Thumbnail thumbnail={hit.thumbnail} size="square" type="preview" />
        </div>

        <div className="flex flex-col gap-y-1 min-w-0">
          <Text
            className="text-ui-fg-base line-clamp-2"
            data-testid="search-hit-title"
          >
            {hit.title}
          </Text>

          {hasPrice && (
            <div className="flex items-center gap-x-2">
              {onSale && (
                <Text className="line-through text-ui-fg-muted text-xs">
                  {convertToLocale({
                    amount: hit.original_price!,
                    currency_code: currencyCode!,
                  })}
                </Text>
              )}
              <Text
                className={clx("text-neutral-950 font-medium text-sm", {
                  "text-ui-fg-interactive": onSale,
                })}
              >
                {convertToLocale({
                  amount: hit.min_price!,
                  currency_code: currencyCode!,
                })}
              </Text>
              {onSale && Boolean(hit.discount_percentage) && (
                <Text className="text-xs text-ui-fg-interactive">
                  -{hit.discount_percentage}%
                </Text>
              )}
            </div>
          )}
        </div>
      </LocalizedClientLink>
    </li>
  )
}

export default SearchHit
