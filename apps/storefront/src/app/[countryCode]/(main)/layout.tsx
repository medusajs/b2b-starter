import { SessionProvider } from "@/lib/context/session-context"
import { getRegion } from "@/lib/data/regions"
import { retrieveSession } from "@/lib/data/session"
import { getBaseURL } from "@/lib/util/env"
import {
  SessionCartMismatchBanner,
  SessionFreeShippingNudge,
} from "@/modules/layout/components/session-banners"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import { ArrowUpRightMini, ExclamationCircleSolid } from "@medusajs/icons"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const [session, region] = await Promise.all([
    retrieveSession(),
    getRegion(countryCode),
  ])

  return (
    <SessionProvider session={session}>
      <NavigationHeader currencyCode={region?.currency_code} />
      <div className="flex items-center text-neutral-50 justify-center small:p-4 p-2 text-center bg-neutral-900 small:gap-2 gap-1 text-sm">
        <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
          <span className="flex items-center gap-1">
            <ExclamationCircleSolid className="inline" color="#A1A1AA" />
            Build your own B2B store with this starter:
          </span>

          <a
            className="group hover:text-ui-fg-interactive-hover text-ui-fg-interactive self-end small:self-auto"
            href="https://cloud.medusajs.com"
            target="_blank"
          >
            Deploy to Medusa Cloud
            <ArrowUpRightMini className="group-hover:text-ui-fg-interactive-hover inline text-ui-fg-interactive" />
          </a>
        </div>
      </div>

      <SessionCartMismatchBanner />

      {props.children}

      <Footer />

      <SessionFreeShippingNudge />
    </SessionProvider>
  )
}
