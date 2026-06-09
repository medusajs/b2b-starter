import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ArrowRight } from "@medusajs/icons"

const ComingSoon = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) => {
  return (
    <section className="bg-benzs-cream min-h-[70vh] flex items-center">
      <div className="content-container py-24 text-center max-w-2xl mx-auto">
        <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold mb-4">
          {eyebrow}
        </p>
        <h1 className="font-serif text-benzs-ink text-5xl small:text-6xl font-medium leading-tight">
          {title}
        </h1>
        <p className="text-benzs-ink/70 text-lg mt-6 leading-relaxed">
          {description}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 text-benzs-ink/50 text-sm uppercase tracking-widest">
          <span className="h-px w-8 bg-benzs-gold" />
          Coming Soon
          <span className="h-px w-8 bg-benzs-gold" />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <LocalizedClientLink
            href="/store"
            className="group inline-flex items-center gap-2 bg-benzs-ink text-white px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-benzs-navy transition-colors"
          >
            Browse the Catalog
            <ArrowRight className="group-hover:translate-x-0.5 transition-transform" />
          </LocalizedClientLink>
          <a
            href="tel:+17187783329"
            className="border border-benzs-ink/30 text-benzs-ink px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-benzs-ink/5 transition-colors"
          >
            Call 718.778.3329
          </a>
        </div>
      </div>
    </section>
  )
}

export default ComingSoon
