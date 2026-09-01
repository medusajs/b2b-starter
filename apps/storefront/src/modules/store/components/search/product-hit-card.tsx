"use client"

import { convertToLocale } from "@/lib/util/money"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import type { ProductHit } from "@/modules/layout/components/search/hit"
import Thumbnail from "@/modules/products/components/thumbnail"
import { Text, clx } from "@medusajs/ui"

const ProductHitCard = ({ hit }: { hit: ProductHit }) => {
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
    <LocalizedClientLink href={`/products/${hit.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="flex flex-col gap-4 relative aspect-[3/5] w-full overflow-hidden p-4 bg-white shadow-borders-base rounded-lg group-hover:shadow-[0_0_0_4px_rgba(0,0,0,0.1)] transition-shadow ease-in-out duration-150"
      >
        <div className="w-full h-full p-10">
          <Thumbnail thumbnail={hit.thumbnail} size="square" />
        </div>

        <div className="flex flex-col txt-compact-medium">
          <Text className="text-ui-fg-base" data-testid="product-title">
            {hit.title}
          </Text>
        </div>

        {hasPrice && (
          <div className="flex flex-col gap-0">
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
                className={clx("text-neutral-950 font-medium", {
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
            <Text className="text-neutral-600 text-[0.6rem]">Excl. VAT</Text>
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default ProductHitCard
