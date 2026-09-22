"use client"

import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import {
  hitPricing,
  type ProductHit,
} from "@/modules/layout/components/search/hit"
import Thumbnail from "@/modules/products/components/thumbnail"
import { Text, clx } from "@medusajs/ui"

const ProductHitCard = ({
  hit,
  currencyCode,
}: {
  hit: ProductHit
  currencyCode: string
}) => {
  // Without a handle there's no product page to link to.
  if (!hit.handle) {
    return null
  }

  const pricing = hitPricing(hit, currencyCode)
  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code: pricing.currency_code })

  const max = pricing.max_price ?? pricing.min_price
  const isRange = pricing.min_price !== null && (max ?? 0) > pricing.min_price

  return (
    <LocalizedClientLink href={`/products/${hit.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="flex flex-col gap-4 relative aspect-[3/5] w-full overflow-hidden p-4 bg-white shadow-borders-base rounded-lg group-hover:shadow-[0_0_0_4px_rgba(0,0,0,0.1)] transition-shadow ease-in-out duration-150"
      >
        <div className="w-full h-full p-10">
          <Thumbnail thumbnail={hit.thumbnail as string | null} size="square" />
        </div>

        <div className="flex flex-col txt-compact-medium">
          <Text className="text-ui-fg-base" data-testid="product-title">
            {hit.title}
          </Text>
        </div>

        {pricing.min_price !== null && (
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-x-2">
              {/* A range already spans the discount, so the struck-through
                  original would describe only the cheapest variant. */}
              {!isRange && pricing.on_sale && (
                <Text className="line-through text-ui-fg-muted text-xs">
                  {format(pricing.original_price!)}
                </Text>
              )}
              <Text
                className={clx("text-neutral-950 font-medium", {
                  "text-ui-fg-interactive": pricing.on_sale,
                })}
              >
                {isRange
                  ? `${format(pricing.min_price)} - ${format(max!)}`
                  : format(pricing.min_price)}
              </Text>
              {!isRange && pricing.on_sale && (
                <Text className="text-xs text-ui-fg-interactive">
                  -{pricing.discount_percentage}%
                </Text>
              )}
            </div>
            <Text className="text-neutral-600 text-[0.6rem]">Excl. VAT</Text>
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default ProductHitCard
