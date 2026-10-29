"use client"

import {
  getMedusaPaymentsAccount,
  isMedusaPayments,
  isPaypal,
  isStripeLike,
} from "@/lib/constants"
import { B2BCart } from "@/types"
import { PayPalScriptProvider } from "@paypal/react-paypal-js"
import { loadStripe, Stripe } from "@stripe/stripe-js"
import React, { createContext } from "react"
import StripeWrapper from "./stripe-wrapper"

type WrapperProps = {
  cart: B2BCart
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const medusaPaymentsKey =
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

// loadStripe should only be called once per configuration, so we cache the promises.
const stripePromises = new Map<string, Promise<Stripe | null>>()

const getStripePromise = (key: string, stripeAccount?: string) => {
  const cacheKey = `${key}:${stripeAccount ?? ""}`
  if (!stripePromises.has(cacheKey)) {
    stripePromises.set(
      cacheKey,
      loadStripe(key, stripeAccount ? { stripeAccount } : undefined)
    )
  }

  return stripePromises.get(cacheKey)!
}

const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

const Wrapper: React.FC<WrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // Medusa Payments creates the payment on the account's Stripe connected account,
  // so Stripe.js needs to be initialized for that account.
  const key = isMedusaPayments(paymentSession?.provider_id)
    ? medusaPaymentsKey
    : stripeKey
  const stripePromise = key
    ? getStripePromise(key, getMedusaPaymentsAccount(paymentSession))
    : null

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeContext.Provider value={true}>
        <StripeWrapper
          paymentSession={paymentSession}
          stripeKey={key}
          stripePromise={stripePromise}
        >
          {children}
        </StripeWrapper>
      </StripeContext.Provider>
    )
  }

  if (
    isPaypal(paymentSession?.provider_id) &&
    paypalClientId !== undefined &&
    cart
  ) {
    return (
      <PayPalScriptProvider
        options={{
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
          currency: cart?.currency_code.toUpperCase(),
          intent: "authorize",
          components: "buttons",
        }}
      >
        {children}
      </PayPalScriptProvider>
    )
  }

  return <div>{children}</div>
}

export default Wrapper
