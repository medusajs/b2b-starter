"use client"

import { useSession } from "@/lib/context/session-context"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreCart } from "@medusajs/types"

export const SessionCartMismatchBanner = () => {
  const { customer, cart } = useSession()

  return customer && cart ? (
    <CartMismatchBanner customer={customer} cart={cart} />
  ) : null
}

export const SessionFreeShippingNudge = () => {
  const { cart, freeShippingPrices } = useSession()

  return cart ? (
    <FreeShippingPriceNudge
      variant="popup"
      cart={cart as StoreCart}
      freeShippingPrices={freeShippingPrices}
    />
  ) : null
}
