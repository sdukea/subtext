# 13 — MVP Scope and Product Requirements Document

**Owner:** Coordinator (synthesis)
**Date:** 2026-11-18
**Status:** Draft PRD for a *conditional* build. Build only after Phase 0 validation (`14_DEVELOPMENT_ROADMAP.md`) passes its kill gates.
**Inputs:** `01` (refined thesis), `12` (risks), `05` (users), `06` (engine), `07` (UX), `08` (architecture), `09` (evaluation), `10` (GTM), `11` (privacy).

---

## 1. Product definition

**One-liner:** SubText turns a rough idea into a short, reviewable brief before you launch an expensive AI run, then exports it to the tool you're about to use.

**Positioning statement (primary, for the initial niche):**
> For people who build with AI app builders and coding agents and keep burning credits on builds that miss the point, SubText is a pre-flight brief builder. It asks only the few questions that change the result, shows its assumptions, remembers your project, and hands a clean spec to Lovable, Bolt, Cursor, Claude Code or ChatGPT. Unlike the "enhance prompt" button inside each tool, your brief and your context go with you across tools and get better every time you use them.

**Alternative positionings to test in fake-door pages** (from `10` §6):
1. *Builders:* "Spec it before you spend it." A brief builder for AI app builds.
2. *Agent / deep-research users:* "Get the brief right before the 20-minute run."
3. *Teams:* "Shared briefs and context packs for every AI tool your team uses."

Messaging rules: never say "prompt engineering" or "prompt generator" in primary copy. Lead with the costly outcome avoided (rework, wasted credits, wrong build), not with the technique. Do not claim quality improvements until the benchmark (`09`) supports them.

## 2. Target user for v1

**Primary:** non-technical and semi-technical builders using AI app builders (Lovable, Bolt, v0, Replit) and/or coding agents (Cursor, Claude Code), adults 18+.
- Why: a bad brief has a visible cost (credits, rework). They switch between tools. They are reachable through dense communities. Willingness to pay is plausible against wasted credits (`02` §segments, `10` §5b).
- Risk: their own platforms already offer Plan modes and Enhance (R1). The v1 must win on portability and memory, not on "asking".

