# Instamart Category Discovery Engine

AI-powered review discovery engine + Basket-Gap Agent MVP for **Swiggy Instamart** growth.

Goal: increase the % of Monthly Active Customers who purchase from at least one **new category** every month.

## Routes

| Path | What it is |
|------|------------|
| `/` | Landing |
| `/workflow` | Part 1 — Review analysis workflow (corpus, themes, cited insights, validation, live classify) |
| `/research` | Parts 2–3 — Problem framing + interview synthesis |
| `/research/research-pack.md` | Screener, guide, 6 transcripts, synthesis matrix |
| `/agent` | Part 4 — Deployable Basket-Gap Agent MVP |

Deck (offline): [`deliverables/NL Swiggy Instamart.pptx`](deliverables/NL%20Swiggy%20Instamart.pptx) · [`deliverables/NL Swiggy Instamart.pdf`](deliverables/NL%20Swiggy%20Instamart.pdf)

## Prerequisites

- Node.js 20+ (22 recommended)
- A [Groq](https://console.groq.com/) API key (optional for browsing precomputed insights; required for live Groq classify/chat)
- For deploy: a [Vercel](https://vercel.com/) account

## Local setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```bash
GROQ_API_KEY=gsk_your_key_here
```

Precomputed pipeline output already lives in `public/data/pipeline_output.json`, so you can run the UI immediately:

```bash
npm run dev
```

Open:

- http://localhost:3000/workflow
- http://localhost:3000/agent
- http://localhost:3000/research

### Optional — refresh scrapes & pipeline

Only needed if you want to rebuild the corpus from scratch:

```bash
npm run scrape:stores          # Play Store + App Store
npm run scrape:reddit          # Reddit RSS (boost + cache merge; slow / rate-limited)
npm run pipeline               # Classify → theme → insights (uses Groq if GROQ_API_KEY set; else heuristics)
npm run pipeline:validate      # Gold set, kappa, triangulation, citation coverage
```

### Optional — regenerate the deck

```bash
npm run deck
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build (run before deploy) |
| `npm run start` | Serve the production build locally |
| `npm run scrape:stores` | Play Store + App Store → `data/raw/` |
| `npm run scrape:reddit` | Throttled Reddit RSS → cache + `reddit_all.jsonl` |
| `npm run pipeline` | Offline analysis → `public/data/pipeline_output.json` |
| `npm run pipeline:validate` | Validation scorecard |
| `npm run deck` | Generate PPTX + PDF under `deliverables/` |

## Stack

Next.js 15 · TypeScript · Tailwind · Groq (`openai/gpt-oss-120b` / `openai/gpt-oss-20b`) · Vercel-ready

---

## Deploy to Vercel (do this yourself)

The app is ready to deploy; **do not need a custom server**. Follow these steps once.

### 1. Confirm it builds locally

```bash
npm run build
npm run start
# smoke-check http://localhost:3000/workflow and /agent, then Ctrl+C
```

### 2. Log in to Vercel CLI

```bash
npx vercel login
```

Complete the browser / device auth prompt.

### 3. Link the project (first time only)

From the repo root:

```bash
npx vercel
```

Accept the defaults (or pick your team / project name). This creates `.vercel/` locally (gitignored).

### 4. Add the Groq secret (server-side only)

```bash
npx vercel env add GROQ_API_KEY
```

When prompted:

- Paste your `gsk_…` key
- Select **Production** (and Preview if you want live AI on preview URLs)
- Do **not** prefix with `NEXT_PUBLIC_` — the key must stay server-only (`/api/classify`, `/api/agent`)

You can also add it in the Vercel dashboard: **Project → Settings → Environment Variables**.

### 5. Deploy production

```bash
npx vercel --prod
```

Copy the production URL printed at the end (e.g. `https://instamart-discovery-xxxx.vercel.app`).

### 6. Submission links to use

Replace `YOUR_URL` with the production host:

- Review analysis workflow: `https://YOUR_URL/workflow`
- Basket-Gap Agent MVP: `https://YOUR_URL/agent`
- Research pack: `https://YOUR_URL/research/research-pack.md`

### 7. (Recommended) Push to GitHub for continuous deploys

```bash
git add .
git commit -m "feat: Instamart discovery engine + basket-gap agent"
git push -u origin main
```

Then in Vercel: **Add New Project → Import** this repo, set `GROQ_API_KEY`, deploy. Future pushes to `main` auto-deploy.

### Deploy checklist

- [ ] `npm run build` succeeds locally
- [ ] `GROQ_API_KEY` set in Vercel Production env
- [ ] `/workflow` loads themes + validation scorecard
- [ ] Live classify box on `/workflow` returns `mode: "groq"` (not only heuristic)
- [ ] `/agent` personas + chat work
- [ ] Deck PDF attached for submission: `deliverables/NL Swiggy Instamart.pdf`

## Notes

- Without `GROQ_API_KEY`, the UI still works using precomputed insights and heuristic/cache fallbacks for live APIs.
- Reddit scraping is aggressively rate-limited; `scripts/scrape/reddit_boost.ts` + disk cache under `data/raw/cache/reddit/` make crawls resumable.
- Pipeline model ID is pinned to Groq production models (`openai/gpt-oss-*`) — Llama IDs on Groq are being deprecated.
