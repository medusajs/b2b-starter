import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const explore = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Products", href: "/store" },
  { label: "Recipes", href: "/recipes" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Contact Us", href: "/contact" },
]

export default function Footer() {
  return (
    <footer className="bg-benzs-ink text-white">
      <div className="content-container py-16">
        <div className="grid grid-cols-1 small:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="max-w-sm">
            <img
              src="/benzs-logo.png"
              alt="Benz's Fish"
              className="h-12 w-auto brightness-0 invert mb-5"
            />
            <p className="text-white/60 text-sm leading-relaxed">
              A family-run business since 1976 — gefilte fish with the home made
              taste, plus a full line of fresh &amp; frozen fish and groceries,
              under strict kosher supervision year round.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-benzs-gold text-xs uppercase tracking-[0.25em] mb-5">
              Explore
            </p>
            <ul className="space-y-3">
              {explore.map((l) => (
                <li key={l.href}>
                  <LocalizedClientLink
                    href={l.href}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <a
                  href="/benzs-product-catalog.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-benzs-gold hover:text-white transition-colors text-sm font-medium"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    aria-hidden
                  >
                    <path d="M11 3h2v8h3l-4 4-4-4h3V3Zm-6 14h14v2H5v-2Z" />
                  </svg>
                  Download Catalog (PDF)
                </a>
              </li>
            </ul>
          </div>

          {/* Visit */}
          <div>
            <p className="text-benzs-gold text-xs uppercase tracking-[0.25em] mb-5">
              Visit
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li>Brooklyn, New York</li>
              <li>
                Tel ·{" "}
                <a href="tel:+17187783329" className="hover:text-white">
                  718-778-3329
                </a>
              </li>
              <li>Fax · 718-778-3124</li>
              <li>
                <a href="mailto:info@benzfish.com" className="hover:text-white">
                  info@benzfish.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="content-container py-6 flex flex-col small:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>
            © {new Date().getFullYear()} Benz&apos;s Food Products Inc. All
            rights reserved.
          </span>
          <span className="uppercase tracking-[0.2em]">
            Under Strict Kosher Supervision
          </span>
        </div>
      </div>
    </footer>
  )
}
