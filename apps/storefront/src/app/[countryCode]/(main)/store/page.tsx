import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1

  const categories = await listCategories()
  const customer = await retrieveCustomer()

  return (
    <div className="bg-benzs-cream min-h-screen">
      <div className="content-container pt-12 pb-2">
        <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold mb-3">
          The Collection
        </p>
        <h1 className="font-serif text-benzs-ink text-4xl small:text-5xl font-medium leading-tight">
          Our products.
        </h1>
        <p className="text-benzs-ink/70 text-base mt-3 max-w-2xl leading-relaxed">
          A full line of fresh and frozen kosher fish, classic gefilte, and
          pantry staples — each held to the strictest supervision.
        </p>
      </div>
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList sortBy={sort} categories={categories} />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={params.countryCode}
                customer={customer}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
;``
