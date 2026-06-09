import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import SquareMinus from "@/modules/common/icons/square-minus"
import SquarePlus from "@/modules/common/icons/square-plus"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const CategoryList = ({
  categories,
  currentCategory,
}: {
  categories: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
}) => {
  const getCategoriesToExpand = useCallback(
    (category: HttpTypes.StoreProductCategory) => {
      const categoriesToExpand = [category.id]
      let current = category
      while (current.parent_category_id) {
        categoriesToExpand.push(current.parent_category_id)
        current = categories.find(
          (cat) => cat.id === current.parent_category_id
        ) as HttpTypes.StoreProductCategory
      }
      return categoriesToExpand
    },
    [categories]
  )

  const [expandedCategories, setExpandedCategories] = useState<string[]>(() =>
    currentCategory ? getCategoriesToExpand(currentCategory) : []
  )

  const pathname = usePathname()

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const searchParams = useSearchParams()

  const isCurrentCategory = (handle: string) =>
    pathname.split("/").slice(2).join("/") === `categories/${handle}`

  useEffect(() => {
    if (currentCategory) {
      const categoriesToExpand = getCategoriesToExpand(currentCategory)
      setExpandedCategories((prev) => {
        const newCategories = categoriesToExpand.filter(
          (cat) => !prev.includes(cat)
        )
        return newCategories.length ? [...prev, ...newCategories] : prev
      })
    }
  }, [currentCategory, getCategoriesToExpand])

  const getCategoryMarginLeft = useCallback(
    (category: HttpTypes.StoreProductCategory) => {
      let level = 0
      let currentCategory = category
      while (currentCategory.parent_category_id) {
        level++
        currentCategory = categories.find(
          (cat) => cat.id === currentCategory.parent_category_id
        ) as HttpTypes.StoreProductCategory
      }
      return level * 4
    },
    [categories]
  )

  const renderCategory = (category: HttpTypes.StoreProductCategory) => {
    const hasChildren = category.category_children.length > 0
    const isExpanded = expandedCategories.includes(category.id)
    const active = isCurrentCategory(category.handle)

    const linkClasses = clx(
      "flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors text-start",
      active
        ? "bg-benzs-red/10 text-benzs-red font-semibold"
        : "text-benzs-ink/70 hover:bg-black/[0.04] hover:text-benzs-red"
    )
    const href = `/categories/${category.handle}${
      searchParams.size ? `?${searchParams.toString()}` : ""
    }`

    return (
      <li key={category.id}>
        {hasChildren ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleCategory(category.id)}
              className="text-benzs-ink/40 hover:text-benzs-ink"
              aria-label="Toggle subcategories"
            >
              {isExpanded ? (
                <SquareMinus className="h-3.5" />
              ) : (
                <SquarePlus className="h-3.5" />
              )}
            </button>
            <LocalizedClientLink href={href} className={clx(linkClasses, "flex-1")}>
              <span>{category.name}</span>
              <span className="text-benzs-ink/40">
                {category.products?.length}
              </span>
            </LocalizedClientLink>
          </div>
        ) : (
          <LocalizedClientLink href={href} className={linkClasses}>
            <span>{category.name}</span>
            <span
              className={active ? "text-benzs-red" : "text-benzs-ink/40"}
            >
              {category.products?.length}
            </span>
          </LocalizedClientLink>
        )}
        {hasChildren && isExpanded && (
          <ul className="ml-4">
            {category.category_children.map((childId) => {
              const childCategory = categories.find(
                (cat) => cat.id === childId.id
              )
              return childCategory ? renderCategory(childCategory) : null
            })}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="bg-white border border-black/5 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b border-black/5">
        <h3 className="font-serif text-lg text-benzs-ink">Categories</h3>
        {pathname.includes("/categories") && (
          <LocalizedClientLink
            href="/store"
            className="text-xs text-benzs-red hover:underline"
          >
            Clear
          </LocalizedClientLink>
        )}
      </div>
      <ul className="flex flex-col gap-0.5 text-sm p-2">
        {categories
          .filter((cat) => cat.parent_category_id === null)
          .map(renderCategory)}
      </ul>
    </div>
  )
}

export default CategoryList
