# Architecture

This implements research `08` option E and `06` option 6: a **deterministic orchestrator with typed, schema-constrained LLM functions**. There is no multi-agent system, vector database, queue or background worker.

```
Browser (Next.js client)
  │  POST /api/session {action, state, ...}        state validated with Zod in both directions
  ▼
API route  ──► orchestrator (deterministic state machine)
                 │
                 ├─ Stage A  analyse         Haiku 5.5, structured output, thinking off, effort low
                 ├─ Stage B  sample ×K       Haiku 5.5, K=5 in parallel, options rotated per sample
                 ├─ policy   VOI · Horvitz thresholds · batching · stop rules   (pure code)
                 ├─ Stage C  compose → IR    Sonnet 5.5, structured output, adaptive thinking (low),
                 │                           server-side refusal fallback
                 └─ renderers IR → text      pure functions, per target × family
```

## Components

| Concern | Where | Kind |
|---|---|---|
| UI | `src/app/page.tsx`, `src/app/components/*` | React client |
| API / validation / rate limit | `src/app/api/session/route.ts`, `src/server/rate-limit.ts` | Code |
| Provider integration | `src/server/anthropic.ts`, `src/server/provider.ts` (`LlmProvider` interface in `src/engine/orchestrator.ts`) | Code + LLM |
| Intent extraction | Stage A (`src/engine/stages.ts` → `mergeAnalysis` in `derive.ts`) | LLM + code |
| Context and requirement management | `ConversationState` (`schema.ts`); `derive.ts` | Code |
| Question selection | `policy.ts` (`scoreSlot`, `decideSlots`, `selectBatch`) | Code |
| Question generation | Stage A proposes phrasing and options per slot; policy decides which are asked | LLM + code |
| Completion assessment | `policy.ts` `computeStop` | Code |
| Prompt synthesis | Stage C → `PromptIR` → `render.ts` | LLM + code |
| Validation | Zod at the API boundary; structured outputs; `repairIR` (restores any user-confirmed fact the composer dropped); value clamping in `derive.ts` | Code |
| Evaluation | `eval/` | Code + LLM |

## State model

`ConversationState` (`src/engine/schema.ts`) is the single source of truth. It holds:

- **Record:** `request`, `answers[]` (append-only events, replaced in place on revision), `edits[]` (pinned Brief edits).
- **Derived:** `intent`, `task` (family, complexity, stakes, expertise), `slots[]` (status, value, candidates with sampled probabilities, consistency-based confidence, impact, score, decision), `contradictions`.
- **Questioning:** `rounds` (with `shownAt`/`answeredAt`), `pending`, `budget`, `stop` (reasons, threshold, max net value, interpretation agreement, critical coverage), `proposals` (Wizard-of-Oz only).
- **Context and experiment:** `memory` (saved context applied at start), `experiment` (study id and condition), `survey`.
- **Output:** `prompts[]` (versions with IR, source and warnings) and `promptStale`.

The derivation is re-run from the record on every turn. Precedence is **edit > answer > stated > engine default**. Because of this, revising an answer or refining the request cannot leave stale values behind. Answered slots survive even if a later analysis stops mentioning them.

The server is stateless: the client sends the state with each action, and the server validates it with Zod before using it. Sessions persist in `localStorage` for history and recovery. Postgres (research `08` §7) comes in when accounts or memory arrive; see `DECISIONS.md` D-3.

## Questioning policy (research `06` §D–F)

- **Uncertainty:** each open slot gets 2–4 candidate values from Stage A. K independent samples each pick one, and p_i = (votes_i + α/n)/(valid votes + α) with α = 2. Confidence = max p. It is never self-reported by the model. Open-ended slots without candidates get U = 0.8.
- **Value:** VOI = U × impact × stakes multiplier. Net = answerability × VOI × ρ(format) − κ × effort(format). Impact priors come from the task templates (`templates.ts`, derived from research `04` §8). Discovered slots are shrunk toward 0.4.
- **Decision per slot:** ask if Net ≥ τ_ask(t) = τ₀(1+α)^asked / stakes. Otherwise show it as an assumption if VOI ≥ τ_show or the slot is critical, or delegate it if it is technical and answerability is low. Everything else is assumed silently. Asked slots are never asked again.
- **Batching:** at most 3 per round, ordered by net value; at most 1 free-text question, placed last; hard contradictions first; rephrased duplicates of earlier questions are filtered by similarity.
- **Stopping:** combinable rules, any of which stops:
  - The user asks to finish, or the operator stops (study mode).
  - The budget is used up (by complexity: 1 → 2 questions in 1 round … 4–5 → 6 questions in 3 rounds).
  - No question clears the threshold (`fast_path` on the first pass).
  - Diminishing returns: a whole round of "you decide" / "not sure" / skipped.
  - **Interpretation convergence:** after at least one round, sampled interpretations agree ≥ 0.8 (impact-weighted) on every remaining choice question.

  The state records `agreement` and `criticalCovered` for analysis. The full output-divergence test (`06` §F.6), which compiles candidate prompts and compares downstream sketches, is deferred (DECISIONS D-17).
- **Contradictions:** at most one per round, asked as a single confirmation question. Answered contradictions become must-have decisions in the composer's brief, the fallback composer and `repairIR`, and appear in the Brief's "Decided" group (D-18).
- **Saved context:** remembered values fill open template slots (status `remembered`) and are passed to Stage A as `<saved_context>` data. Precedence: edit > answer > stated > remembered > engine default (D-19).

