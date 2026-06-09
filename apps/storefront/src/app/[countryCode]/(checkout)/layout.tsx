import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import MedusaCTA from "@/modules/layout/components/medusa-cta"
import Image from "next/image"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink className="hover:opacity-80" href="/">
            <Image
              src="/benzs-logo.png"
              alt="Benz's Fish"
              width={277}
              height={164}
              priority
              className="h-10 w-auto"
            />
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative bg-neutral-100" data-testid="checkout-container">
        {children}
      </div>
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}
