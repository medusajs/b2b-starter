import { getBaseURL } from "@/lib/util/env"
import { Toaster } from "@medusajs/ui"
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans"
import { Playfair_Display } from "next/font/google"
import { Metadata } from "next"
import "@/styles/globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Benz's Fish — Wholesale Kosher Fish & Groceries",
    template: "%s | Benz's Fish",
  },
  description:
    "Benz's Food Products Inc. — kosher fresh & frozen fish and groceries, wholesale to restaurants, caterers, hospitals and schools since 1976.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="light"
      className={`${GeistSans.variable} ${playfair.variable}`}
    >
      <body>
        <main className="relative">{props.children}</main>
        <Toaster className="z-[99999]" position="bottom-left" />
        <Analytics />
      </body>
    </html>
  )
}
