"use client"

import { useInstantSearch } from "react-instantsearch"

const useSearchSettled = () => {
  const { status, results } = useInstantSearch()

  const isSearching = status !== "idle" && status !== "error"
  const hasNoResultsYet = Boolean(
    (results as unknown as { __isArtificial?: boolean } | undefined)
      ?.__isArtificial
  )

  return {
    isSearching,
    hasNoResultsYet,
    isSettled: !isSearching && !hasNoResultsYet,
  }
}

export default useSearchSettled
