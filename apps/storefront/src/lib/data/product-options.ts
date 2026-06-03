"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { HttpTypes } from "@medusajs/types"

export const listGlobalProductOptions = async (): Promise<
  HttpTypes.StoreProductOption[]
> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("product-options")),
  }

  return sdk.client
    .fetch<{ product_options: HttpTypes.StoreProductOption[] }>(
      `/store/product-options`,
      {
        credentials: "include",
        method: "GET",
        query: {
          is_exclusive: false,
          fields: "*values",
          limit: 100,
        },
        headers,
        next,
      }
    )
    .then(({ product_options }) => product_options)
}
