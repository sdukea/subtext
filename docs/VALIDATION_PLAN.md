# Validation Plan (Phase 0)

Source: `research/14_DEVELOPMENT_ROADMAP.md` Phase 0, `research/01` §4 (kill criteria), `research/09` (evaluation), `research/05` §16–17 (interviews, Wizard-of-Oz). This document maps that plan onto what this repository can now run, and lists what still has to be done by people.

**The question Phase 0 answers:** does a SubText brief produce better downstream results than (a) the raw request, (b) asking the same model to "improve this prompt", (c) SubText's own rewrite without questions, and (d) the model's own clarifying questions, by enough to matter, and will builders come back to it?

Nothing in this repository is evidence yet. No real-model run, no participant session and no interview has happened.

## Evidence types, never mixed

| Type | Where it comes from | How it's labelled |
|---|---|---|
| **Synthetic** | `npm run eval`: simulated users answering from hidden intent cards, LLM judges | Every report says "synthetic (simulated users, LLM judges)" |
| **Human study** | `/study` sessions with real adult participants on their own tasks | Export header says "human participants (Phase 0 study prototype)" |
| **Human rating** | Blind pairs from `eval/results/<run>/human-eval/pairs.csv` rated by people | Stored separately with the key file |
| **Production** | None. There is no deployment and there will be none in Phase 0 | — |
| **Development mock** | Keyword templates when no API key is set | Banner in the UI, "DRY RUN" in eval reports. Never evidence |

## Experiments

### E1. Offline head-to-head (synthetic) — `npm run eval`

- **Benchmark:** `eval/data/benchmark-v0.json`, 60 authored tasks. 24 app builds and 16 coding tasks (40 builder), plus 10 research and 10 writing (20 document). By seed specificity: 36 vague, 15 partial and 9 fully specified (the last tests over-asking). Each task has a hidden intent card, must-have and must-not checklists, and a simulator profile.
- **Arms:**
  - T1: raw seed.
  - T2: "improve this prompt", run by the downstream model.
  - T3: SubText with no questions.
  - T3L: T3 padded to T4's length with filler that adds no information.
  - T4: SubText with simulated answers.
  - T5: the downstream model told to ask clarifying questions first; the simulator answers.
  - T4O (`--oracle`): the composer sees the full intent card, an upper bound.
- **Controls:**
  - Every prompt goes to the same downstream model with the same settings.
  - Pairwise judgements run in both orders, and inconsistent verdicts count as ties.
  - Length-controlled win rate: logistic regression on the log output-length ratio.
  - Holm correction across the three primary contrasts.
  - Wilson confidence intervals.
  - Judge position consistency is reported.
  - `--k 3` gives repeated downstream samples.
  - `--rubric` adds the anchored 1–5 rubric.
- **Outputs:** `eval/results/<timestamp>/` holds `report.md`, `report.json`, `items/*.json` and `human-eval/{pairs.csv,key.csv}`.
- **Cost:** `npm run eval -- --estimate` prints a rough list-price estimate: about $0.72 per item at k = 1, or about $43 for all 60 items with the default models. Token counts in the estimate are assumptions; each real report records actual usage.
- **Suggested sequence:**
  1. `--dry`, which is free.
  2. `--limit 6`, about $4. Check the transcripts and the simulator's behaviour by hand.
  3. A full 60-item run.
  4. `--k 3 --oracle` on the builder half, if E1 looks promising.

### E2. Questioning experiment (human) — `/study`

Research/05 §17.2 and research/14 week 2. It compares who chooses the questions, holding the rest of the product constant.

- **Conditions:**
  - **Automated:** the engine's policy chooses the questions.
  - **Wizard-of-Oz:** a researcher sees the engine's proposals, the Brief and the slot scores, then picks, edits or writes up to 3 questions per round, or stops.
  - In both conditions the participant sees the same interface and the same waiting state.
- **What's recorded for each question:**
  - Its source: `model`, `operator_selected`, `operator_edited` or `operator_written`.
  - Its slot, format and options.
  - The engine's net value for that slot.
  - The participant's answer type (option, text, "you decide", "not sure" or skipped).
  - Round timing, measured from when the round is shown to when it's answered.
  - Whether the participant said the question helped.
- **Recorded per session:**
  - Question and round counts.
  - Brief edits and kept assumptions.
  - Stop reasons.
  - Spec length and whether the participant edited it.
  - Spec-fit rating (1–5).
  - An optional comment.
- **Comparisons this supports:**
  - Helpfulness rate of model versus operator questions.
  - Questions per session and seconds per round.
  - Share of "you decide", "not sure" and skipped answers, an indicator of low-value questions.
  - Spec fit.
  - Which engine proposals researchers rejected or rewrote. This is direct input for tuning `POLICY` and the slot priors.
