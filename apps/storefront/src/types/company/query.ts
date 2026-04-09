import { HttpTypes } from "@medusajs/types"
import { QueryApprovalSettings } from "../approval/query"
import { ModuleCompany, ModuleEmployee } from "./module"

export type QueryEmployee = ModuleEmployee & {
  customer: HttpTypes.StoreCustomer
  company?: QueryCompany
}

export type QueryCompany = ModuleCompany & {
  employees?: QueryEmployee[]
  approval_settings?: QueryApprovalSettings
}
