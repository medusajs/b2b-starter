"use client"

import { CartProvider } from "@/lib/context/cart-context"
import { useSession } from "@/lib/context/session-context"
import CartDrawer from "@/modules/cart/components/cart-drawer"

export default function CartButton() {
  const { cart, customer, freeShippingPrices, refreshSession } = useSession()

  return (
    <CartProvider cart={cart} onCartUpdated={refreshSession}>
      <CartDrawer customer={customer} freeShippingPrices={freeShippingPrices} />
    </CartProvider>
  )
}
