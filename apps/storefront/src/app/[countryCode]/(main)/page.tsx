import FeaturedProducts from "@/modules/home/components/featured-products"
import Hero from "@/modules/home/components/hero"
import TrustStrip from "@/modules/home/components/trust-strip"
import Story from "@/modules/home/components/story"
import WholesaleCta from "@/modules/home/components/wholesale-cta"
import SkeletonFeaturedProducts from "@/modules/skeletons/templates/skeleton-featured-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Benz's Fish — Wholesale Kosher Fish & Groceries",
  description:
    "Kosher fresh & frozen fish, classic gefilte, and pantry staples — wholesale to restaurants, caterers, hospitals and schools since 1976.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  return (
    <>
      <Hero />
      <TrustStrip />
      <Suspense fallback={<SkeletonFeaturedProducts />}>
        <FeaturedProducts countryCode={countryCode} />
      </Suspense>
      <Story />
      <WholesaleCta />
    </>
  )
}
