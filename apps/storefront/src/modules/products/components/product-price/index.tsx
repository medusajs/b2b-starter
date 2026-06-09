import { clx, Text } from "@medusajs/ui"
import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  if (!cheapestPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex items-baseline gap-3">
      <span
        className={clx("flex items-baseline gap-2", {
          "text-ui-fg-interactive": cheapestPrice.price_type === "sale",
        })}
      >
        <Text
          className="font-serif font-medium text-3xl text-benzs-red"
          data-testid="product-price"
          data-value={cheapestPrice.calculated_price_number}
        >
          {cheapestPrice.calculated_price}
        </Text>
        <Text className="text-benzs-ink/40 text-xs uppercase tracking-wider">
          per case
        </Text>
      </span>
      {cheapestPrice.price_type === "sale" && (
        <p
          className="line-through text-benzs-ink/40"
          data-testid="original-product-price"
          data-value={cheapestPrice.original_price_number}
        >
          {cheapestPrice.original_price}
        </p>
      )}
    </div>
  )
}
