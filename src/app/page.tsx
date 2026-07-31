import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-brand-navy via-slate-900 to-brand-blue px-8 py-12 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-300">
          Swiggy Instamart · Growth PM Case
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Increase MACs who buy from at least one new category every month
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-200">
          An AI discovery engine that mines App Store, Play Store, and Reddit
          feedback — validated with primary research — and a deployed basket-gap
          agent that de-risks first purchases in unfamiliar categories.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/workflow" className="btn">
            Open Review Analysis Workflow
          </Link>
          <Link
            href="/agent"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-orange-50"
          >
            Try Basket-Gap Agent MVP
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Part 1 · Discovery Engine",
            body: "Scrape → classify → theme → cite. Live evidence drill-down and validation scorecard.",
            href: "/workflow",
          },
          {
            title: "Part 2–3 · Research & Problem",
            body: "6 synthesized interviews that confirm and challenge AI themes. Problem framed for a clear segment.",
            href: "/research",
          },
          {
            title: "Part 4 · AI-Native MVP",
            body: "Household inference, category-gap detection, first-timer shortlists with risk reversal.",
            href: "/agent",
          },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card hover:border-brand-orange">
            <h2 className="text-lg font-semibold text-brand-navy">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
