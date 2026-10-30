import { submitAdyenPayment } from "@/lib/data/adyen"
import { setCartId } from "@/lib/data/cookies"
import { unstable_rethrow } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

// Adyen returns the shopper here after a redirect, for example to their bank's
// authentication page, with the result to submit to the payment session.
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl

  const cartId = searchParams.get("cart_id")
  const countryCode = searchParams.get("country_code")
  const redirectResult = searchParams.get("redirectResult")

  const prefix = countryCode ? `/${countryCode}` : ""

  if (cartId && redirectResult) {
    await setCartId(cartId)

    try {
      // Redirects to the order confirmation once the payment is authorized.
      await submitAdyenPayment({ details: { redirectResult } }, cartId)
    } catch (error) {
      unstable_rethrow(error)
    }
  }

  return NextResponse.redirect(`${origin}${prefix}/checkout?step=review`)
}
