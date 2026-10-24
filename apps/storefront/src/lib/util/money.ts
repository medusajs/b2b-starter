import { isEmpty } from "@/lib/util/isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

const LOCALE_BY_CURRENCY: Record<string, string> = {
  try: "tr-TR",
}

export const localeForCurrency = (currency_code: string) =>
  LOCALE_BY_CURRENCY[currency_code?.toLowerCase()] ?? "en-US"

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: ConvertToLocaleParams) => {
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale ?? localeForCurrency(currency_code), {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}
