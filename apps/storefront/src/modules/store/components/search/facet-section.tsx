"use client"

import CircleMinus from "@/modules/common/icons/circle-minus"
import CirclePlus from "@/modules/common/icons/circle-plus"
import { Text } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { PropsWithChildren } from "react"

const FacetSection = ({
  value,
  title,
  children,
}: PropsWithChildren<{ value: string; title: string }>) => (
  <AccordionPrimitive.Item value={value} className="px-4 py-3">
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between">
        <Text className="text-sm font-medium text-neutral-950">{title}</Text>
        <div className="relative w-[18px] h-[18px]">
          <CircleMinus className="absolute inset-0 opacity-0 group-data-[state=open]:opacity-100" />
          <CirclePlus className="absolute inset-0 opacity-100 group-data-[state=open]:opacity-0" />
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
    <AccordionPrimitive.Content className="radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open pt-3">
      {children}
    </AccordionPrimitive.Content>
  </AccordionPrimitive.Item>
)

export default FacetSection
