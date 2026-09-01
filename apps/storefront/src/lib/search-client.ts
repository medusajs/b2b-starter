import {
  createInstantSearchAdapter,
  type MedusaSdkLike,
} from "@medusajs/instantsearch-adapter"

import { sdk } from "@/lib/config"

export const PRODUCT_INDEX_NAME = "product"

const NUMERIC_ATTRIBUTES = ["min_price"]

export const { searchClient } = createInstantSearchAdapter({
  sdk: sdk as unknown as MedusaSdkLike,
  path: "/store/search",
  numericAttributes: NUMERIC_ATTRIBUTES,
})