- **Design:**
  - Within-subjects, with 2–3 real tasks per participant and counterbalanced condition order.
  - Use a fresh link per task: one link is one session in one condition.
  - Aim for 10–12 participants in the pilot, and 30–36 for research/05's target.
- **Blinding:** the consent text says a researcher may help choose questions in some sessions, but not which ones. Debrief participants after their final session.

### E3. Interviews and demand (manual, not built here)

research/14 week 1: 15–20 builder interviews with the guide in `research/05` §16, three fake-door landing pages, and a Van Westendorp survey. None of these are in this repository, by design. They need a person and an audience, not code.

### E4. Concierge repeat use (manual + this prototype)

10 builders use the prototype on real projects for 2–3 weeks; the outcome measure is unprompted second use. The prototype's normal mode (not `/study`) keeps sessions and saved context in the participant's browser, so repeat use has to be self-reported or observed in sessions. Server-side usage logging was deliberately not built (privacy defaults, research/11).

## Decision gate (end of week 4)

All thresholds are pre-registered assumptions from research. Record the decision in `research/DECISION_LOG.md`.

| Kill criterion (research/01 §4) | Measured by | Threshold |
|---|---|---|
| Native clarification is as good | E1 T4 vs T5 and T4 vs T2, then E2 | SubText preferred in < 55% of non-tied pairs vs the best native baseline |
| Questions don't beat rewriting | E1 T4 vs T3 | No significant win |
| The gain doesn't survive iteration | Not measurable offline; needs a time-to-acceptable measure in E2/E4 | No reduction in iterations or time |
| No pull | E3 | < 10% landing → waitlist; < 40% of interviewees report a wasted build in the past month |
| No repeat use | E4 | < 20% produce a second brief unprompted |

**Go** (research/09 §9.2): T4 vs T2 and T4 vs T3 both have a lower 95% CI above 0.50 with point estimates ≥ 0.60, replicated directionally with humans.

## Known limitations of the instruments

- **Simulated users are kinder than real ones.** They always answer and never misunderstand, so E1 overestimates the value of questions. The simulator hasn't yet been audited (research/09 §4.4 target: < 5% leakage, > 95% fidelity on 50 transcripts).
- **Self-preference risk.** By default the judge (Opus 5.5) is from the same provider family as SubText's models and the downstream model. Use `--judge` with a different provider before drawing conclusions. A cross-provider judge needs another provider's API key and an adapter; the judge calls are isolated in `eval/harness.ts` (`EvalLlm`).
- **No arm C yet.** Human-written control prompts don't exist yet, so T2 improves the seed instead of a user's own prompt. T4 vs T1 stands in for T4 vs C.
- **T5 is limited.** It allows one clarification turn and uses the API model, not the consumer app's Plan mode.
- **The benchmark is authored.** All 60 tasks were written by the team, there's no locked test split, and v0 can only detect very large effects (research/09 §7).
- **The convergence stop rule is a simplified version.** It uses agreement of sampled interpretations, not the full output-divergence test (`docs/ARCHITECTURE.md`).
- **Wizard-of-Oz timing includes polling delay.** Rounds are timestamped when published, so the participant's display lags by up to 1.5 s.

## Before any real participant session

- [ ] A real `ANTHROPIC_API_KEY` in `.env.local`, then a probe and a 6-item eval pilot, reviewed by hand.
- [ ] Set `SUBTEXT_OPERATOR_KEY` if the console is reachable by anyone else.
- [ ] Run the app on the researcher's machine, or put it behind access control. **Do not deploy publicly**: there are no accounts, and the rate limit is per process.
- [ ] Ethics and consent text reviewed by whoever is responsible for the study. The current text is a draft.
- [ ] Legal items below reviewed if participants are outside your jurisdiction.
- [ ] A debrief script for the Wizard-of-Oz condition.

## Legal and privacy items that need professional advice (from research/11)

These aren't resolved, and the prototype makes no compliance claim.

- Anthropic Commercial Terms D.4 ("competing product") and its applicability to a prompt and brief product (OQ-10).
- GDPR / UK GDPR basis for processing participant text in a study, plus the retention period. India DPDP applicability (OQ-11).
- EU AI Act Art. 50 transparency for AI-generated text (OQ-12).
- Provider data policies: confirm the API organisation's data-retention settings before using real participant data.
- Privacy policy, terms and a sub-processor list before any public launch (research/11 pre-launch checklist). The in-app privacy note is a factual description, not a policy.
