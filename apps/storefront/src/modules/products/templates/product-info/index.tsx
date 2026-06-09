import { HttpTypes } from "@medusajs/types"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const category = product.categories?.[0]?.name

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3 w-full">
        {category && (
          <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold">
            {category}
          </p>
        )}
        <h1
          className="font-serif text-4xl small:text-5xl leading-[1.1] font-medium text-benzs-ink"
          data-testid="product-title"
        >
          {product.title}
        </h1>

        {product.subtitle && (
          <p
            className="text-lg text-benzs-ink/60 whitespace-pre-line"
            data-testid="product-description"
          >
            {product.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
