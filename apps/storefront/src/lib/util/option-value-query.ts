export const OPTION_VALUE_QUERY_KEY = "optionValueIds"

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined
  | null

const dedupe = (values: string[]): string[] => Array.from(new Set(values))

export const parseOptionValueIds = (input: SearchParamsLike): string[] => {
  if (!input) return []

  if (input instanceof URLSearchParams) {
    const all = input.getAll(OPTION_VALUE_QUERY_KEY)
    if (all.length > 1) return dedupe(all.filter(Boolean))
    if (all.length === 1) {
      return dedupe(
        all[0]
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      )
    }
    return []
  }

  const raw = (input as Record<string, string | string[] | undefined>)[
    OPTION_VALUE_QUERY_KEY
  ]
  if (!raw) return []
  if (Array.isArray(raw)) return dedupe(raw.filter(Boolean))
  return dedupe(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  )
}
