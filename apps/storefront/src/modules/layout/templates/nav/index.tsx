import { SEARCH_PRICE_CURRENCIES } from "@/lib/search-client"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import LogoIcon from "@/modules/common/icons/logo"
import { MegaMenuWrapper } from "@/modules/layout/components/mega-menu"
import NavSessionActions from "@/modules/layout/components/nav-session-actions"
import Search from "@/modules/layout/components/search"
import SkeletonMegaMenu from "@/modules/skeletons/components/skeleton-mega-menu"
import { Suspense } from "react"

export async function NavigationHeader({
  currencyCode = SEARCH_PRICE_CURRENCIES[0],
}: {
  currencyCode?: string
}) {
  return (
    <div className="sticky top-0 inset-x-0 group bg-white text-zinc-900 small:p-4 p-2 text-sm border-b duration-200 border-ui-border-base z-50">
      <header className="flex w-full content-container relative small:mx-auto justify-between">
        <div className="small:mx-auto flex justify-between items-center min-w-full">
          <div className="flex items-center small:space-x-4">
            <LocalizedClientLink
              className="hover:text-ui-fg-base flex items-center w-fit"
              href="/"
            >
              <span className="small:text-base text-sm font-medium flex items-center">
                <LogoIcon className="inline mr-2" />
                Medusa B2B Starter
              </span>
            </LocalizedClientLink>

            <nav>
              <ul className="space-x-4 hidden small:flex">
                <li>
                  <Suspense fallback={<SkeletonMegaMenu />}>
                    <MegaMenuWrapper />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex justify-end items-center gap-2">
            <Search currencyCode={currencyCode} />

            <div className="h-4 w-px bg-neutral-300" />

            <NavSessionActions />
          </div>
        </div>
      </header>
    </div>
  )
}
