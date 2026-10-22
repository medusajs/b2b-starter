import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { getProductByHandle } from "@/lib/data/products"
import { getRegion, listRegions } from "@/lib/data/regions"
import { isVariantInStock } from "@/lib/util/inventory"
import {
  buildProductStructuredData,
  getPricedVariants,
  toJsonLd,
} from "@/lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@/lib/util/site"
import ProductTemplate from "@/modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamicParams = true

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const { products } = await sdk.store.product.list(
      { fields: "handle" },
      { next: { tags: ["products"] }, ...(await getAuthHeaders()) }
    )

    return countryCodes
      .map((countryCode) =>
        products.map((product) => ({
          countryCode,
          handle: product.handle,
        }))
      )
      .flat()
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const path = `/products/${product.handle}`
  const productUrl = `${origin}/${params.countryCode}${path}`
  const description = product.description || product.title

  return {
    title: `${product.title} | ${STORE_NAME}`,
    description,
    alternates: {
      canonical: productUrl,
      languages: Object.fromEntries(
        listCountryCodes(regions).map((code) => [
          `en-${code.toUpperCase()}`,
          `${origin}/${code}${path}`,
        ])
      ),
      types: { "text/markdown": `${productUrl}.md` },
    },
    openGraph: {
      title: `${product.title} | ${STORE_NAME}`,
      description,
      url: productUrl,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

const ProductMetaTags = ({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) => {
  const variants = getPricedVariants(product)
  const cheapest = variants.reduce<HttpTypes.StoreProductVariant | undefined>(
    (min, v) =>
      !min ||
      v.calculated_price!.calculated_amount! <
        min.calculated_price!.calculated_amount!
        ? v
        : min,
    undefined
  )
  const currency = region.currency_code.toUpperCase()
  const amount = cheapest?.calculated_price?.calculated_amount?.toFixed(2)

  return (
    <>
      <meta property="og:type" content="product" />
      {amount && (
        <>
          <meta property="product:price:amount" content={amount} />
          <meta property="product:price:currency" content={currency} />
          <meta property="og:price:amount" content={amount} />
          <meta property="og:price:currency" content={currency} />
        </>
      )}
      <meta
        property="product:availability"
        content={variants.some(isVariantInStock) ? "in stock" : "out of stock"}
      />
    </>
  )
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(params.handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  const origin = await getSiteOrigin()
  const structuredData = buildProductStructuredData({
    product: pricedProduct,
    region,
    countryCode: params.countryCode,
    productUrl: `${origin}/${params.countryCode}/products/${pricedProduct.handle}`,
  })

  return (
    <>
      <ProductMetaTags product={pricedProduct} region={region} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}
