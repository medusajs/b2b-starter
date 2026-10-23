"use server"

import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { B2BCart, B2BCustomer } from "@/types/global"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"

export type StorefrontSession = {
  customer: B2BCustomer | null
  cart: B2BCart | null
  freeShippingPrices: StoreFreeShippingPrice[]
}

export const retrieveSession = async (): Promise<StorefrontSession> => {
  const [customer, cart] = await Promise.all([
    retrieveCustomer().catch(() => null),
    retrieveCart(),
  ])
  const freeShippingPrices = cart
    ? await listCartFreeShippingPrices(cart.id)
    : []

  return { customer, cart, freeShippingPrices }
}
