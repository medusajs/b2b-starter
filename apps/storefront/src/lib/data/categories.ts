"use server"

import { sdk } from "@/lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listCategories = async (
  query?: Record<string, any>
): Promise<HttpTypes.StoreProductCategory[]> => {
  const next = {
    ...(await getCacheOptions("categories")),
  }

  const limit = query?.limit || 100

  const { product_categories, count } = await sdk.client.fetch<{
    product_categories: HttpTypes.StoreProductCategory[]
    count?: number
  }>("/store/product-categories", {
    query: {
      fields:
        "*category_children, *products, *parent_category, *parent_category.parent_category",
      limit,
      ...query,
    },
    next,
  })

  if (
    query?.limit !== undefined ||
    query?.offset !== undefined ||
    typeof count !== "number" ||
    count <= product_categories.length
  ) {
    return product_categories
  }

  const allCategories = [...product_categories]
  let offset = product_categories.length

  while (offset < count) {
    const { product_categories: nextBatch } = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      query: {
        fields:
          "*category_children, *products, *parent_category, *parent_category.parent_category",
        limit,
        offset,
        ...query,
      },
      next,
    })

    if (!nextBatch.length) {
      break
    }

    allCategories.push(...nextBatch)
    offset += nextBatch.length
  }

  return allCategories
}

export const getCategoryByHandle = async (
  categoryHandle: string[]
): Promise<HttpTypes.StoreProductCategory> => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category",
          handle,
        },
        next,
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
