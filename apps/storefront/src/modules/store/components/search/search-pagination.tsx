"use client"

import { clx } from "@medusajs/ui"
import { usePagination } from "react-instantsearch"

const SearchPagination = () => {
  const { pages, currentRefinement, nbPages, refine, isFirstPage, isLastPage } =
    usePagination({ padding: 2 })

  if (nbPages <= 1) {
    return null
  }

  const pageButton = (page: number, label: string | number) => {
    const isCurrent = page === currentRefinement

    return (
      <button
        key={`page-${page}`}
        type="button"
        className={clx("txt-xlarge-plus text-ui-fg-muted", {
          "text-ui-fg-base hover:text-ui-fg-subtle": isCurrent,
        })}
        disabled={isCurrent}
        onClick={() => refine(page)}
      >
        {label}
      </button>
    )
  }

  const ellipsis = (key: string) => (
    <span
      key={key}
      className="txt-xlarge-plus text-ui-fg-muted items-center cursor-default"
    >
      ...
    </span>
  )

  const showsFirst = pages.includes(0)
  const showsLast = pages.includes(nbPages - 1)

  return (
    <div className="flex justify-center w-full mt-12">
      <div className="flex gap-3 items-end" data-testid="product-pagination">
        {!isFirstPage && (
          <button
            type="button"
            className="txt-xlarge-plus text-ui-fg-muted"
            onClick={() => refine(currentRefinement - 1)}
          >
            &lsaquo;
          </button>
        )}

        {!showsFirst && pageButton(0, 1)}
        {!showsFirst && !pages.includes(1) && ellipsis("ellipsis-start")}

        {pages.map((page) => pageButton(page, page + 1))}

        {!showsLast && !pages.includes(nbPages - 2) && ellipsis("ellipsis-end")}
        {!showsLast && pageButton(nbPages - 1, nbPages)}

        {!isLastPage && (
          <button
            type="button"
            className="txt-xlarge-plus text-ui-fg-muted"
            onClick={() => refine(currentRefinement + 1)}
          >
            &rsaquo;
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchPagination
