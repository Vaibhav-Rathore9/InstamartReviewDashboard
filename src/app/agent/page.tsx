"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PERSONAS,
  getPersona,
  shortlistForPersona,
  type PersonaId,
  type ShortlistSku,
} from "@/lib/personas";

type Msg = { role: "user" | "agent"; text: string };

export default function AgentPage() {
  const [personaId, setPersonaId] = useState<PersonaId>("riya_pet");
  const persona = useMemo(() => getPersona(personaId), [personaId]);
  const shortlist = useMemo(() => shortlistForPersona(persona), [persona]);
  const [selected, setSelected] = useState<ShortlistSku | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: "Hi! I'm your Instamart Basket-Gap Agent. I look at what you already reorder, infer household context, and suggest a de-risked first buy in a category you likely purchase elsewhere.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string[]>([]);

  function resetChat(id: PersonaId) {
    setPersonaId(id);
    setSelected(null);
    setAdded([]);
    const p = getPersona(id);
    setMessages([
      {
        role: "agent",
        text: `Loaded ${p.name}. I see frequent ${p.orders
          .map((o) => o.category)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3)
          .join(", ")} orders. Likely gap: ${p.gapCategories.join(", ")}. Trigger: ${p.trigger}. Ask me why these 3 SKUs, or say "add the safest one".`,
      },
    ]);
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId,
          message: text,
          shortlist,
          history: messages.slice(-6),
        }),
      });
      const json = await res.json();
      setMessages((m) => [...m, { role: "agent", text: json.reply || "…" }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          text: "I hit a snag calling the model. Based on your history, start with the lowest-risk SKU in the shortlist — usually the sealed FMCG under ₹200 with an easy replace promise.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-orange transition"
        >
          ← Back to Home
        </Link>
      </div>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Part 4 · AI-Native MVP
        </p>
        <h1 className="mt-1 text-3xl font-bold text-brand-navy">
          Basket-Gap Agent: de-risk the first buy in a new category
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Habit + search-tunnel navigation means users never meet adjacent
          aisles. This agent infers household context, detects category gaps,
          and times a 3-SKU shortlist with price anchors and risk reversal.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => resetChat(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              personaId === p.id
                ? "bg-brand-orange text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Phone mock */}
        <div className="mx-auto w-full max-w-[340px]">
          <div className="overflow-hidden rounded-[2rem] border-4 border-slate-900 bg-white shadow-2xl">
            <div className="bg-brand-orange px-4 py-3 text-white">
              <p className="text-xs opacity-90">Instamart · 12 mins</p>
              <p className="font-bold">For you · New for your home</p>
            </div>
            <div className="bg-brand-sand px-3 py-2 text-xs text-slate-700">
              <strong>Trigger:</strong> {persona.trigger}
            </div>
            <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
              <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Your usual basket
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {persona.orders.map((o) => (
                    <li key={o.name} className="flex justify-between gap-2">
                      <span>{o.name}</span>
                      <span className="text-slate-500">₹{o.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                First-timer shortlist · {persona.gapCategories[0]}
              </p>
              {shortlist.map((sku) => (
                <button
                  key={sku.name}
                  onClick={() => setSelected(sku)}
                  className={`w-full rounded-xl p-3 text-left ring-1 transition ${
                    selected?.name === sku.name
                      ? "bg-orange-50 ring-brand-orange"
                      : "bg-white ring-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-brand-navy">{sku.name}</p>
                    <p className="font-bold">₹{sku.price}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{sku.reason}</p>
                  <p className="mt-1 text-xs text-blue-700">{sku.priceAnchor}</p>
                  <p className="mt-1 text-xs font-medium text-slate-800">
                    ✓ {sku.riskReversal}
                  </p>
                  <div className="mt-2">
                    <span
                      className="btn !py-1.5 !text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdded((a) =>
                          a.includes(sku.name) ? a : [...a, sku.name]
                        );
                      }}
                    >
                      {added.includes(sku.name) ? "Added" : "Add · try once"}
                    </span>
                  </div>
                </button>
              ))}
              {added.length > 0 && (
                <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                  Cart preview: {added.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat + explanation */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-brand-navy">How the agent works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>
                <strong>Infer household</strong> from reorder graph:{" "}
                {persona.household.join(" · ")}
              </li>
              <li>
                <strong>Detect gaps</strong>: categories the household likely
                buys elsewhere → {persona.gapCategories.join(", ")}
              </li>
              <li>
                <strong>Shortlist 3 SKUs</strong> with reason, price anchor, risk
                reversal
              </li>
              <li>
                <strong>Time the nudge</strong> to a trigger — not a generic
                carousel
              </li>
            </ol>
          </div>

          <div className="card flex h-[420px] flex-col">
            <h2 className="mb-3 font-semibold text-brand-navy">Agent chat</h2>
            <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-brand-orange text-white"
                      : "bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder='Try: "Why these 3?" or "What makes this low risk?"'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
              />
              <button className="btn" disabled={busy}>
                {busy ? "…" : "Send"}
              </button>
            </form>
          </div>

          {selected && (
            <div className="card border-brand-blue">
              <h3 className="font-semibold">{selected.name}</h3>
              <p className="mt-2 text-sm">{selected.reason}</p>
              <p className="mt-1 text-sm text-blue-800">{selected.priceAnchor}</p>
              <p className="mt-1 text-sm font-medium">Risk reversal: {selected.riskReversal}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
