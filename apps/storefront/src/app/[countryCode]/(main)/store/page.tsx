import { getRegion } from "@/lib/data/regions"
import StoreTemplate from "@/modules/store/templates"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Mağaza | AKLAST",
  description:
    "AKLAST tüm lastik ve jantlar — KDV dahil TRY fiyatlarıyla listelenir.",
}

export default async function StorePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ sortBy?: string; page?: string }>
}) {
  const [{ countryCode }, { sortBy, page }] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  // Not: bu şablonda InstantSearch'ten bağımsız, /store/products üzerinden
  // çalışan ürün ızgarası kullanılır — arama indeksi yoksa liste boşa düşmez.
  return (
    <StoreTemplate
      sortBy={sortBy as SortOptions | undefined}
      page={page}
      countryCode={countryCode}
    />
  )
}
