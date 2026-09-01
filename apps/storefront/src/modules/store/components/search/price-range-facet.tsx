"use client"

import { convertToLocale } from "@/lib/util/money"
import { Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { useInstantSearch, useRange } from "react-instantsearch"

import FacetSection from "./facet-section"

export const PRICE_ATTRIBUTE = "min_price"

/** The slider moves in whole currency units. */
const STEP = 1

/** Thumb diameter, in px. Shared by the CSS below and the fill-bar maths. */
const THUMB_SIZE = 16

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const PriceRangeFacet = () => {
  const { start, range, refine } = useRange({ attribute: PRICE_ATTRIBUTE })
  // Read straight off the results rather than through `useHits`, which would
  // register a second hits widget just to learn the currency.
  const { results } = useInstantSearch()

  const minInputRef = useRef<HTMLInputElement>(null)
  const maxInputRef = useRef<HTMLInputElement>(null)

  // An unset edge arrives as -Infinity / Infinity: no bound on that side.
  const refinedMin = isNumber(start[0]) ? start[0] : undefined
  const refinedMax = isNumber(start[1]) ? start[1] : undefined
  const isRefined = refinedMin !== undefined || refinedMax !== undefined

  const hasTrack =
    isNumber(range.min) && isNumber(range.max) && range.max > range.min
  const min = hasTrack ? range.min! : 0
  const max = hasTrack ? range.max! : 0

  const refined: [number, number] = [
    refinedMin === undefined ? min : clamp(refinedMin, min, max),
    refinedMax === undefined ? max : clamp(refinedMax, min, max),
  ]

  const [dragging, setDragging] = useState<[number, number] | null>(null)
  const values = dragging ?? refined

  const commit = () => {
    setDragging(null)

    const nextMin = Number(minInputRef.current?.value)
    const nextMax = Number(maxInputRef.current?.value)

    refine([
      Number.isFinite(nextMin) && nextMin > min ? nextMin : undefined,
      Number.isFinite(nextMax) && nextMax < max ? nextMax : undefined,
    ])
  }

  const commitRef = useRef(commit)
  commitRef.current = commit

  useEffect(() => {
    const inputs = [minInputRef.current, maxInputRef.current]
    const onChange = () => commitRef.current()

    inputs.forEach((input) => input?.addEventListener("change", onChange))

    return () =>
      inputs.forEach((input) => input?.removeEventListener("change", onChange))
  }, [hasTrack])

  const reset = isRefined ? (
    <button
      type="button"
      onClick={() => {
        setDragging(null)
        refine([undefined, undefined])
      }}
      className="self-start text-xs text-neutral-600 underline hover:text-neutral-900"
      data-testid="facet-price-reset"
    >
      Reset
    </button>
  ) : null

  if (!hasTrack) {
    return (
      <FacetSection value={PRICE_ATTRIBUTE} title="Price">
        <div className="flex flex-col gap-y-2">
          <Text className="text-xs text-neutral-500">
            No price range for the current results.
          </Text>
          {reset}
        </div>
      </FacetSection>
    )
  }

  const currencyCode = (
    results?.hits as { currency_code?: string | null }[] | undefined
  )?.find((hit) => hit.currency_code)?.currency_code

  const format = (amount: number) =>
    currencyCode
      ? convertToLocale({ amount, currency_code: currencyCode })
      : String(amount)

  const ratio = (value: number) => (value - min) / (max - min)

  const thumbCenter = (value: number) =>
    `calc(${ratio(value) * 100}% + ${(0.5 - ratio(value)) * THUMB_SIZE}px)`

  const onInput = (index: 0 | 1) => (event: React.FormEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value)

    setDragging((previous) => {
      const [low, high] = previous ?? refined

      return index === 0
        ? [Math.min(value, high), high]
        : [low, Math.max(value, low)]
    })
  }

  const inputProps = {
    type: "range" as const,
    min,
    max,
    step: STEP,
    className: "price-range-input",
  }

  return (
    <FacetSection value={PRICE_ATTRIBUTE} title="Price">
      <div className="flex flex-col gap-y-3">
        <style>{PRICE_RANGE_STYLES}</style>

        <div className="flex items-center justify-between">
          <Text className="text-xs text-neutral-600 tabular-nums">
            {format(values[0])}
          </Text>
          <Text className="text-xs text-neutral-600 tabular-nums">
            {format(values[1])}
          </Text>
        </div>

        <div
          className="relative flex h-4 w-full items-center"
          data-testid="facet-price-slider"
        >
          <div className="absolute inset-x-0 h-1 rounded-full bg-neutral-200" />
          <div
            className="absolute h-1 rounded-full bg-neutral-900"
            style={{
              left: thumbCenter(values[0]),
              right: `calc(100% - ${thumbCenter(values[1])})`,
            }}
          />

          <input
            {...inputProps}
            ref={minInputRef}
            aria-label="Minimum price"
            value={values[0]}
            onInput={onInput(0)}
            onChange={onInput(0)}
            style={{ zIndex: ratio(values[0]) > 0.5 ? 2 : 1 }}
          />
          <input
            {...inputProps}
            ref={maxInputRef}
            aria-label="Maximum price"
            value={values[1]}
            onInput={onInput(1)}
            onChange={onInput(1)}
            style={{ zIndex: ratio(values[0]) > 0.5 ? 1 : 2 }}
          />
        </div>

        {reset}
      </div>
    </FacetSection>
  )
}

const PRICE_RANGE_STYLES = `
.price-range-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}
.price-range-input:focus {
  outline: none;
}
.price-range-input::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
}
.price-range-input::-moz-range-track {
  background: transparent;
  border: none;
}
.price-range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  height: ${THUMB_SIZE}px;
  width: ${THUMB_SIZE}px;
  border-radius: 9999px;
  border: 1px solid rgb(212 212 212);
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
  cursor: pointer;
}
.price-range-input::-moz-range-thumb {
  pointer-events: auto;
  box-sizing: border-box;
  height: ${THUMB_SIZE}px;
  width: ${THUMB_SIZE}px;
  border-radius: 9999px;
  border: 1px solid rgb(212 212 212);
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
  cursor: pointer;
}
.price-range-input:hover::-webkit-slider-thumb,
.price-range-input:focus-visible::-webkit-slider-thumb {
  border-color: rgb(115 115 115);
}
.price-range-input:hover::-moz-range-thumb,
.price-range-input:focus-visible::-moz-range-thumb {
  border-color: rgb(115 115 115);
}
`

export default PriceRangeFacet