All constants are in `POLICY` (`policy.ts`). They are hypotheses to tune against the evaluation harness.

## Renderers (target-specific)

`render.ts` turns the Prompt IR into text, and the target decides the structure (D-20):

| Target | Order and sections | Closing |
|---|---|---|
| Any assistant | Objective → context → requirements → constraints → decisions → assumptions → output → success | none |
| AI app builder | Objective → what we're building → **core features numbered in build order** → constraints and design → your call → assumptions → **not in this version** (nice-to-haves and out of scope) → done when | Working rules: build v1 only, one feature at a time, no unlisted sign-in, payments or pages, report choices and deferrals |
| Coding agent | Objective → context → **constraints (do not break) before requirements** → out of scope → your call → steps → **verification** | Working rules: read code first, smallest change, ask before deleting or changing interfaces, run tests and summarise |

## Study mode (Phase 0 Wizard-of-Oz)

```
Researcher (/study console)                         Participant (/?study=<id>)
  create link (condition auto|wizard) ──► .data/studies/<id>.json ◄── consent (18+) ── start / answer / finish / compose
                                             ▲  (authoritative state,         │   (/api/session with studyId; the
  poll /api/study/<id>?operator=1  ──────────┤   per-study lock,              │    server ignores the client's copy)
  publish round / stop  ── /operator ────────┘   atomic writes)               └─ poll /api/study/<id> while awaiting_operator
  export CSV/JSON ── /api/study/export                                           survey ── /api/study/<id>/survey
```

- In the `wizard` condition, `analyseAndPlan` ends in `holdForOperator`. The engine's round becomes `proposals` (stripped from the participant's view), and `phase` becomes `awaiting_operator`.
- `publishRound` builds the round from operator questions: picked, edited or written, at most 3. An operator question about a detail the engine didn't model creates a discovered slot, so its answer has a place in the Brief.
- `operatorStop` plans with `operator_stopped`. The participant's client sees `ready_to_compose` and composes.
- The participant can "Write it now" at any time, including while waiting.
- Rounds carry `shownAt` and `answeredAt`, and questions carry `source`. The survey records per-question helpfulness and spec fit (1–5).
- Saved context is ignored in study sessions.

## Reliability

- Input caps: request 8,000 characters, answer 2,000, Brief edit 1,000. Zod validation on every request and on the server's own output.
- Retries: the SDK retries 408/409/429/5xx (2 retries), and the provider adds one retry for parse or schema failures. Errors map to typed codes (`rate_limited`, `provider_failed`, …) and from there to clear UI messages with Try again and an alternative path ("Write the prompt without more questions").
- Graceful degradation: failed samples → uniform uncertainty. Failed composition → a deterministic prompt assembled from the brief, clearly labelled.
- Loop prevention: hard budgets, an escalating threshold, never re-asking a slot, and a duplicate-text filter. A test drives 10 rounds of "Not sure" and confirms termination.
- Injection hygiene: user text is passed only inside delimited data blocks; invisible Unicode control characters are stripped; suspected injection is flagged in the UI and treated as text. The composer is told to treat pasted material as reference, not instructions.

## Evaluation (research `09`)

`eval/harness.ts` (library) and `eval/run.ts` (CLI). The benchmark is `eval/data/benchmark-v0.json`: 60 tasks, validated at load time.

- **Arms:**
  - T1: raw seed.
  - T2: "improve this prompt", run by the downstream model.
  - T3: SubText with no questions.
  - T3L: T3 padded to T4's length with generic filler.
  - T4: SubText with a simulated user answering from the hidden intent card.
  - T5: the downstream model asks its own clarifying questions; one turn, simulator answers.
  - T4O: oracle composer that sees the intent card (`--oracle`).
- **Same downstream model for all arms.** With `--k N`, every arm gets N downstream samples.
- **Scoring:**
  - Both-order pairwise judgements, where inconsistent verdicts count as ties; position consistency is reported.
  - Contrasts: T4vT2, T4vT3 and T4vT1 (primary, Holm-corrected), plus T4vT5, T3vT3L and T4vT4O.
  - Wilson CIs and a length-controlled win rate (logistic regression on the log output-length ratio).
  - Must-have/must-not checklist, and the optional anchored 1–5 rubric (`--rubric`).
  - Lexical fact recall per prompt.
  - Questions per specificity stratum, over-asking rate, estimated answering effort and stop reasons.
  - Family classification accuracy.
  - Cost per role at list prices.
- **Outputs:** `eval/results/<timestamp>/` with `report.md`, `report.json`, `items/*.json` and blind `human-eval/pairs.csv` plus `key.csv`.
- **Modes:** `--dry` (mock, no network) and `--estimate` (cost estimate only).

Limitations (also printed in each report and in `VALIDATION_PLAN.md`): simulated users are kinder than real ones; by default the judge shares a provider family with SubText; there's no arm C; T5 allows one turn; and v0 can only detect very large effects.

## Security and privacy

The API key never leaves the server, and the mock is selected when the key is missing or a placeholder. Server logs carry stage names and error messages only, never request content. There is an in-memory per-IP rate limit, which should move to a shared store before multi-instance deployment. Session content is stored only in the user's browser.
