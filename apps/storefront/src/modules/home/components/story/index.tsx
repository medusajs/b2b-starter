import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

const Story = () => {
  return (
    <section id="story" className="bg-benzs-cream scroll-mt-24">
      <div className="content-container py-16 small:py-24">
        <div className="grid grid-cols-1 small:grid-cols-2 gap-10 small:gap-16 items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center grayscale"
              style={{ backgroundImage: "url('/benzs-banner.jpg')" }}
            />
            <div className="absolute inset-0 bg-benzs-ink/10" />
          </div>

          <div>
            <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold mb-4">
              A Family Story
            </p>
            <h2 className="font-serif text-benzs-ink text-4xl small:text-5xl font-medium leading-tight">
              Keeping tradition fresh since 1976.
            </h2>
            <div className="mt-6 space-y-4 text-benzs-ink/70 leading-relaxed">
              <p>
                Benz&apos;s Food Products has been a family-run business since
                1976 — the manufacturer of &ldquo;Gefilte Fish with the Home
                Made Taste.&rdquo; We&apos;ve dedicated ourselves to serving our
                customers with superior quality and personalized service, both
                nationally and internationally.
              </p>
              <p>
                We carry a full line of fresh &amp; frozen fish and groceries,
                all under strict kosher supervision, year round — and Kosher for
                Passover in season.
              </p>
            </div>
            <LocalizedClientLink
              href="/store"
              className="group inline-flex items-center gap-2 mt-8 text-benzs-ink font-semibold border-b-2 border-benzs-red pb-1 hover:text-benzs-red transition-colors"
            >
              Read our history
              <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Story
