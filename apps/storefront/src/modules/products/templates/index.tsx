import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductFacts from "../components/product-facts"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const category = product.categories?.[0]

  return (
    <div className="bg-benzs-cream">
      <div className="content-container pt-8 pb-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-benzs-ink/50 mb-8 flex items-center gap-2">
          <LocalizedClientLink href="/store" className="hover:text-benzs-red">
            Our Products
          </LocalizedClientLink>
          {category && (
            <>
              <span>/</span>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className="hover:text-benzs-red"
              >
                {category.name}
              </LocalizedClientLink>
            </>
          )}
          <span>/</span>
          <span className="text-benzs-ink/70">{product.title}</span>
        </nav>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start"
          data-testid="product-container"
        >
          <ImageGallery product={product} />
          <div className="flex flex-col gap-6">
            <ProductInfo product={product} />
            <Suspense
              fallback={<ProductActions product={product} region={region} />}
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
            <ProductFacts product={product} />

            {product.description && (
              <div className="border-t border-black/10 pt-6">
                <h2 className="font-serif text-2xl text-benzs-ink mb-3">
                  Description
                </h2>
                <p className="text-benzs-ink/70 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="content-container pb-20"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
