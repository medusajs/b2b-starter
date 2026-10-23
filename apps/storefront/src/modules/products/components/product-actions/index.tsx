"use client"

import { useSession } from "@/lib/context/session-context"
import { getProductsById } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"
import ProductPrice from "../product-price"
import ProductVariantsTable from "../product-variants-table"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ProductActions({
  product,
  region,
}: ProductActionsProps) {
  const { customer } = useSession()
  const customerId = customer?.id
  const [customerPrices, setCustomerPrices] = useState<{
    customerId: string
    variants: HttpTypes.StoreProductVariant[]
  } | null>(null)

  // The page is statically rendered with anonymous prices, so signed-in
  // company buyers get their customer group prices after hydration.
  useEffect(() => {
    if (!customerId) {
      return
    }

    getProductsById({ ids: [product.id], regionId: region.id })
      .then(([priced]) =>
        setCustomerPrices({
          customerId,
          variants: priced?.variants ?? [],
        })
      )
      .catch(() => {})
  }, [customerId, product.id, region.id])

  const pricedProduct: HttpTypes.StoreProduct =
    customerId && customerPrices?.customerId === customerId
      ? {
          ...product,
          variants: (product.variants ?? []).map((variant) => ({
            ...variant,
            calculated_price:
              customerPrices.variants.find((v) => v.id === variant.id)
                ?.calculated_price ?? variant.calculated_price,
          })),
        }
      : product

  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductPrice product={pricedProduct} />
        <ProductVariantsTable product={pricedProduct} region={region} />
      </div>
    </>
  )
}
