"use client"

import { Container } from "@medusajs/ui"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

import CheckboxFacet from "./checkbox-facet"
import OnSaleFacet, { ON_SALE_ATTRIBUTE } from "./on-sale-facet"
import OptionValuesFacet, {
  OPTION_VALUES_ATTRIBUTE,
} from "./option-values-facet"
import PriceRangeFacet, { PRICE_ATTRIBUTE } from "./price-range-facet"
import SortSelect from "./sort-select"

const CATEGORY_ATTRIBUTE = "category"
const LABELS_ATTRIBUTE = "labels"

/**
 * The store sidebar: the sort control and one section per facet. There is no
 * query box here — the store list is the unfiltered index, which the adapter
 * returns for an empty query. Product search lives in the navbar drawer.
 *
 * Every field here is declared `facetable()` on the product search index —
 * `category`, `labels` and `option_values` as value facets, `min_price_<currency>`
 * as a stats facet, and `on_sale_<currency>` as a boolean. The price facets are
 * per currency, so the region's currency picks which set is refined on.
 *
 * Nothing that protects data belongs here. The published-status and sales
 * channel filters are applied by the core `/store/search` route, where the
 * client cannot drop them.
 */
const SearchRefinements = ({ currencyCode }: { currencyCode: string }) => (
  <div className="flex flex-col divide-neutral-200 small:w-1/5 w-full gap-3">
    <Container className="p-0 w-full">
      <SortSelect currencyCode={currencyCode} />
    </Container>

    <Container className="p-0">
      <AccordionPrimitive.Root
        type="multiple"
        defaultValue={[
          PRICE_ATTRIBUTE,
          ON_SALE_ATTRIBUTE,
          CATEGORY_ATTRIBUTE,
          OPTION_VALUES_ATTRIBUTE,
        ]}
        className="divide-y divide-neutral-200"
      >
        <PriceRangeFacet currencyCode={currencyCode} />
        <OnSaleFacet currencyCode={currencyCode} />
        <CheckboxFacet attribute={CATEGORY_ATTRIBUTE} title="Categories" />
        <OptionValuesFacet />
        <CheckboxFacet attribute={LABELS_ATTRIBUTE} title="Labels" />
      </AccordionPrimitive.Root>
    </Container>
  </div>
)

export default SearchRefinements
