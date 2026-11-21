# SubText

SubText is a **pre-flight brief builder for expensive AI runs**. Before you spend credits on an AI app builder (Lovable, Bolt, v0, Replit) or a coding agent (Cursor, Claude Code, Codex), you describe what you want in one line. SubText drafts a Brief, marks what you said versus what it assumed, asks only the few questions that would change the result, and compiles a spec that fits the target tool.

This repository is the **Phase 0 validation prototype** (research/14). It is built to test whether that thesis holds, not to be a production SaaS. It contains:

- **The product:** request → inferred Brief → selective questions → updated Brief → target-specific spec → copy or export.
- **A questioning experiment:** a researcher console (`/study`) that runs participant sessions in an automated condition or a Wizard-of-Oz condition, records who produced each question, and exports the data.
- **An evaluation harness:** a 60-task benchmark with hidden intent cards and arms T1–T5 (plus T3L and an oracle), scored with blind, position-swapped, length-controlled pairwise judging.

Product decisions come from [`research/`](research/INDEX.md). Implementation docs are in [`docs/`](docs/). Start with [`docs/VALIDATION_PLAN.md`](docs/VALIDATION_PLAN.md).

## Run it locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local     # add your ANTHROPIC_API_KEY
npm run dev                    # http://localhost:3000
```

Without a valid `ANTHROPIC_API_KEY`, SubText runs a **development mock**. The mock uses keyword templates, not AI, so you can click through the whole journey offline. Every screen shows a banner while the mock is active.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests (engine, policy, renderers, eval statistics) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run eval -- --dry` | Checks the evaluation harness wiring offline (no network, no cost) |
| `npm run eval -- --estimate` | Prints a rough cost estimate for the selected items |
| `npm run eval -- --limit 6` | Real pilot run (calls the API and costs money; see `docs/VALIDATION_PLAN.md`) |
| `npx tsx scripts/probe.ts "your request"` | Prints the engine's analysis and plan for one request (needs a key) |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Server-side only. If missing or a placeholder, the mock runs |
| `SUBTEXT_ANALYSE_MODEL` | `claude-haiku-5-5` | Analysis and sampling stages |
| `SUBTEXT_COMPOSE_MODEL` | `claude-sonnet-5-5` | Prompt composition |
| `SUBTEXT_SAMPLES` | `5` | Number of sampled interpretations used to estimate uncertainty |
| `SUBTEXT_MOCK` | `false` | Forces the mock even when a key is set |
| `SUBTEXT_RATE_LIMIT` | `40` | Requests per minute per IP (in-memory) |
| `SUBTEXT_OPERATOR_KEY` | — | Protects the `/study` console and its APIs. Without it, they work only in local development |
| `SUBTEXT_DATA_DIR` | `./.data` | Where study sessions are stored as JSON files (git-ignored) |

## Running a study session

1. `npm run dev`, then open `http://localhost:3000/study`.
2. Create a participant link with a code (e.g. `P07`, never a name) and a condition: **Wizard-of-Oz** (you choose the questions) or **Automated** (the engine does).
3. Send the participant the link. They confirm they're 18+ and consent, then use the normal product.
4. In the Wizard-of-Oz condition, the session page shows the engine's proposed questions, the Brief and the slot scores. Send up to three questions per round (pick, edit or write your own) or stop questioning.
5. After the spec, the participant rates how well it fits and which questions helped.
6. Export `questions` and `sessions` CSVs from the console. Delete sessions when the study ends.

## Layout

```
src/engine/      Deterministic core: schema, task templates, policy (VOI/stop), derivation,
                 orchestrator, renderers, LLM stage contracts, development mock
src/server/      Anthropic provider, provider factory, rate limiter, study store, operator auth (server-only)
src/app/         Next.js UI, /api/session, /study console and /api/study routes
src/client/      Browser API client, local session history, saved context, operator client
eval/            Benchmark (data/benchmark-v0.json), harness (arms, simulator, judges), CLI, statistics
docs/            Product spec, architecture, decisions, implementation status
research/        Completed discovery research (source of truth for product decisions)
```
