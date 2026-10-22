"use server"

import { getRegionPolicies } from "@/lib/util/store-policies"
import { getRegion } from "./regions"

export const getStorePolicies = async (countryCode: string) => {
  const region = await getRegion(countryCode.toLowerCase())

  return {
    current: getRegionPolicies(region),
    currencyCode: region?.currency_code ?? "",
  }
}
