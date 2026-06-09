"use client"

import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { StoreProduct, StoreRegion } from "@medusajs/types"
import { useState } from "react"

const AddToCartLink = ({
  product,
  region,
}: {
  product: StoreProduct
  region: StoreRegion
}) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!product?.variants?.[0]?.id) return

    setIsAdding(true)
    addToCartEventBus.emitCartAdd({
      lineItems: [
        {
          productVariant: {
            ...product.variants[0],
            product,
          },
          quantity: 1,
        },
      ],
      regionId: region.id,
    })
    setTimeout(() => setIsAdding(false), 600)
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="text-benzs-red text-xs font-semibold uppercase tracking-wider hover:text-benzs-ink transition-colors disabled:opacity-50"
    >
      {isAdding ? "Added ✓" : "Add to Cart →"}
    </button>
  )
}

export default AddToCartLink
