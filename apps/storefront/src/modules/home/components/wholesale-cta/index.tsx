import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const WholesaleCta = () => {
  return (
    <section id="contact" className="bg-benzs-cream scroll-mt-24">
      <div className="content-container py-16 small:py-24 text-center">
        <p className="text-benzs-red text-xs uppercase tracking-[0.25em] font-semibold mb-4">
          Wholesale &amp; Retail
        </p>
        <h2 className="font-serif text-benzs-ink text-4xl small:text-5xl font-medium leading-tight">
          We&apos;re here to assist you.
        </h2>
        <p className="text-benzs-ink/70 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
          Become a customer or request our full product list — our team is glad
          to help, nationally and internationally.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
          <LocalizedClientLink
            href="/account"
            className="bg-benzs-ink text-white px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-benzs-navy transition-colors"
          >
            Become a Customer
          </LocalizedClientLink>
          <a
            href="tel:+17187783329"
            className="border border-benzs-ink/30 text-benzs-ink px-8 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wider hover:bg-benzs-ink/5 transition-colors"
          >
            Call 718.778.3329
          </a>
        </div>
      </div>
    </section>
  )
}

export default WholesaleCta
