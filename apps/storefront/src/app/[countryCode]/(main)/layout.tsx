import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getBaseURL } from "@/lib/util/env"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { StoreCart } from "@medusajs/types"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  let freeShippingPrices: StoreFreeShippingPrice[] = []

  if (cart) {
    freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  }

  return (
    <>
      <NavigationHeader />
      <div className="bg-benzs-navy text-neutral-50 text-sm">
        <div className="content-container flex flex-col small:flex-row items-center justify-between gap-2 small:gap-4 py-2.5 text-center">
          <span className="font-medium">
            Kosher Fresh &amp; Frozen Fish &amp; Groceries — Wholesale since 1976
            <span className="hidden medium:inline">
              {" "}· call{" "}
              <a href="tel:+17187783329" className="font-semibold hover:underline">
                718-778-3329
              </a>
            </span>
          </span>
          <a
            href="/benzs-product-catalog.pdf"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-benzs-red hover:bg-benzs-red/90 text-white font-semibold uppercase tracking-wider text-xs px-4 py-1.5 rounded-full transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
              <path d="M11 3h2v8h3l-4 4-4-4h3V3Zm-6 14h14v2H5v-2Z" />
            </svg>
            Download Catalog (PDF)
          </a>
        </div>
      </div>

      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {props.children}

      <Footer />

      {cart && freeShippingPrices && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart as StoreCart}
          freeShippingPrices={freeShippingPrices}
        />
      )}
    </>
  )
}
