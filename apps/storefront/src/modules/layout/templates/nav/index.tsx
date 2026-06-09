import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import { Suspense } from "react"
import Image from "next/image"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Products", href: "/store" },
  { label: "Recipes", href: "/recipes" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Contact Us", href: "/contact" },
]

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="sticky top-0 inset-x-0 z-50 bg-benzs-cream/95 backdrop-blur border-b border-black/10">
      <header className="content-container flex items-center justify-between h-28 gap-4">
        {/* Logo with the jumping fish leaping through the middle, like the old site */}
        <LocalizedClientLink
          href="/"
          className="relative block hover:opacity-80 shrink-0"
        >
          <Image
            src="/benzs-logo.png"
            alt="Benz's Fish"
            width={277}
            height={164}
            priority
            className="h-24 w-auto"
          />
          <img
            src="/benzs-jumping-fish.gif"
            alt=""
            aria-hidden
            className="absolute left-[55%] top-[45%] -translate-x-1/2 -translate-y-1/2 h-16 w-auto pointer-events-none"
          />
        </LocalizedClientLink>

        {/* Center nav */}
        <nav className="hidden medium:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <LocalizedClientLink
              key={l.href}
              href={l.href}
              className="text-benzs-ink text-sm font-medium uppercase tracking-wide hover:text-benzs-red transition-colors"
            >
              {l.label}
            </LocalizedClientLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-benzs-ink">
            <Suspense fallback={<SkeletonAccountButton />}>
              <AccountButton customer={customer} />
            </Suspense>
            <Suspense fallback={<SkeletonCartButton />}>
              <CartButton />
            </Suspense>
          </div>
          <LocalizedClientLink
            href="/store"
            className="bg-benzs-ink text-white px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-benzs-navy transition-colors"
          >
            Shop Now
          </LocalizedClientLink>
        </div>
      </header>
    </div>
  )
}
