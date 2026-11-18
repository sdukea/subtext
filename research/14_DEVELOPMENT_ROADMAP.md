# 14 — Development Roadmap

**Owner:** Coordinator (synthesis of `08` §16, `09` §16, `10` §8, `11` checklist)
**Date:** 2026-11-18
**Team assumption:** 1–3 people (one full-stack engineer and one eval/research person; the founder covers product and GTM). Durations are estimates, not commitments.
**Principle:** evaluation, not code, is the critical path (`08` §16). Every phase ends in a go/no-go gate with pre-registered criteria.

---

## Overview

| Phase | Weeks | Goal | Gate |
|---|---|---|---|
| **0. Evidence sprint** | 1–4 | Find out whether the refined thesis is true before building the product | Kill / pivot / proceed (`01` §4) |
| **1. MVP (web)** | 5–10 | Ship F1–F12 (`13` §3) for one niche, two target renderers | Offline benchmark win vs strong baselines; latency/cost SLOs |
| **2. Measured beta** | 10–16 | Human study, free beta in builder communities, first monetisation test | Human-study primary endpoint; activation and retention thresholds; WTP signal |
| **3. Expansion** | 16+ | MCP/insert-only integrations, templates, team tier, possible B2B API | Driven by Phase 2 data |

---

## Phase 0: Evidence sprint (weeks 1–4). **What to do in the first 30 days.**

| Week | Workstream | Actions | Output |
|---|---|---|---|
| 1 | Users | Recruit 15–20 builders (Lovable/Bolt/Cursor communities, Discords, r/vibecoding-type spaces). Run interviews with the guide in `05` §16 (Mom Test style: past behaviour, wasted builds, tool switching). | Interview notes; % reporting a wasted build or rework in the past month; tool-switching frequency (resolves OQ-3) |
| 1 | Demand | Three fake-door landing pages (builders / agent users / teams) driven by community posts. Van Westendorp survey on the waitlist. | Landing → waitlist rate per positioning; price acceptability range |
| 1–2 | Benchmark | Build benchmark v0: 60 realistic tasks (40 builder/coding-agent, 20 research/document), each with a hidden "intent card" for simulated users (`09` §4.3). Set up the judge pipeline with position swapping, a cross-provider judge and length control (`09` §3). | Benchmark v0 + judge harness |
| 2 | Prototype | **Wizard-of-Oz SubText:** a minimal UI where questions are chosen by a single-prompt LLM *and* by a human expert (two arms), then a Brief is compiled. No backend beyond a spreadsheet/DB. | Clickable prototype |
| 2–3 | Head-to-head | Blind comparison on the 60 tasks: (C) raw prompt; (T2) "improve this prompt" in the same frontier model; (T3) no-question rewrite; (T5) native clarification / Plan mode where accessible, or "ask me clarifying questions first"; (T4) SubText WoZ. Measure preference and iterations/time to an acceptable result. | Pilot effect sizes; tie rate and ICC for the power calculation (`09` §7) |
| 3 | Concierge | 10 builders use the WoZ tool on real projects for 2–3 weeks. Track unprompted second use and self-reported build outcomes. | Repeat-use rate; qualitative "would pay" evidence |
| 3–4 | Legal | Counsel review: Anthropic D.4 "competing product" reading; DPDP applicability to non-Indian users; EU representative. Draft privacy policy, ToS, sub-processor list (`11`). | Legal memo + policy drafts |
| 4 | Decision | Compare against the kill criteria in `01` §4. Record in `DECISION_LOG.md`. | **Go / narrow further / pivot to B2B probe / stop** |

**Phase 0 budget (estimate):** model/eval costs are small (an L1 benchmark run is ~tens of dollars, `09` §10). The main costs are time, about $50–150 in participant incentives per interviewee, and legal review.

## Phase 1: MVP web app (weeks 5–10). Only if Phase 0 passes.

| Track | Deliverables | Reference |
|---|---|---|
| Engine | State machine + 3 typed LLM stages (analyse/update, next-question + stop, compile); slot templates for 4 task families; sampling-based uncertainty; stop rules | `06` §A–G, `08` §4 |
| Renderers | Generic + AI-app-builder spec + coding-agent task | `04` model conventions, `08` §8.4 |
| App | S1–S8, S11, S13, S14 (`07` §6); Copy/Markdown export; memory (About me, project) | `07`, `13` §3 |
| Platform | Postgres (state as JSONB), managed auth, rate limiting, SSE streaming, tracing (Langfuse or equivalent), provider fallback | `08` §6–8, §11 |
| Privacy | Paid-tier APIs, no content in logs, delete-all, 18+ gate, policies live | `11` checklist |
| Eval | Benchmark v1 (300 tasks: 100 dev / 200 locked test), CI regression on every prompt or model change | `09` §4, §12.3 |

**Exit criteria:** p50 first question ≤ 2 s; schema failure < 0.5%; offline win rate vs T3 and T2 meets the pre-registered threshold; median cost ≤ $0.03/session.

## Phase 2: Measured beta (weeks 10–16)

- **Human study** (~72 participants, within-subject, counterbalanced) on the primary endpoint (`09` §5.2).
- **Free beta** in builder communities. Publish 10 public brief templates; 2–3 creator tutorials (`10` §8).
- **Production evaluation signals:** copy/export rate, Brief edit rate, skip-all rate, question thumbs, outcome check-ins, 4-week return (`09` §12).
- **Monetisation test:** Builder tier at $8 vs $12, credit packs vs subscription; painted-door Team tier (`10` §9).
- **B2B probe (parallel):** 5–10 conversations with AI app builders and vertical AI products about licensing the clarification engine.

**Gate:** human-study effect significant on preference *or* time-to-acceptable; activation ≥40%; 4-week return ≥20%; free→paid by day 35 ≥2% (RevenueCat freemium median 2.1%). All targets are assumptions to calibrate against the first cohort.

## Phase 3: Expansion (week 16+)

Prioritise by Phase 2 data:
1. **MCP server** exposing project briefs to Claude Code, Cursor and other MCP clients (the strongest "lands where work happens" path without UI scraping).
2. **Templates & projects** (S9, S10), shared briefs.
3. **Team tier** (shared context packs, admin, retention controls). SOC 2 and DPA readiness only if team demand appears (`11`).
4. **Insert-only browser extension:** inserts text on click, never reads responses (`11`).
5. **Outcome-calibrated selection:** retrain impact/stop priors from feedback; DSPy/GEPA-style optimisation of stage prompts against the benchmark (`04`, `08` §16).
6. **B2B clarification API** if the probe produced ≥2 LOIs or pilots.

## Ongoing operational commitments

- **Model-change regression gate:** re-run the benchmark before adopting a new model version or changing a renderer (`09` §12.3).
- **Conventions owner:** someone owns the per-vendor prompting conventions table and reviews vendor docs monthly (`04` §0).
- **Native-competition watch:** monthly check of Claude, ChatGPT, Gemini, Lovable, Bolt and Cursor release notes for clarification and memory features. Re-run the head-to-head when a major one ships.
- **Privacy:** quarterly review of provider data policies (they changed several times in 2025–2026, `11`).
