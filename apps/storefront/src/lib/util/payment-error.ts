import type { StripeError } from "@stripe/stripe-js"

const GENERIC_PAYMENT_ERROR =
  "We couldn't process your payment. Please try again or use a different payment method."

// Only card and validation errors are meant for customers, others describe our setup, so they're logged instead.
export const getPaymentErrorMessage = (error?: Partial<StripeError> | null) => {
  if (!error) {
    return null
  }

  if (
    (error.type === "card_error" || error.type === "validation_error") &&
    error.message
  ) {
    return error.message
  }

  console.error("Payment failed", error)
  return GENERIC_PAYMENT_ERROR
}
