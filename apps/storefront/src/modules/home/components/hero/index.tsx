import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

const Hero = () => {
  return (
    <section className="relative w-full min-h-[88vh] flex items-center bg-benzs-ink overflow-hidden">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/benzs-hero.jpg')" }}
      />
      {/* Navy gradient — heavier on the left for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-benzs-ink via-benzs-ink/85 to-benzs-ink/20" />
      <div className="absolute inset-0 bg-benzs-ink/20" />

      <div className="relative z-10 content-container py-24">
        <div className="max-w-2xl">
          <p className="text-white/70 text-xs uppercase tracking-[0.25em] mb-6">
            Established 1976 &middot; Brooklyn, NY
          </p>

          <h1 className="font-serif text-white font-medium leading-[1.05] text-5xl small:text-7xl">
            Keeping <span className="text-benzs-gold italic">tradition</span>{" "}
            fresh since 1976.
          </h1>

          <p className="text-white/80 text-lg leading-relaxed mt-8 max-w-xl">
            A family-run business making gefilte fish with the home made taste —
            alongside a full line of fresh &amp; frozen fish and groceries, all
            under strict kosher supervision, year round.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-10">
            <LocalizedClientLink
              href="/store"
              className="group inline-flex items-center gap-2 bg-white text-benzs-ink px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-benzs-cream transition-colors"
            >
              Shop the Collection
              <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/#story"
              className="inline-flex items-center gap-2 border border-white/50 text-white px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Our Story
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
