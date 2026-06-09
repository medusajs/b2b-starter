const items = [
  {
    title: "Strict Kosher",
    sub: "Supervised year round",
    icon: (
      <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Zm0 2.2 6 2.25V11c0 3.9-2.5 6.8-6 8.8-3.5-2-6-4.9-6-8.8V6.45L12 4.2Zm-1 9.3-2.3-2.3-1.4 1.4L11 16.3l5.7-5.7-1.4-1.4L11 13.5Z" />
    ),
  },
  {
    title: "Homemade Taste",
    sub: "Family recipe since 1976",
    icon: (
      <path d="M12 21s-7.5-4.6-10-9.3C.7 9 1.6 5.5 4.8 4.6 7 4 9 5 12 8c3-3 5-4 7.2-3.4 3.2.9 4.1 4.4 2.8 7.1C19.5 16.4 12 21 12 21Z" />
    ),
  },
  {
    title: "Fresh & Frozen",
    sub: "A full line of fish",
    icon: (
      <path d="M11 2h2v3.6l2.5-2.5 1.4 1.4L13 8.4V11h2.6l3.9-3.9 1.4 1.4L18.4 11H22v2h-3.6l2.5 2.5-1.4 1.4L15.6 13H13v2.6l3.9 3.9-1.4 1.4L13 18.4V22h-2v-3.6l-2.5 2.5-1.4-1.4L9 15.6V13H6.4l-3.9 3.9-1.4-1.4L4.4 13H2v-2h3.6L3.1 8.5l1.4-1.4L8.4 11H11V8.4L7.1 4.5l1.4-1.4L11 5.6V2Z" />
    ),
  },
  {
    title: "Wholesale",
    sub: "Institutions & retailers",
    icon: (
      <path d="M3 4h11v10H3V4Zm12 3h3.5L21 10v4h-2a2 2 0 1 1-4 0h-1V7Zm0 5h4v-1.6L17.7 9H15v3ZM6.5 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm11 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    ),
  },
]

const TrustStrip = () => {
  return (
    <section className="bg-benzs-sand border-y border-black/5">
      <div className="content-container">
        <div className="grid grid-cols-2 small:grid-cols-4 divide-x divide-black/5">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex items-center gap-3 py-7 px-4 small:px-8"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 shrink-0 fill-benzs-red"
                aria-hidden
              >
                {it.icon}
              </svg>
              <div>
                <p className="font-semibold text-benzs-ink leading-tight">
                  {it.title}
                </p>
                <p className="text-sm text-benzs-ink/60">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustStrip
