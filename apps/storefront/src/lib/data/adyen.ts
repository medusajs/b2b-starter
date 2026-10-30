"use server"

import { sdk } from "@/lib/config"
import { isAdyen } from "@/lib/constants"
import { HttpTypes } from "@medusajs/types"
import { unstable_rethrow } from "next/navigation"
import { placeOrder } from "./cart"
import { getAuthHeaders, getCartId } from "./cookies"

export type AdyenPaymentResult =
  | { resultCode: string; action: Record<string, unknown> }
  | { error: string }

const DECLINED_ERROR =
  "Your payment was declined. Please try again or use a different payment method."
const GENERIC_ERROR =
  "We couldn't process your payment. Please try again or use a different payment method."

const getAdyenSession = async (cartId: string) => {
  const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
    `/store/carts/${cartId}`,
    {
      method: "GET",
      query: {
        fields: "payment_collection.id,*payment_collection.payment_sessions",
      },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    }
  )

  const session = cart.payment_collection?.payment_sessions?.find((s) =>
    isAdyen(s.provider_id)
  )

  return session && { collectionId: cart.payment_collection!.id, session }
}

/**
 * Passes the data that Adyen's Drop-in collected to the cart's Adyen payment session,
 * then completes the cart, which redirects to the order confirmation once the payment
 * is authorized. Otherwise, returns the action Drop-in has to handle, such as a 3D
 * Secure challenge, or an error to show.
 */
export async function submitAdyenPayment(
  clientData: Record<string, unknown>,
  cartId?: string
): Promise<AdyenPaymentResult> {
  const id = cartId || (await getCartId())
  const current = id ? await getAdyenSession(id) : undefined

  if (!id || !current) {
    return { error: GENERIC_ERROR }
  }

  try {
    await sdk.store.payment.updatePaymentSession(
      current.collectionId,
      current.session.id,
      { client_data: clientData },
      {},
      { ...(await getAuthHeaders()) }
    )

    await placeOrder(id)
  } catch (error) {
    unstable_rethrow(error)
  }

  const updated = await getAdyenSession(id)
  const data = updated?.session.data

  if (updated?.session.status === "requires_more" && data?.action) {
    return {
      resultCode: data.result_code as string,
      action: data.action as Record<string, unknown>,
    }
  }

  return {
    error: updated?.session.status === "error" ? DECLINED_ERROR : GENERIC_ERROR,
  }
}
