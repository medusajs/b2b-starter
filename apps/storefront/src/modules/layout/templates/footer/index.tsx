import { listCategories } from "@/lib/data/categories"
import { listCollections } from "@/lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import MaxxamCTA from "@/modules/layout/components/maxxam-cta"
import { ArrowUpRightOnBox } from "@medusajs/icons"

export default async function Footer() {
  const { collections } = await listCollections({
    offset: "0",
    limit: "6",
  })
  const product_categories = await listCategories({
    offset: 0,
    limit: 6,
  })

  return (
    <footer className="border-t border-ui-border-base w-full maxxam-bg-grey">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-40">
          <div>
            <LocalizedClientLink href="/" className="txt-compact-xlarge-plus text-ui-fg-subtle hover:maxxam-text-yellow uppercase" >
              Maxxam Store
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {product_categories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:maxxam-text-yellow",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:maxxam-text-yellow"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:maxxam-text-yellow"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">Support</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <a
                    href="mailto:support@maxxam.com.au"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:maxxam-text-yellow flex items-center gap-x-2"
                  >
                    Email Support <ArrowUpRightOnBox />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.maxxam.com.au/contact"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:maxxam-text-yellow flex items-center gap-x-2"
                  >
                    Contact Us
                    <ArrowUpRightOnBox />
                  </a>
                </li>
                <li>
                  <LocalizedClientLink href="/request" className="hover:maxxam-text-yellow" >
                    Submit a Request
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Maxxam Computer Systems Pty. Ltd. All rights reserved.
          </Text>
          <MaxxamCTA />
        </div>
      </div>
    </footer >
  )
}
