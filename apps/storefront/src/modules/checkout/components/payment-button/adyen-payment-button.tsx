"use client"

import "@adyen/adyen-web/styles/adyen.css"

import type {
  AdditionalDetailsActions,
  PaymentAction,
  PaymentMethodsResponse,
  ResultCode,
  SubmitActions,
} from "@adyen/adyen-web"
import { isAdyen } from "@/lib/constants"
import { AdyenPaymentResult, submitAdyenPayment } from "@/lib/data/adyen"
import { B2BCart } from "@/types"
import Button from "@/modules/common/components/button"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import ErrorMessage from "@/modules/checkout/components/error-message"

const clientKey = process.env.NEXT_PUBLIC_ADYEN_CLIENT_KEY
const environment =
  process.env.NEXT_PUBLIC_ADYEN_ENVIRONMENT === "live" ? "live" : "test"

type AdyenPaymentButtonProps = {
  cart: B2BCart
  notReady: boolean
  "data-testid"?: string
}

// Renders Adyen's Drop-in, whose pay button places the order. The session's data holds the
// payment methods Drop-in offers, which are cards, Apple Pay, and Google Pay.
const AdyenPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: AdyenPaymentButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { countryCode } = useParams()

  const session = cart.payment_collection?.payment_sessions?.find((s) =>
    isAdyen(s.provider_id)
  )

  useEffect(() => {
    if (!session || notReady || !clientKey || !containerRef.current) {
      return
    }

    let cancelled = false
    let unmount: (() => void) | undefined

    const handleResult = (
      result: AdyenPaymentResult,
      actions: SubmitActions | AdditionalDetailsActions
    ) => {
      if ("action" in result) {
        actions.resolve({
          resultCode: result.resultCode as ResultCode,
          action: result.action as unknown as PaymentAction,
        })
        return
      }

      setErrorMessage(result.error)
      actions.reject()
    }

    const mount = async () => {
      const { AdyenCheckout, Dropin, Card, ApplePay, GooglePay } = await import(
        "@adyen/adyen-web"
      )

      const checkout = await AdyenCheckout({
        clientKey,
        environment,
        locale: "en-US",
        countryCode: cart.billing_address?.country_code?.toUpperCase(),
        amount: {
          value: session.data?.amount as number,
          currency: session.data?.currency as string,
        },
        paymentMethodsResponse: session.data
          ?.payment_methods as PaymentMethodsResponse,
        onSubmit: async (state, _component, actions) => {
          setErrorMessage(null)
          handleResult(
            await submitAdyenPayment({
              payment_method: state.data.paymentMethod,
              browser_info: state.data.browserInfo,
              store_payment_method: state.data.storePaymentMethod,
              origin: window.location.origin,
              // Used when the shopper's bank redirects them for authentication.
              return_url: `${window.location.origin}/api/payment-return?cart_id=${cart.id}&country_code=${countryCode}`,
            }),
            actions
          )
        },
        onAdditionalDetails: async (state, _component, actions) => {
          handleResult(
            await submitAdyenPayment({ details: state.data.details }),
            actions
          )
        },
        onError: (error) => {
          // Closing a wallet's payment sheet isn't an error worth showing.
          if (error.name !== "CANCEL") {
            setErrorMessage("Could not process the payment. Please try again.")
          }
        },
      })

      if (cancelled || !containerRef.current) {
        return
      }

      const dropin = new Dropin(checkout, {
        paymentMethodComponents: [Card, ApplePay, GooglePay],
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            // Saving cards needs an account holder, which only logged-in customers have.
            enableStoreDetails: !!session.data?.shopper_reference,
          },
        },
      }).mount(containerRef.current)

      unmount = () => dropin.unmount()
    }

    mount().catch(() => {
      setErrorMessage("Could not load the payment methods.")
    })

    return () => {
      cancelled = true
      unmount?.()
    }
    // Drop-in is mounted once per session, so the shopper's input isn't lost when the cart refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, notReady])

  if (notReady) {
    return (
      <Button className="w-full" disabled size="large" data-testid={dataTestId}>
        Place order
      </Button>
    )
  }

  return (
    <>
      <div ref={containerRef} data-testid={dataTestId} />
      <ErrorMessage
        error={
          clientKey
            ? errorMessage
            : "Adyen client key is missing. Set the NEXT_PUBLIC_ADYEN_CLIENT_KEY environment variable."
        }
        data-testid="adyen-payment-error-message"
      />
    </>
  )
}

export default AdyenPaymentButton
