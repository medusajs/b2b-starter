import SearchStoreTemplate from "@/modules/store/templates/search-store"
import { Metadata } from "next"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

export default function StorePage() {
  return <SearchStoreTemplate />
}
