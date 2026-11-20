# Implementation Status

_Last updated: 2026-11-20_

## Phase 0 definition of done

| # | Requirement | Status | How it was verified |
|---|---|---|---|
| 1 | A user can enter a rough builder or coding-agent request | Done | Browser, mock mode |
| 2 | SubText creates an inferred Brief | Done | Browser (mock); engine tests |
| 3 | Stated and assumed information are distinguishable | Done: tags read "you said", "assumed", "AI decides", "you confirmed", "remembered", "saved" | Browser |
| 4 | Users can edit assumptions | Done: Change, Keep (confirm), Not applicable, Remember | Browser, engine tests |
| 5 | Selective, context-aware questions | Done (deterministic VOI policy); **question quality unverified with a real model** | Engine tests; mock only |
| 6 | Questions adapt to answers | Done (re-analysis each round; asked slots never re-asked; rising threshold) | Engine tests; mock only |
| 7 | Users can skip questions | Done: "Just write it", "Skip these", "Write it now" (also while waiting in Wizard-of-Oz) | Browser, tests |
| 8 | The engine knows when to stop | Done: value threshold, budget, user, operator, diminishing returns, interpretation convergence | Engine tests |
| 9 | Concise, target-appropriate spec | Done: three renderers with different section order, sections and working rules | Render tests, browser |
| 10 | Copy and export | Done: Copy (primary), Download .md | Browser (clipboard not exercised by automation) |
| 11 | Human-assisted vs automated questioning can be compared | Done: `/study` console, question provenance, timing, survey, CSV export | Browser end to end (mock), store tests |
| 12 | Benchmark and harness can run an initial end-to-end experiment | **Wiring done; no real run yet.** 60 tasks, 7 arms, judging, stats, human-eval export | `npm run eval -- --dry` end to end; stats tests |
| 13 | Runs locally | Done | `npm run dev`, `npm run build` |
| 14 | Core logic has automated tests | Done: 85 tests (engine, policy, renderers, Wizard-of-Oz, memory, study store, operator auth, statistics, benchmark composition) | `npm test` |
| 15 | Limitations and manual research tasks documented | Done | `docs/VALIDATION_PLAN.md` |

## Verified working (development mock, 2026-11-20)

Checked in the browser against the running app, on desktop and at 375 px, in light and dark themes:

- **Core journey:** request with target → inferred Brief → a contradiction surfaced as one confirmation question → answers → spec → target switch (restructures instantly) → stale-spec notice after a Brief edit.
- **Keep an assumption:** the tag changes to "you confirmed". A pending question about a detail already settled in the Brief collapses to a single line.
- **Remember:** a remembered value fills the same slot in a new session, tagged "remembered", and that slot isn't asked about.
- **Study flow (Wizard-of-Oz):** console → participant link → consent → request → the participant waits → operator selects, edits and writes questions → the participant answers → the operator stops → the spec is written automatically → survey → CSV export with question sources, timing and ratings. The participant's view of the state never includes the engine's proposals.
- **Checks:** `npm test` (85), `npm run typecheck`, `npm run lint` and `npm run build` all pass. The browser console showed no errors.

**Bug found and fixed during verification:** answers to contradiction questions were dropped from the spec, because they have no slot. They're now carried into the composer's brief, the fallback composer, the restore-dropped-facts check and the Brief's "Decided" group (with tests). Separately, contradiction questions used `net: Infinity`, which serialises to `null` and would have failed validation on the next request in live mode; this is now fixed and tested.

## Not verified: needs a real API key

The shell has a placeholder `ANTHROPIC_API_KEY`, so every run so far used the development mock. The following are built but untested against the live API:

- Question quality and phrasing from Stage A (Haiku 5.5), and whether sampled interpretations give usable uncertainty
- Composition quality from Stage C (Sonnet 5.5)
- The live eval arms (T2, T5, judges, simulator) and the cost estimate's token assumptions
- Latency against the research targets (p50 first question ≤ 2 s)

To verify, once a key is in `.env.local`:

1. `npx tsx scripts/probe.ts "Build me a website for my business"`, then a fully specified request (expect 0 questions).
2. `npm run dev` and walk through the journey.
3. `npm run eval -- --limit 6` (≈ $4 at list prices), then read `items/*.json` by hand before trusting any number.

## Deliberately not built (research/13 out of scope, or not needed for Phase 0)

Accounts and auth, payments, team workspaces, browser extension, deep links into ChatGPT or Claude, a prompt marketplace, multi-agent orchestration, server-side usage analytics, streaming, Postgres. Saved context is per-browser localStorage; study data is JSON files on the researcher's machine.

## Known gaps to close next

| Gap | Why it matters | Ref |
|---|---|---|
| Cross-provider judge | Self-preference bias in E1 | research/09 §3 |
| Simulator audit (50 transcripts) | E1 is untrustworthy without it | research/09 §4.4 |
| Arm C (human-written prompts) | The primary contrast in research/09 | research/09 §2 |
| Full output-divergence stop test | The current convergence rule is a simplified version | research/06 §F.6 |
| Time-to-acceptable-output measure | Kill criterion "gain doesn't survive iteration" | research/01 §4 |
| Feedback capture outside studies (F11) | Outcome-calibrated question selection | research/13 F11 |
| Shared-store rate limit; public deployment hardening | Only needed if the prototype leaves the researcher's machine | research/08 §12 |
