import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ProductPreview from "@/modules/products/components/product-preview"
import { ArrowRight } from "@medusajs/icons"

export default async function FeaturedProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 8 },
  })

  if (!products?.length) {
    return null
  }

  return (
    <section className="bg-benzs-cream">
      <div className="content-container py-16 small:py-24">
        <div className="flex flex-col small:flex-row small:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold mb-3">
              Our Products
            </p>
            <h2 className="font-serif text-benzs-ink text-4xl small:text-5xl font-medium leading-tight">
              A full line of kosher favorites.
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="group inline-flex items-center gap-2 text-benzs-ink font-semibold hover:text-benzs-red transition-colors shrink-0"
          >
            View all products
            <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
          </LocalizedClientLink>
        </div>

        <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
