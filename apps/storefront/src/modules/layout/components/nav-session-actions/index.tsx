"use client"

import { useSession } from "@/lib/context/session-context"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import FilePlus from "@/modules/common/icons/file-plus"
import { RequestQuoteConfirmation } from "@/modules/quotes/components/request-quote-confirmation"
import { RequestQuotePrompt } from "@/modules/quotes/components/request-quote-prompt"

const QuoteButton = () => (
  <button className="flex gap-1.5 items-center rounded-2xl bg-none shadow-none border-none hover:bg-neutral-100 px-2 py-1">
    <FilePlus />
    <span className="hidden small:inline-block">Quote</span>
  </button>
)

export default function NavSessionActions() {
  const { customer, cart } = useSession()

  return (
    <>
      {customer && cart?.items && cart.items.length > 0 ? (
        <RequestQuoteConfirmation>
          <QuoteButton />
        </RequestQuoteConfirmation>
      ) : (
        <RequestQuotePrompt>
          <QuoteButton />
        </RequestQuotePrompt>
      )}

      <AccountButton customer={customer} />

      <CartButton />
    </>
  )
}
