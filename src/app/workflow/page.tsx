"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ClassifiedItem,
  Insight,
  PipelineOutput,
  Theme,
} from "@/lib/types";

export default function WorkflowPage() {
  const [data, setData] = useState<PipelineOutput | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [liveText, setLiveText] = useState(
    "I always reorder the same milk and veggies. Never bother looking at pet food even though I have a dog — too risky if quality is bad."
  );
  const [liveResult, setLiveResult] = useState<string>("");
  const [loadingLive, setLoadingLive] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/data/pipeline_output.json")
      .then((r) => {
        if (!r.ok) throw new Error("Pipeline output not found — run scrape + pipeline first.");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const evidenceMap = useMemo(() => {
    const m = new Map<string, ClassifiedItem>();
    data?.items.forEach((i) => m.set(i.id, i));
    return m;
  }, [data]);

  async function runLiveClassify() {
    setLoadingLive(true);
    setLiveResult("");
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: liveText }),
      });
      const json = await res.json();
      setLiveResult(JSON.stringify(json, null, 2));
    } catch (e) {
      setLiveResult(String(e));
    } finally {
      setLoadingLive(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="card border-orange-300 bg-orange-50">
          <h1 className="text-xl font-bold text-brand-navy">Workflow not ready</h1>
          <p className="mt-2 text-slate-700">{error}</p>
          <pre className="mt-4 overflow-auto rounded-lg bg-white p-3 text-xs">
            {`npm run scrape:all\nnpm run pipeline\nnpm run pipeline:validate`}
          </pre>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">
        Loading discovery engine…
      </div>
    );
  }

  const v = data.validation;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Part 1 · AI Discovery Engine
        </p>
        <h1 className="mt-1 text-3xl font-bold text-brand-navy">
          Reviews → themes → cited insights, with a validation scorecard
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Corpus scraped from Play Store, App Store, and Reddit RSS. Classified
          with Groq ({data.model}), clustered into themes, synthesized into
          answers to the brief&apos;s eight questions — each backed by quote IDs.
        </p>
      </div>

      {/* Pipeline stages */}
      <div className="mb-8 grid gap-3 md:grid-cols-5">
        {[
          "1. Ingest",
          "2. Normalize",
          "3. Classify",
          "4. Theme",
          "5. Validate",
        ].map((s, i) => (
          <div key={s} className="card flex items-center gap-3 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm font-semibold">{s.replace(/^\d+\.\s/, "")}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Raw items scraped" value={data.stats.totalRaw} />
        <Stat label="Substantive analyzed" value={data.stats.substantive} />
        <Stat label="Themes identified" value={data.themes.length} />
        <Stat label="Cited insights" value={data.insights.length} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Object.entries(data.stats.bySource).map(([src, n]) => (
          <div key={src} className="card">
            <p className="text-xs font-semibold uppercase text-slate-500">{src}</p>
            <p className="mt-1 text-2xl font-bold text-brand-navy">{n}</p>
          </div>
        ))}
      </div>

      {/* Themes */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-brand-navy">Theme map</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {data.themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t)}
              className="card text-left transition hover:border-brand-blue"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-brand-navy">{t.name}</h3>
                <span
                  className={`badge ${
                    t.confidence === "high"
                      ? "bg-blue-100 text-blue-800"
                      : t.confidence === "medium"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t.confidence}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{t.description}</p>
              <p className="mt-3 text-xs text-slate-500">
                {t.itemCount} items · sources: {t.sources.join(", ")}
              </p>
            </button>
          ))}
        </div>
        {selectedTheme && (
          <div className="card mt-4 border-brand-blue">
            <h3 className="font-semibold">Evidence for: {selectedTheme.name}</h3>
            <ul className="mt-3 space-y-2">
              {selectedTheme.sampleIds.map((id) => {
                const item = evidenceMap.get(id);
                if (!item) return null;
                return (
                  <li key={id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="badge bg-slate-200 text-slate-700">
                      {item.source} · {item.app}
                    </span>
                    <p className="mt-2 text-slate-700">&ldquo;{item.text.slice(0, 280)}&rdquo;</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Insights */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-brand-navy">
          Insights answering the brief
        </h2>
        <div className="space-y-3">
          {data.insights.map((ins) => (
            <button
              key={ins.id}
              onClick={() => setSelectedInsight(ins)}
              className="card block w-full text-left hover:border-brand-orange"
            >
              <p className="text-sm font-semibold text-brand-orange">{ins.question}</p>
              <p className="mt-2 text-slate-700">{ins.answer}</p>
              <p className="mt-2 text-xs text-slate-500">
                {ins.evidenceIds?.length || 0} citations · confidence {ins.confidence}
              </p>
            </button>
          ))}
        </div>
        {selectedInsight && (
          <div className="card mt-4 border-brand-orange">
            <h3 className="font-semibold">Citations · {selectedInsight.question}</h3>
            <ul className="mt-3 space-y-2">
              {selectedInsight.evidenceIds.map((id) => {
                const item = evidenceMap.get(id);
                return (
                  <li key={id} className="rounded-lg bg-orange-50 p-3 text-sm">
                    <code className="text-xs text-slate-500">{id}</code>
                    <p className="mt-1">
                      {item ? `“${item.text.slice(0, 260)}”` : "(quote not in preview slice)"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Validation */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-brand-navy">Validation scorecard</h2>
        {v ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Gold-set accuracy" value={`${Math.round(v.accuracy * 100)}%`} />
            <Stat label="Cohen's κ" value={v.cohenKappa.toFixed(2)} />
            <Stat label="Theme stability" value={`${Math.round(v.themeStability * 100)}%`} />
            <Stat label="Citation coverage" value={`${Math.round(v.citationCoverage * 100)}%`} />
            <Stat
              label="Negative control"
              value={v.negativeControlPass ? "PASS" : "FAIL"}
            />
            <Stat label="Gold set size" value={v.goldSetSize} />
            <div className="card md:col-span-3">
              <p className="text-sm font-semibold">Notes</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {v.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              {v.singleSourceThemes.length > 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  Lower-confidence (single-source) themes:{" "}
                  {v.singleSourceThemes.join("; ")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Run `npm run pipeline:validate`.</p>
        )}
      </section>

      {/* Live classify */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-brand-navy">
          Live classify a review (Groq)
        </h2>
        <div className="card">
          <textarea
            className="w-full rounded-xl border border-slate-300 p-3 text-sm"
            rows={4}
            value={liveText}
            onChange={(e) => setLiveText(e.target.value)}
          />
          <button className="btn mt-3" onClick={runLiveClassify} disabled={loadingLive}>
            {loadingLive ? "Classifying…" : "Classify with Groq"}
          </button>
          {liveResult && (
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
              {liveResult}
            </pre>
          )}
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Generated {data.generatedAt} · model {data.model}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-brand-navy">{value}</p>
    </div>
  );
}
