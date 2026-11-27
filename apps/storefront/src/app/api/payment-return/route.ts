import { sdk } from "@/lib/config"
import { submitAdyenPayment } from "@/lib/data/adyen"
import { placeOrder } from "@/lib/data/cart"
import { getAuthHeaders, setCartId } from "@/lib/data/cookies"
import { HttpTypes } from "@medusajs/types"
import { unstable_rethrow } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

// Adyen and Stripe return the customer here after a redirect, for example to their bank's
// authentication page or to iDEAL, to place the order.
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl

  const cartId = searchParams.get("cart_id")
  const countryCode = searchParams.get("country_code")
  const redirectResult = searchParams.get("redirectResult")
  const paymentIntent = searchParams.get("payment_intent")
  const paymentIntentClientSecret = searchParams.get(
    "payment_intent_client_secret"
  )

  const prefix = countryCode ? `/${countryCode}` : ""
  const backToReview = NextResponse.redirect(
    `${origin}${prefix}/checkout?step=review`
  )

  if (cartId && redirectResult) {
    await setCartId(cartId)

    try {
      // Redirects to the order confirmation once the payment is authorized.
      await submitAdyenPayment({ details: { redirectResult } }, cartId)
    } catch (error) {
      unstable_rethrow(error)
    }

    return backToReview
  }

  if (!cartId || !paymentIntent || !paymentIntentClientSecret) {
    return backToReview
  }

  const cart = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      method: "GET",
      query: { fields: "payment_collection.payment_sessions.data" },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    })
    .then(({ cart }) => cart)
    .catch(() => null)

  // Only places the order for the cart that the payment belongs to.
  const paymentSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => session.data?.id === paymentIntent
  )

  if (
    !paymentSession ||
    paymentSession.data?.client_secret !== paymentIntentClientSecret
  ) {
    return backToReview
  }

  await setCartId(cartId)

  // The customer backed out or the bank declined, so they pick a payment method again.
  if (searchParams.get("redirect_status") === "failed") {
    return NextResponse.redirect(`${origin}${prefix}/checkout?step=payment`)
  }

  try {
    // Redirects to the order confirmation once the order is placed.
    await placeOrder(cartId)
  } catch (error) {
    unstable_rethrow(error)
  }

  return backToReview
}
