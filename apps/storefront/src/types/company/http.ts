import { ModuleCompanySpendingLimitResetFrequency } from "./module"
import { QueryCompany, QueryEmployee } from "./query"

export type StoreCompanyResponse = {
  company: QueryCompany
}

export type StoreCompaniesResponse = {
  companies: QueryCompany[]
}

export type StoreEmployeeResponse = {
  employee: QueryEmployee
}

export type StoreCreateCompany = {
  name: string
  email: string
  currency_code: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  logo_url?: string | null
  spending_limit_reset_frequency?: ModuleCompanySpendingLimitResetFrequency | null
}

export type StoreUpdateCompany = Partial<StoreCreateCompany> & {
  id: string
}

export type StoreCreateEmployee = {
  company_id: string
  customer_id: string
  spending_limit?: number | null
  is_admin?: boolean | null
}

export type StoreUpdateEmployee = {
  id: string
  company_id: string
  spending_limit?: number
  is_admin?: boolean
}