**Secondary (observe, don't design for):** knowledge workers launching deep-research runs.
**Explicitly not v1:** students under 18 (Gemini terms, DPDP child consent; `11`), general consumers, prompt-engineering experts, enterprises needing SSO/SOC 2.

Jobs-to-be-done (from `05`):
- *Functional:* "When I'm about to start building an app with AI, help me turn my idea into a spec the tool will get right the first time, so I don't waste credits and hours on the wrong thing."
- *Emotional:* feel confident and in control and not stupid. Avoid the dread of a long, wrong build.
- *Switching forces:* push = wasted credits/rework; pull = a clear spec plus portability; anxiety = "another tool, another step"; habit = typing straight into the builder.

## 3. What v1 does (in scope)

| # | Capability | Requirement | Source |
|---|---|---|---|
| F1 | **Single input** | One text box ("What are you about to build or ask an AI to do?"); paste allowed; target tool selector (default "Generic"). | `07` S1 |
| F2 | **Inferred Brief first** | Within ~1–2 s, show a Brief inferred from the input alone: goal, audience, key features/scope, constraints, success criteria, each marked *stated* or *assumed*. | `06` §8, `07` P1/P4 |
| F3 | **Value-gated questions** | Ask only slots where P(assumption wrong) × impact × output-sensitivity exceeds the effort threshold. ≤3 questions per round, usually ≤2 rounds. Multiple choice with "You decide" and free text. A zero-question path for already-specific requests. | `06` §D–F |
| F4 | **Assumption chips** | Every unasked slot is shown as an editable "assumed" chip. Edit, replace, remove, "remember this". | `07` §7.3 |
| F5 | **Skip-all** | "Write it now" always visible. Skipping is never penalised. | `07` P3 |
| F6 | **Compile** | Generate a concise consolidated prompt/spec from the Brief using a target renderer (v1: Generic, AI-app-builder spec, coding-agent task). Keep the output short: no persona boilerplate, no generic CoT, no stuffing in every requirement. | `04` §should/shouldn't; Yang et al. |
| F7 | **Review & edit** | Sectioned output; section-level edit/regenerate; simple version history and diff. | `07` S4, S6 |
| F8 | **Copy & export** | Primary: Copy. Secondary: Markdown download; "Open in…" deep links where documented. v1.1: MCP server so Claude Code/Cursor can fetch the brief. | `07` Q8, D5 |
| F9 | **Memory (consented)** | "About me" plus per-project context; past answers become defaults; never ask the same thing twice. | `07` P9; `06` §9 |
| F10 | **History** | List, search and reopen sessions; duplicate a brief for a new project. | `07` S7 |
| F11 | **Feedback capture** | After export: "Did the build/run go right?" (1-click, later follow-up). Thumbs on each question. Feeds outcome-calibration. | `09` §12 |
| F12 | **Privacy defaults** | No training on user data; paid-tier APIs only; delete-all; minimal logs (metadata only, not content); 18+ attestation. | `11` |

## 4. What v1 does not do (out of scope, with reasons)

| Not in v1 | Why |
|---|---|
| Browser extension injecting into ChatGPT/Claude | Selector fragility, ToS on automated access, malicious-extension trust deficit (`07` §11, `11`). Reconsider as insert-only in Phase 3. |
| Executing the task / calling the target LLM for the user | Becomes a worse ChatGPT; adds cost and policy surface. SubText's job ends at a great brief. |
| Prompt library / marketplace | Declining category (`03` §J); copyright offers little protection (`11`). |
| Teaching prompt engineering / exposing technique names | Users don't want to learn it; techniques are shrinking in value (`04`). |
| "Optimise my existing prompt" one-click rewriter | Commoditised and free elsewhere; doesn't use the questioning differentiator. Allowed only as an input mode feeding the same Brief flow. |
| BYOK, team workspaces, SSO, enterprise | Phase 3 at earliest (`08` §15, `11` checklist). |
| Under-18 users | Provider terms and DPDP (`11`, D4). |
| Image/video prompt generation | Different slot taxonomy and competitors with native enhancers (Midjourney/Ideogram); defer. |
| Multi-agent architecture | No identified problem it solves (`08` §3). |
| Fetching URLs or reading pasted documents by default | Prompt-injection pass-through risk into downstream agents (`11` §injection). |

## 5. User flow (v1 core loop)

```
[S1 Input + target] → [S2 Brief (inferred) + Round 1 questions (≤3)]
      → answers / "You decide" / skip → [Brief updates live]
      → (optional Round 2, only if a slot still clears the threshold)
      → [S3 Compile, streaming] → [S4 Brief + prompt/spec; edit sections; Copy/Export]
      → (later) outcome check-in → memory updated
```
Detailed wireframes, states and shortcuts: `07` §5–8.

## 6. Functional requirements: questioning engine

Use `06_QUESTIONING_ENGINE.md` as the specification. Summary of binding requirements:
- **R-QE1** Explicit conversation state (`06` §B) is the single source of truth. LLM calls are typed functions returning schema-validated JSON (`08` §2.3).
- **R-QE2** Task-family slot templates (from `04` taxonomy) are priors. Open slot discovery is allowed. v1 families: *web/app build*, *coding-agent task (feature/bug)*, *research brief*, *long-form document*.
- **R-QE3** Per-slot decision: assume silently / assume-and-show / ask (Horvitz thresholds).
- **R-QE4** Uncertainty is estimated by sampling alternative interpretations, not by the model's self-reported confidence (`06` §4).
- **R-QE5** Stop rules are combinable: value threshold, question budget (default 6), user signal, critical-slot coverage, sampled-output divergence below threshold.
- **R-QE6** Contradictions are surfaced as a single confirm question, never resolved silently.
- **R-QE7** Never ask for information already in memory or in the input. Never ask leading questions. Never ask for secrets or credentials.

## 7. Non-functional requirements

| Area | Requirement | Source |
|---|---|---|
| Latency | Brief/first question p50 ≤ 2 s; compile starts streaming ≤ 1.5 s | `08` §10, `07` P8 |
| Reliability | Schema-validation failure < 0.5%; provider fallback | `08` §8.2 |
| Cost | ≤ $0.03 per session median at list prices (target; current estimate $0.003–0.06) | `08` §9 |
| Privacy | Paid-tier provider APIs with no training; content not in logs; retention user-controlled; delete-all ≤ 30 days including backups | `11` |
| Security | OWASP LLM Top 10 controls; strip invisible characters; label instruction provenance in briefs | `11` |
| Accessibility | WCAG 2.2 AA; full keyboard operation | `07` §10 |
| Compliance | Privacy policy, ToS, sub-processor list; 18+ gate; GDPR/DPDP notices; EU representative before EU marketing | `11` checklist |

## 8. Success metrics

- **North star (hypothesis):** briefs exported that were followed by a successful run without major rework (self-reported; telemetry where consented) (`10` §8).
- **Evaluation primary endpoint:** blind pairwise preference and time-to-acceptable-output versus the best native baseline (`09` §9.2).
- **Activation:** completes questions *and* exports in the first session (target ≥40% of sign-ups; assumption).
- **Retention:** unprompted second brief within 4 weeks (≥20%; assumption).
- **Guardrails:** mean questions per session ≤ 4; skip-all rate tracked (too high means questions aren't valued); "irrelevant question" thumbs-down < 10%; brief length doesn't creep (`09` §9.3).

## 9. Differentiation strategy: what makes it harder to replicate

Honest assessment: **asking questions is not a moat** (`06` §9, `12` R1). In order of defensibility, these are what to build toward:
1. **Outcome-calibrated question selection:** which slots, for which task family, actually changed outcomes. Learned from F11 feedback and edit data. No competitor documents a stop rule or outcome evidence (`03` §G).
2. **Persistent, portable context:** personal and project memory that works across Lovable, Cursor, Claude, ChatGPT. Each vendor's memory is siloed in its own ecosystem.
3. **The Brief as an artefact:** a reusable, versioned spec that compiles to multiple targets and can be shared with collaborators or teammates.
4. **Curated domain slot priors** per task family, maintained as models change (the conventions table in `04` needs an owner).
5. **Published evidence:** a public benchmark showing SubText's effect versus native baselines, which builds trust in a category full of unproven claims.

## 10. Open product questions (tracked in `OPEN_QUESTIONS.md`)

Do users read or edit the Brief, or only copy the prompt? How often do builders switch tools mid-project? What is the right round size? Do "You decide" and "Not sure" need to be distinct? Will builders pay per brief or per month?
