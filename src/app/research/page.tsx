import Link from "next/link";

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-orange transition"
        >
          ← Back to Home
        </Link>
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
        Parts 2–3 · Validation & Problem
      </p>
      <h1 className="mt-1 text-3xl font-bold text-brand-navy">
        Interviews confirm habit & risk — and challenge "price is the blocker"
      </h1>
      <p className="mt-3 text-slate-600">
        Six interviews (explicitly labeled) grounded in the scraped corpus. Full
        pack with screener, guide, transcripts, and synthesis matrix:
      </p>
      <p className="mt-2">
        <Link
          className="font-semibold text-brand-blue underline"
          href="/research/research-pack.md"
          target="_blank"
        >
          Open research pack (markdown)
        </Link>
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-brand-navy">Target segment</h2>
          <p className="mt-2 text-sm text-slate-700">
            Replenishment-heavy urban users (25–40) who reorder groceries/snacks
            weekly but buy pet / baby / personal care / pharmacy elsewhere.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-brand-navy">Root cause</h2>
          <p className="mt-2 text-sm text-slate-700">
            Search-led habits + first-purchase risk + “kitchen-only” mental
            model — not mere lack of awareness of categories.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-brand-navy">Workarounds today</h2>
          <p className="mt-2 text-sm text-slate-700">
            Multi-home Blinkit/Zepto, chemist, pet store, supermarket personal
            care aisle.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-brand-navy">Why it matters</h2>
          <p className="mt-2 text-sm text-slate-700">
            User: one less trip / app switch. Business: % MACs with ≥1 new
            category / month, higher AOV, stickier multi-category habits.
          </p>
        </div>
      </div>

      <div className="card mt-6 border-brand-orange">
        <h2 className="font-semibold">Where research challenged the engine</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            <strong>Price opacity</strong> ranked high in review text, but
            interviews showed <em>trust, size fit, and replaceability</em> dominate
            for pet/baby first buys.
          </li>
          <li>
            <strong>Discovery UI</strong> alone is incomplete — users also silo
            Instamart as a “kitchen app” mentally (R4).
          </li>
        </ul>
      </div>
    </div>
  );
}
