"use client"

import { OPTION_VALUE_QUERY_KEY } from "@/lib/util/option-value-query"
import { HttpTypes } from "@medusajs/types"
import { Container, Text, clx } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import CircleMinus from "@/modules/common/icons/circle-minus"
import CirclePlus from "@/modules/common/icons/circle-plus"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

type OptionsPickerProps = {
  options: HttpTypes.StoreProductOption[]
}

const OptionsPicker = ({ options }: OptionsPickerProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedIds = useMemo(() => {
    const all = searchParams.getAll(OPTION_VALUE_QUERY_KEY)
    const expanded = all.flatMap((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    return new Set(expanded)
  }, [searchParams])

  const toggleValue = useCallback(
    (valueId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(OPTION_VALUE_QUERY_KEY)
      params.delete("page")

      const next = new Set(selectedIds)
      if (next.has(valueId)) {
        next.delete(valueId)
      } else {
        next.add(valueId)
      }
      next.forEach((id) => params.append(OPTION_VALUE_QUERY_KEY, id))

      const nextSearch = params.toString()
      const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname
      const currentSearch = searchParams.toString()
      const currentUrl = currentSearch ? `${pathname}?${currentSearch}` : pathname
      if (nextUrl === currentUrl) return
      router.push(nextUrl)
    },
    [pathname, router, searchParams, selectedIds]
  )

  if (!options.length) return null

  return (
    <Container className="p-0">
      <AccordionPrimitive.Root
        type="multiple"
        defaultValue={options.map((o) => o.id)}
        className="divide-y divide-neutral-200"
      >
        {options.map((option) => (
          <AccordionPrimitive.Item
            key={option.id}
            value={option.id}
            className="px-4 py-3"
          >
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between">
                <Text className="text-sm font-medium text-neutral-950">
                  {option.title}
                </Text>
                <div className="relative w-[18px] h-[18px]">
                  <CircleMinus className="absolute inset-0 opacity-0 group-data-[state=open]:opacity-100" />
                  <CirclePlus className="absolute inset-0 opacity-100 group-data-[state=open]:opacity-0" />
                </div>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open pt-3">
              <div className="flex flex-wrap gap-2">
                {option.values?.map((value) => {
                  const active = selectedIds.has(value.id)
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => toggleValue(value.id)}
                      className={clx(
                        "px-3 py-1 text-xs rounded-full border transition-colors",
                        active
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                      )}
                      aria-pressed={active}
                    >
                      {value.value}
                    </button>
                  )
                })}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </Container>
  )
}

export default OptionsPicker
