import Bancontact from "@/modules/common/icons/bancontact"
import FilePlus from "@/modules/common/icons/file-plus"
import Ideal from "@/modules/common/icons/ideal"
import PayPal from "@/modules/common/icons/paypal"
import { CreditCard } from "@medusajs/icons"
import React from "react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Pay by invoice",
    icon: <FilePlus />,
  },
  // Add more payment providers here
}

/*
 * Medusa Payments registers one provider per payment account, with the ID
 * `pp_medusa-payments_{account}`, where `{account}` is the Medusa Cloud payment account ID.
 */
const MEDUSA_PAYMENTS_PREFIX = "pp_medusa-payments_"

const medusaPaymentsInfo = {
  title: "Credit card",
  icon: <CreditCard />,
}

export const getPaymentInfo = (providerId?: string) => {
  if (!providerId) {
    return undefined
  }

  if (isMedusaPayments(providerId)) {
    return medusaPaymentsInfo
  }

  return paymentInfoMap[providerId]
}

export const isMedusaPayments = (providerId?: string) => {
  return !!providerId?.startsWith(MEDUSA_PAYMENTS_PREFIX)
}

// Medusa Payments returns the Stripe account that holds the payment, which Stripe.js has to be initialized with.
// It isn't derived from the provider ID, as non-production environments take payments with a sandbox account.
export const getMedusaPaymentsAccount = (paymentSession?: {
  provider_id: string
  data?: Record<string, unknown>
}) => {
  const account = paymentSession?.data?.stripe_account
  return isMedusaPayments(paymentSession?.provider_id) &&
    typeof account === "string"
    ? account
    : undefined
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return providerId?.startsWith("pp_stripe") || isMedusaPayments(providerId)
}

// Stripe and Medusa Payments take card details with the card element.
export const isCardPayment = (providerId?: string) => {
  return providerId === "pp_stripe_stripe" || isMedusaPayments(providerId)
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

export const currencySymbolMap: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  cad: "C$",
  aud: "A$",
  jpy: "¥",
  cny: "¥",
  chf: "CHF",
  hkd: "HK$",
  nzd: "NZ$",
  sek: "kr",
  krw: "₩",
  sgd: "S$",
  nok: "kr",
  mxn: "$",
  inr: "₹",
  rub: "₽",
  zar: "R",
  try: "₺",
  brl: "R$",
  twd: "NT$",
  dkk: "kr",
  pln: "zł",
  thb: "฿",
  idr: "Rp",
  huf: "Ft",
  czk: "Kč",
  ils: "₪",
  clp: "$",
  php: "₱",
  aed: "د.إ",
  cop: "$",
  sar: "﷼",
  myr: "RM",
  ron: "lei",
  vnd: "₫",
  egp: "£",
  pkr: "₨",
  ngn: "₦",
  bdt: "৳",
  uah: "₴",
  kes: "KSh",
  ars: "$",
  qar: "﷼",
  kwd: "د.ك",
  omr: "﷼",
  bhd: "ب.د",
  lkr: "₨",
  mmk: "K",
  uzs: "лв",
}
