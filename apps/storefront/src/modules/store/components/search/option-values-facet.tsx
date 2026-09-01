"use client"

import { Text, clx } from "@medusajs/ui"
import { useMemo } from "react"
import { useRefinementList } from "react-instantsearch"

import FacetSection from "./facet-section"

export const OPTION_VALUES_ATTRIBUTE = "option_values"

const OPTION_VALUES_LIMIT = 200

type OptionGroup = {
  title: string
  values: { value: string; label: string; count: number; isRefined: boolean }[]
}

const splitOptionValue = (raw: string) => {
  const separatorIndex = raw.indexOf(":")

  if (separatorIndex <= 0) {
    return undefined
  }

  return {
    title: raw.slice(0, separatorIndex),
    label: raw.slice(separatorIndex + 1),
  }
}

const OptionValuesFacet = () => {
  const { items, refine } = useRefinementList({
    attribute: OPTION_VALUES_ATTRIBUTE,
    limit: OPTION_VALUES_LIMIT,
    sortBy: ["name:asc"],
  })

  const groups = useMemo(() => {
    const byTitle = new Map<string, OptionGroup>()

    for (const item of items) {
      const parsed = splitOptionValue(item.value)

      // A value the index wrote without an option title has no group to sit in.
      if (!parsed) {
        continue
      }

      const group = byTitle.get(parsed.title) ?? {
        title: parsed.title,
        values: [],
      }

      group.values.push({
        value: item.value,
        label: parsed.label,
        count: item.count,
        isRefined: item.isRefined,
      })
      byTitle.set(parsed.title, group)
    }

    return Array.from(byTitle.values())
  }, [items])

  return (
    <FacetSection value={OPTION_VALUES_ATTRIBUTE} title="Options">
      {groups.length === 0 ? (
        <Text className="text-xs text-neutral-500">
          No options for the current results.
        </Text>
      ) : (
        <div className="flex flex-col gap-y-4">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-y-2">
              <Text className="text-xs font-medium text-neutral-600">
                {group.title}
              </Text>
              <div className="flex flex-wrap gap-2">
                {group.values.map((value) => (
                  <button
                    key={value.value}
                    type="button"
                    onClick={() => refine(value.value)}
                    aria-pressed={value.isRefined}
                    className={clx(
                      "px-3 py-1 text-xs rounded-full border transition-colors",
                      value.isRefined
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                    )}
                    data-testid={`facet-option-${value.value}`}
                  >
                    {value.label}
                    <span className="ml-1.5 tabular-nums opacity-70">
                      {value.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </FacetSection>
  )
}

export default OptionValuesFacet
