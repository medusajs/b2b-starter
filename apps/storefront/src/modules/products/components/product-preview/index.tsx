import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import AddToCartLink from "./add-to-cart-link"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  const subtitle =
    product.subtitle || product.categories?.[0]?.name || undefined

  const description = product.description?.split(". ")[0]

  return (
    <div className="group flex flex-col h-full">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="block"
      >
        <div
          data-testid="product-wrapper"
          className="relative aspect-square w-full overflow-hidden rounded-lg bg-white border border-black/5 p-6 transition-shadow duration-200 group-hover:shadow-xl"
        >
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
            isFeatured={isFeatured}
          />
        </div>
      </LocalizedClientLink>

      <div className="mt-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="block"
          >
            <h3
              className="font-serif text-lg text-benzs-ink leading-snug group-hover:text-benzs-red transition-colors"
              data-testid="product-title"
            >
              {product.title}
            </h3>
          </LocalizedClientLink>
          {cheapestPrice && (
            <span
              className="text-benzs-red font-semibold whitespace-nowrap text-sm pt-1"
              data-testid="price"
            >
              {cheapestPrice.calculated_price}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[0.7rem] uppercase tracking-wider text-benzs-ink/50 mt-1">
            {subtitle}
          </p>
        )}

        {description && (
          <p className="text-sm text-benzs-ink/60 leading-relaxed mt-2 line-clamp-2">
            {description}.
          </p>
        )}

        <div className="mt-3 pt-1">
          <AddToCartLink product={product} region={region} />
        </div>
      </div>
    </div>
  )
}
