# 09 — Evaluation Framework

**Workstream:** WS6 (Technical architecture & evaluation) · **Date:** 2026-11-13 (accessed dates = this date unless stated) · **Companion:** `08_TECHNICAL_ARCHITECTURE.md` · **Sources:** `sources/WS6_sources.md`
**Scope:** How to know whether SubText produces better outcomes than (a) users writing their own prompts, (b) the free native substitute ("improve this prompt" in the same frontier model), (c) one-shot rewriting without questions, and (d) the frontier model's own clarifying behaviour — and whether each additional question is worth the user's time. Question-selection algorithms are WS5's; technique research is WS2's.

---

## 0. Summary of key findings

1. **Evaluate the downstream output, not the prompt.** A "better-looking" prompt is not the goal; the goal is a better answer from the target LLM for the user's real intent. Prompt-level metrics (requirement recall, length) are diagnostic only. (Design principle; Hypothesis grounded in [Yang et al. 2025/26](https://arxiv.org/abs/2505.13360), who found that adding all requirements to prompts does not consistently improve results — **Verified**.)
2. **The experiment must isolate "questions" from "rewriting".** The decisive contrast is **T4 (SubText with questions) vs. T3 (the same composer with zero questions)**; the commercially decisive contrast is **T4 vs. T2 (user's prompt + "improve this prompt" in the same frontier model)**. A fifth arm, **T5 (the frontier model's own clarifying behaviour)**, is added because native clarification is the most likely substitute and obsolescence path. If T4 does not beat T3 and T2, the thesis fails in its current form.
3. **Power calculation (done, §7):** to detect a pairwise win rate of **0.65 vs. 0.50** with 80% power at Holm-adjusted α = 0.0167 (three primary contrasts) needs **117 non-tied pairs** (exact binomial); with 25% ties, **~152 tasks**. Detecting **0.60** needs **262 non-tied (~346 tasks)**; detecting **0.55** needs **~1,050 non-tied** — impractical, and arguably irrelevant because users would not notice. **Recommendation: benchmark v1 = 300 tasks (100 dev / 200 locked test); v0 = 60 tasks for Phase 0.**
4. **LLM judges are usable but biased; calibrate them.** Strong judges reach >80% agreement with humans, comparable to human–human agreement ([Zheng et al. 2023](https://arxiv.org/abs/2306.05685)), but exhibit position, verbosity and self-enhancement bias (same source); only the largest judges align reasonably and percent agreement alone is misleading ([Thakur et al.](https://arxiv.org/abs/2406.12624)); position bias is systematic and grows when quality gaps are small ([Shi et al.](https://arxiv.org/abs/2406.07791)); LLM judges favour their own generations ([Panickssery et al.](https://arxiv.org/abs/2404.13076)). **All Verified.** Controls: both-order pairwise judging, cross-family judges, length-controlled analysis ([Dubois et al.](https://arxiv.org/abs/2404.04475): length control raised Arena correlation from 0.94 to 0.98), and a 200-pair human calibration set.
5. **Length is the main confound.** SubText's prompts will be longer than users' prompts; longer prompts produce longer outputs; judges prefer longer outputs. Every headline result must be reported **length-controlled**, and a **length-matched control arm** (one-shot rewrite padded to SubText's length) is included.
6. **The cost of a question is human time, not compute.** Inference costs ≈ $0.0005 per extra question on a small model (08 §9). Question value must be justified as **marginal quality gain per question and per second of user time**, measured with forced-stop ablations (k = 0…8 questions) on a simulated-user benchmark and answer-time measurements in the human study (§6).
7. **Relevant benchmarks confirm the problem space is real but also crowded with research:** models under-clarify and answer prematurely ([ClarifyMT-Bench](https://arxiv.org/abs/2512.21120)); struggle to gather critical hidden context ([InfoQuest](https://arxiv.org/abs/2502.12257)); pick the right question only ~40–50% of the time on logic/planning subsets ([QuestBench](https://arxiv.org/abs/2503.22674)); and lose 39% performance in sharded multi-turn conversations while a single consolidated prompt recovers 95.1% of full performance ([Laban et al.](https://arxiv.org/abs/2505.06120)). **Verified.** Disconfirming: CollabLLM shows clarification behaviour can be **trained into** the model itself (+18.5% task performance, +17.6% user satisfaction, −10.4% time in a 201-person study — [Wu et al., ICML 2025 Outstanding Paper](https://arxiv.org/abs/2502.00640)) — i.e., the native substitute (T5) may improve over time.

**Reading discipline:** **Verified** = primary source read; **Claimed** = vendor statement; **Hypothesis** = my design choice or estimate. All thresholds in this document are proposals to be pre-registered, not findings.

---

## 1. What we are evaluating (hierarchy of evidence)

| Level | Question | Primary method | When |
|---|---|---|---|
| L0 Component | Does each stage do its job? (task classification accuracy, slot extraction F1, schema validity, question quality, composer requirement recall/precision) | Unit evals with labelled items; LLM judge with rubric | Every prompt/model change (CI) |
| L1 Offline system | Do SubText prompts yield better downstream outputs than baselines on a fixed benchmark with simulated users? | Paired multi-arm benchmark; pairwise LLM judges calibrated against humans | Phase 0–1; every release |
| L2 Human controlled study | Do real people get better results, faster, than with their own prompts / native tools? | Within-subject crossover study, blind third-party and intent-holder ratings | Phase 2 gate |
| L3 Production | Do users adopt, return, and succeed? | Implicit signals, sampled surveys, A/B tests | Continuous after launch |

L1 is cheap and fast but relies on simulated users; L2 is the only level that tests the real thesis (that real people's answers to our questions improve outcomes). **L1 can kill the idea cheaply; only L2 can confirm it.**

---

## 2. Arms (conditions)

All arms send their final prompt to the **same pinned downstream model(s)** with identical generation settings. Run with **at least two downstream targets from different providers** (e.g., GPT-6.1 Sol and Claude Sonnet 5.5) to check generality.

| Arm | Input the user provides | Transformation | Final prompt sent to target | Isolates |
|---|---|---|---|---|
| **T1 Floor** | Vague seed request only | none | Seed as-is | Lower bound |
| **C Control** | User writes their own prompt (knowing their intent) | none | User prompt | Status quo |
| **T2 Native improve** | Same user prompt as C | Same frontier target model, instruction "Improve this prompt" (fixed wording, single call) | Improved prompt | The free substitute available today |
| **T3 One-shot rewrite (no questions)** | Vague seed request (same start as T4) | SubText composer with questions disabled (N = 0), explicit assumptions allowed | Rewritten prompt | **Value of our composer without questions** |
| **T3b Rewrite of user prompt** | Same user prompt as C | SubText composer, N = 0 | Rewritten prompt | Our composer vs. T2's generic improver |
| **T3L Length-matched** | Vague seed | T3 rewrite expanded to match T4's prompt length (filler: restated generic best practices, no new information) | Padded prompt | Whether length alone explains gains |
| **T4 SubText** | Vague seed, then answers to SubText questions | Full system (adaptive questions → compose → render) | SubText prompt | **The product** |
| **T5 Native clarify** | Vague seed, then answers to the *target model's own* questions | Target model with (a) default behaviour; (b) system instruction "Ask any clarifying questions you need before answering" | Conversation transcript | Strongest substitute: the model asks for itself |
| **T4-Oracle** (offline only) | — | Composer given the full hidden intent card directly | Oracle prompt | Upper bound on information gathering |

**Primary pre-registered contrasts (Holm-corrected, family of 3):** T4 vs. C; T4 vs. T2; T4 vs. T3.
**Secondary:** T4 vs. T5a/T5b; T3 vs. T3L (length effect); T3b vs. T2 (composer vs. native improver); T4 vs. T4-Oracle (headroom); C vs. T2.

**Interpretation map (decision-relevant):**

| Outcome | Interpretation | Implication |
|---|---|---|
| T4 > T3, T4 > T2, T4 > C | Questions add value beyond rewriting and beyond the native substitute | Thesis supported (subject to L2) |
| T4 ≈ T3 > C, T2 | Value comes from rewriting, not questions | Pivot: one-shot rewriter, minimal friction |
| T4 ≈ T2 | Native "improve" is as good | No differentiated product in this form |
| T4 ≈ T5 | Model's own clarification suffices | Obsolescence risk is current, not future |
| T3 ≈ T3L | Gains are mainly length | Composer adds little information |
| T4 ≪ T4-Oracle | Questioning misses material information | Invest in engine (WS5) |

---

## 3. Controls for known confounds

| Confound | Control |
|---|---|
| **Model version / nondeterminism** | Pin snapshot IDs (Anthropic IDs are pinned snapshots from the 4.6 generation on — [models overview](https://platform.claude.com/docs/en/about-claude/models/overview)); fixed temperature and settings; log full requests/responses; generate **k = 3 samples per item per arm** and average (outputs vary even at temperature 0 because inference is not batch-invariant: one test produced 80 unique completions out of 1,000 at T = 0 — [Thinking Machines, Sept 2025](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/), **Verified**). Re-run a fixed anchor set whenever a judge or target version changes. |
| **Task difficulty** | Stratify tasks by category × difficulty × seed specificity; paired design (every arm runs on every task); task as random effect in models |
| **User skill** | L1: three human-written C prompts per task from writers of differing prompting skill (novice/intermediate/expert, by screener); L2: stratified recruitment by a short skill screener; skill as covariate and moderator (the product may help novices and hurt experts) |
| **Order / learning effects** | L2: counterbalanced crossover (AB/BA, Latin square over tasks); test period × condition interaction; washout by using different tasks per condition |
| **Position bias (judges)** | Judge each pair twice with swapped order; count a win only if consistent in both orders, otherwise tie ([Zheng et al.](https://arxiv.org/abs/2306.05685); [Shi et al.](https://arxiv.org/abs/2406.07791)) |
| **Length / verbosity bias** | Record prompt and output token lengths; report length-controlled win rates via regression on length difference ([Dubois et al.](https://arxiv.org/abs/2404.04475)); include T3L; judge rubric explicitly penalises padding |
| **Self-preference** | Judges from ≥2 providers; at least one judge from a family that produced neither the composer's nor the target's outputs; report per-judge results and require directional agreement ([Panickssery et al.](https://arxiv.org/abs/2404.13076)) |
| **Time spent** | Record active time per arm; report quality per minute and time-to-satisfactory (§6); never compare quality without reporting time |
| **Simulator artefacts (L1)** | Simulator answers only from the intent card; says "no preference / don't know" otherwise; audited by humans (§4.4) |
| **Overfitting to the benchmark** | Locked test split, used only at release gates; DSPy/prompt iteration on dev split only |
| **Researcher degrees of freedom** | Pre-register contrasts, metrics, thresholds and analysis code before L2 |

---

## 4. Benchmark dataset proposal

### 4.1 Size and splits
- **v0 (Phase 0): 60 tasks** (8 categories × ~7–8), enough to develop the harness and detect very large effects (win rate ≥ 0.70 needs 49 non-tied pairs at α = 0.05 — §7).
- **v1: 300 tasks = 100 dev + 200 locked test.** With 25% ties the test split gives ~150 non-tied pairs → minimum detectable win rate ≈ 0.61 at α = 0.05, ≈ 0.63 at α = 0.0167 (§7). 300 also allows ~35–40 tasks per category for directional per-category reads (not powered per category).
- **Seed-specificity strata:** 60% vague (e.g., "Help me study ML"), 25% partially specified, **15% already well specified**. The last stratum tests **over-asking**: the ideal system asks ~0 questions and does not degrade a good prompt.

### 4.2 Task categories (provisional; to be aligned with WS2's taxonomy)
1. Professional writing & communication (emails, cover letters, announcements)
2. Software & building (website, script, app feature, spreadsheet formula)
3. Learning & study plans
4. Research & analysis (market research, literature overview, comparison)
5. Data & quantitative tasks (analysis plan, SQL, chart spec)
6. Creative & marketing (copy, story, social posts)
7. Planning & decisions (trip, project plan, business plan, decision memo)
8. Explanation & advice (technical explainer, how-to; excluding regulated medical/legal/financial advice — WS8)

### 4.3 Item schema

```jsonc
{
  "id": "bm-0042",
  "version": "1.0",
  "split": "dev|test",
  "category": "research_analysis",
  "difficulty": "easy|medium|hard",          // rated by 2 authors; disagreements resolved
  "seed_specificity": "vague|partial|full",
  "seed_request": "Research the market for my startup",
  "intent_card": {                            // hidden ground truth; drives simulator + judges
    "persona": "Founder of a 3-person B2B SaaS doing invoice automation for UK dental clinics",
    "goal": "Decide whether to expand to Ireland next year",
    "facts": [
      { "slot": "product", "value": "invoice automation for dental clinics", "materiality": "high" },
      { "slot": "geography", "value": "UK now, considering Ireland", "materiality": "high" },
      { "slot": "decision", "value": "go/no-go on Ireland expansion", "materiality": "high" },
      { "slot": "output_format", "value": "2-page memo with sized market and top 5 risks", "materiality": "medium" },
      { "slot": "budget_for_tools", "value": "none; public data only", "materiality": "medium" },
      { "slot": "tone", "value": "plain English for a non-technical co-founder", "materiality": "low" }
    ],
    "preferences_if_asked": { "citations": "yes, with links", "length": "short" },
    "unknowns": ["exact number of Irish clinics"]  // simulator answers "don't know"
  },
  "must_have": [                              // checklist for requirement adherence (judge + human)
    "Addresses Ireland expansion decision explicitly",
    "Estimates addressable market (number of clinics / revenue) with method shown",
    "Uses only publicly available data sources",
    "Lists top risks"
  ],
  "nice_to_have": ["Compares to UK baseline", "Suggests validation steps"],
  "must_not": ["Generic startup market-research template ignoring dental/Ireland", "Invented statistics presented as fact"],
  "reference_prompt": "...",                  // expert-written fully specified prompt (optional; used for T4-Oracle sanity)
  "human_prompts": [                          // C-arm prompts collected once from writers who read the intent card
    { "writer_skill": "novice", "text": "..." },
    { "writer_skill": "intermediate", "text": "..." },
    { "writer_skill": "expert", "text": "..." }
  ],
  "simulator_profile": "cooperative|terse|uncertain|verbose",
  "output_type": "memo",
  "provenance": "authored|adapted_from:<source>",
  "license": "CC-BY-4.0"
}
```

### 4.4 Simulated users (L1)
- An LLM role-plays the intent-holder from `intent_card`, answering only what is asked, choosing among offered options when they match, replying "no preference" or "don't know" for anything not on the card, and following `simulator_profile` (terse, uncertain, verbose…). Precedents: sharded-instruction simulation in [Laban et al.](https://arxiv.org/abs/2505.06120), the collaborative user simulator in [CollabLLM](https://arxiv.org/abs/2502.00640), six user personas in [ClarifyMT-Bench](https://arxiv.org/abs/2512.21120), and hidden-intent personas in [RegretBench](https://arxiv.org/abs/2607.21143). **Verified (abstracts/HTML).**
- **Simulator validation (must pass before L1 results are trusted):** humans audit 50 random transcripts for (a) *leakage* (volunteering unasked facts: target < 5%), (b) *fidelity* (answers consistent with card: target > 95%), (c) *realism* (rated 1–5 vs. real L2 transcripts). Use a simulator model from a different family than the SubText stages.
- Simulated users are kinder than real ones (always answer, never misunderstand). L1 therefore **overestimates** question value; L2 corrects this.

### 4.5 Example items (abridged)

| id | Category | Seed | Key hidden facts (materiality) | Must-have examples |
|---|---|---|---|---|
| bm-0007 | Professional writing | "Write a professional email" | To landlord; boiler broken 9 days; second request; wants repair date within 48 h; UK tenancy; firm but polite (high/high/high/medium) | Mentions prior request & duration; asks for specific date; polite-firm tone; ≤ 200 words |
| bm-0019 | Software | "Build me a website for my business" | Mobile dog-grooming van, Bristol; needs booking + price list; owner non-technical, wants Squarespace not code; 3 pages (high/high/high/medium) | Recommends no-code builder path; booking integration; page outline + copy; no React boilerplate |
| bm-0031 | Learning | "Help me study ML" | Software engineer, strong Python, weak linear algebra; 5 h/week for 12 weeks; goal: ship a recommender at work (high/high/high/high) | 12-week plan sized to 5 h/week; math remediation; project-oriented around recommenders |
| bm-0042 | Research | "Research the market for my startup" | (see schema) | (see schema) |
| bm-0250 | Explanation (well-specified stratum) | "Explain the difference between L1 and L2 regularisation for a junior data scientist, in under 300 words, with one sklearn example." | none missing | Ideal system asks 0–1 questions; over-asking counted as failure |

### 4.6 Additional benchmark uses
- **Renderer A/B:** for each target model, compare generic vs. target-specific renderings of the same IR (08 §8.4).
- **Stopping-rule ablation:** forced stop after k = 0, 1, 2, 3, 4, 6, 8 questions (§6).
- **Component labels:** for 100 dev items, gold labels for task category, missing slots, and "should ask about X" (materiality), enabling L0 metrics such as missing-slot recall and question precision (overlaps WS5 — share labels).

---

## 5. Experimental design

### 5.1 L1 — Offline benchmark (simulated users)
- **Unit:** task × target model × sample (k = 3). For C/T2/T3b, run separately for each of the three human-written prompts and average (captures user-skill variation).
- **Procedure:** run all arms → downstream outputs → pairwise judging for each planned contrast, both orders, ≥ 2 judges → aggregate.
- **Analysis:** (i) win/tie/loss and sign test per contrast; (ii) **Bradley–Terry** model over all arms for a global ranking with bootstrap CIs (the statistical approach popularised by Chatbot Arena — [Chiang et al. 2024](https://arxiv.org/abs/2403.04132); BT is not named in the abstract I read, so treat attribution as Hypothesis); (iii) length-controlled logistic regression: `logit P(T4 wins) = β0 + β1·Δlen_output_std + β2·Δlen_prompt_std + (1|task)`; report `invlogit(β0)` as the LC win rate ([Dubois et al.](https://arxiv.org/abs/2404.04475)); (iv) rubric scores (§8) analysed with paired Wilcoxon signed-rank tests and mixed models; (v) clustered standard errors by task when items have multiple samples ([Miller 2024, "Adding Error Bars to Evals"](https://arxiv.org/abs/2411.00640) recommends treating evals as experiments with proper error analysis — abstract Verified).

### 5.2 L2 — Human controlled study
**Participants:** 72 adults who use ChatGPT/Claude/Gemini at least weekly, stratified by a 5-minute prompting-skill screener (one-third novice / intermediate / advanced). Recruited via a research panel (WS3 to advise on recruitment and incentives).

**Tasks:** two kinds per participant —
- **Scripted tasks (4):** participant receives a short scenario card (persona + situation, written to feel like their own need), enabling objective requirement-adherence scoring against `must_have`.
- **Own task (2):** participant brings a real task they need done this week (ecological validity; only the participant can judge success).

**Design: within-subject crossover, different tasks per condition.**
- Each participant completes half their tasks in **Condition Own-Prompt** (writes their own prompt; we also automatically produce T2 and T3b from it with no extra effort) and half in **Condition SubText** (T4: starts from a one-line request, answers questions).
- Condition order counterbalanced (AB/BA); scripted tasks rotated across conditions by Latin square so each task is done in both conditions by different participants.
- All final prompts are run on the same pinned target model; participants see outputs in a neutral viewer.
- **Supplementary paired design (same task, sequential):** for own tasks, after the Own-Prompt condition the participant also runs SubText on the same task and states a blind preference between the two outputs (order randomised, labels hidden). Because writing a prompt first primes the answers, this estimate is biased in favour of T4 and is reported as an **upper bound**.

**Measures:**
| Measure | Instrument |
|---|---|
| Output quality | Blind third-party raters (pairwise within task across conditions + anchored rubric, §8); intent-holder rating for own tasks |
| Requirement adherence | % `must_have` satisfied (scripted tasks), rated by 2 raters |
| Time | Active time from task start to final prompt; answer time per question |
| Effort | NASA-TLX raw (short form) per condition |
| Satisfaction & intent to use | 1–7 Likert; "Would you use this for a task like this?" |
| Time to satisfactory output | Participants may iterate (re-ask/edit) until they would use the output; capped at 15 min |
| Learning | Skill screener re-administered at end (does SubText teach prompting?) |

**Analysis:** mixed-effects models with random intercepts for participant and task, fixed effects for condition, period, condition × skill; pairwise win rates from blind raters; survival analysis (Kaplan–Meier, Cox) for time-to-satisfactory with censoring at 15 min.

**Sample-size rationale (L2):** effective comparison is between conditions on the same task across participants. For a standardised effect d = 0.4 on rubric score, a two-sample comparison needs 2·(1.96+0.84)²/0.4² ≈ **98 outputs per arm** at α = 0.05 (≈ 131 at α = 0.0167); with a design effect of ~1.2 (3 tasks per participant per condition, ICC ≈ 0.1: DE = 1 + (m−1)·ICC) → ~118–157 per arm. 72 participants × 3 tasks per condition = **216 outputs per condition** → adequate for d ≈ 0.3–0.35 and comfortably for d = 0.4. For the supplementary paired preference, 72 × 2 own tasks = 144 pairs → detects a preference rate ≈ 0.62 (α = 0.05). (Arithmetic in §7; ICC is an assumption to be estimated from a pilot.)

**Pilot:** 10 participants first to estimate ICC, tie rates, time per task and simulator realism.

---

## 6. Is another question worth it? (quality-vs-effort)

1. **Forced-stop ablation (L1):** for each task, run T4 with the engine forced to stop after k ∈ {0, 1, 2, 3, 4, 6, 8} questions (k = 0 equals T3). Plot downstream quality (LC win rate vs. T3, and rubric mean) against k → **marginal gain per question** ΔQ(k) = Q(k) − Q(k−1).
2. **Adaptive vs. fixed:** compare the engine's adaptive stopping with the best fixed k. Success = adaptive reaches ≥ 95% of max(Q(k)) with fewer average questions than the fixed k achieving the same quality. Also measure *over-asking* on the well-specified stratum.
3. **User-time cost (L2):** median answer time per question by form (multiple-choice vs. free text) and by index; abandonment hazard by question index; NASA-TLX.
4. **Marginal value per second:** `MV(k) = ΔQ(k) / t̄_answer(k)`. A question is justified if `MV(k) ≥ λ`, where λ is the user's exchange rate between time and quality. Elicit λ in L2 with a post-task choice ("Would you answer N more questions for an output like B instead of A?") and from production abandonment curves.
5. **Quality-adjusted time to satisfactory output (QATS):** time from start until the participant first obtains an output they rate ≥ 4/5 ("would use with at most minor edits"), including any iterations, censored at 15 min. Compare across conditions with survival analysis. This merges quality and effort into one user-centric number and penalises both slow questioning and poor first outputs requiring re-asks.
6. Report the full **Pareto frontier** (quality vs. seconds) for C, T2, T3, T4 variants and T5. A product that is better but slower may still lose to T2 for most users; the curve shows for which segments (e.g., high-stakes tasks) the extra time is worth it.

Interpretation guard: RegretBench reports that "final success alone is insufficient" — models with similar accuracy differ in efficiency and stopping decisions ([arXiv 2607.21143](https://arxiv.org/abs/2607.21143)); ClarEval explicitly measures friction via Average Turns to Clarify ([arXiv 2603.00187](https://arxiv.org/abs/2603.00187)). **Verified (abstracts).** SubText should report both.

---

## 7. Statistical power — the calculation

**Setting:** paired comparisons on the same task; outcome per task = win/loss (ties excluded from the sign test, retained for reporting). H0: P(win) = 0.5. Two-sided test, 80% power. Sample sizes computed with the normal approximation `n = [(z_{α/2}·0.5 + z_β·√(p(1−p))) / (p − 0.5)]²` and checked by exact binomial search (my script, stdlib Python).

| True win rate p | Non-tied pairs needed, α = 0.05 (normal / exact) | Tasks needed with 25% ties | with 40% ties | Non-tied pairs, α = 0.0167 (Holm, 3 contrasts) (normal / exact) | Tasks with 25% ties |
|---|---|---|---|---|---|
| 0.55 | 783 / 786 | 1,044 | 1,305 | 1,045 / 1,053 | 1,394 |
| **0.60** | 194 / 199 | 259 | 324 | 259 / 262 | 346 |
| **0.65** | 85 / 90 | 114 | 142 | 114 / 117 | 152 |
| 0.70 | 47 / 49 | 63 | 79 | 63 / 67 | 84 |

**Minimum detectable win rate** (α = 0.05, 80% power) by number of non-tied pairs: 100 → 0.638; 150 → 0.613; 200 → 0.598; 300 → 0.581; 400 → 0.570.

**Continuous rubric scores (paired):** `n ≈ ((z_{α/2}+z_β)/d_z)² + z²_{α/2}/2`; Wilcoxon inflates by 1/0.955 (asymptotic relative efficiency).

| d_z | Paired t, α = 0.05 | Wilcoxon, α = 0.05 | Paired t, α = 0.0167 | Wilcoxon, α = 0.0167 |
|---|---|---|---|---|
| 0.2 | 199 | 208 | 265 | 278 |
| 0.3 | 90 | 94 | 120 | 125 |
| 0.4 | 51 | 54 | 69 | 72 |
| 0.5 | 34 | 35 | 45 | 47 |

**Clustering:** with m tasks per participant and intra-class correlation ρ, multiply by DE = 1 + (m−1)ρ (m = 4: ρ = 0.05 → 1.15; 0.1 → 1.30; 0.2 → 1.60; m = 8: 1.35 / 1.70 / 2.40).

**Judge calibration set size:** with observed judge–human agreement of 0.80, the 95% CI half-width is ±0.078 at n = 100, ±0.055 at n = 200, ±0.045 at n = 300 → **200 human-labelled pairs** is the proposed calibration set.

**Conclusions:**
- The benchmark should be powered to detect **win rate ≥ 0.60–0.65**, not smaller effects. A product advantage below ~0.60 (i.e., SubText wins 6 of 10 non-tied comparisons) is unlikely to be perceptible enough to change user behaviour (Hypothesis — validate with L2 preference data).
- 200 locked test tasks (~150 non-tied) detects ~0.61 (α = 0.05) / ~0.63 (α = 0.0167). Using k = 3 samples per item reduces per-item noise (more decisive judgements, fewer ties) but does **not** multiply the effective sample size — tasks are the unit of inference.

---

## 8. Scoring

### 8.1 Downstream-output rubric (anchored, 1–5; judged per output, and pairwise on overall)

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **Task success** (does it achieve the user's actual goal per intent card) | Does not address the real goal or addresses a different task | Partially achieves goal; user would need substantial follow-up | Fully achieves goal; user could act on it immediately |
| **Requirement adherence** (computed: % of `must_have` met; `must_not` violations subtract) | < 40% must-haves or any severe must-not | 60–80% must-haves, no severe violations | 100% must-haves, no violations |
| **Relevance** | Mostly generic or off-topic content | Mix of tailored and generic content | All content specific to this user's situation |
| **Specificity** (concrete, actionable details vs. platitudes) | Vague generalities | Some concrete specifics | Concrete, specific, actionable throughout |
| **Correctness** (factual/technical accuracy; no invented facts) | Major errors or fabricated facts | Minor errors not affecting usefulness | No detectable errors; uncertainty flagged where appropriate |
| **Usefulness / effort saved** | User would discard it | User would keep parts and redo the rest | User would use as-is or with trivial edits |
| **Concision** (penalises padding; length appropriate to need) | Bloated or truncated | Somewhat long/short | Length fits the need exactly |

Judge prompt: rubric with anchors, intent card, must-have list, output; require evidence quotes for each score before the score (G-Eval-style chain-of-thought + form-filling — [Liu et al. 2023](https://arxiv.org/abs/2303.16634), which also warns LLM evaluators may favour LLM-written text). Pairwise prompt: overall preference with "tie" allowed, both orders.

### 8.2 Prompt-level diagnostics (not success metrics)
- **Requirement recall:** share of high-materiality intent facts present in the final prompt.
- **Requirement precision / hallucinated constraints:** constraints in the prompt not supported by the user's answers or seed (should be stated as assumptions, not facts). Guardrail ≤ 5%.
- **Prompt length** (tokens) and **assumption transparency** (assumptions explicitly labelled).

### 8.3 Question-level rubric (L0; shared with WS5)
Materiality (would the answer change the output?), non-redundancy (not already answered/inferable), clarity, answerability (user can answer quickly; offers sensible options), neutrality (not leading), burden (time to answer). 1–5 anchored scales, judged per question with the intent card.

### 8.4 Inter-rater agreement
| Data | Statistic | Target |
|---|---|---|
| Human pairwise preferences (3 raters, nominal win/tie/loss) | Fleiss' κ and Krippendorff's α (nominal) | α ≥ 0.667 to use; ≥ 0.80 for confident conclusions (Krippendorff's conventions, [Wikipedia summary](https://en.wikipedia.org/wiki/Krippendorff%27s_alpha)) |
| Human rubric scores (ordinal 1–5, any number of raters, missing allowed) | Krippendorff's α (ordinal) | same |
| Averaged rubric score reliability | ICC(2,k), two-way random, absolute agreement; report 95% CI; poor < 0.5, moderate 0.5–0.75, good 0.75–0.9, excellent > 0.9 ([Koo & Li 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC4913118/)) | ≥ 0.75 (CI-based) |
| Judge vs. human (per judge) | Cohen's κ (weighted for ordinal) plus raw agreement; never raw agreement alone ([Thakur et al.](https://arxiv.org/abs/2406.12624)) | Judge–human agreement within the CI of human–human agreement |
| Judge position consistency | % identical verdict across swapped orders ([Shi et al.](https://arxiv.org/abs/2406.07791)) | ≥ 80% (else change judge/prompt) |

**Judge selection procedure:** (1) humans label 200 calibration pairs (3 raters each); (2) compute human–human α; (3) evaluate candidate judges (≥ 2 providers; optionally Prometheus 2 as an open evaluator — [Kim et al.](https://arxiv.org/abs/2405.01535)); (4) accept judges whose agreement with the human majority is within the human–human range and whose length sensitivity (LC regression slope) is not larger than humans'; (5) freeze judge model + prompt version for the evaluation period; re-calibrate on 50 fresh pairs per judge change.

---

## 9. Success metrics

### 9.1 Product north-star (proposed)
**Weekly successful sessions** = sessions in which the user copies/exports the prompt *and* reports (sampled micro-survey) or implies (no re-run within 10 min, no "start over") that the downstream result met their need. Rationale: captures value delivered, not usage alone. (Hypothesis; WS7 may prefer a revenue-linked metric.)

### 9.2 Evaluation primary endpoints (pre-registered)
- **E1:** Length-controlled pairwise win rate of T4 vs. T2 on downstream outputs (L1 test split and L2).
- **E2:** LC win rate of T4 vs. T3 (value of questions).
- **E3:** LC win rate of T4 vs. C.
- **E4 (L2):** Median QATS, T4 vs. Own-Prompt condition.

**Proposed decision thresholds (Hypothesis — to pre-register):**
- **Go:** E1 and E2 lower 95% CI > 0.50 with point estimates ≥ 0.60 on L1 test, replicated directionally in L2; E4 not worse than Own-Prompt by more than 60 s median.
- **Pivot to rewriter:** E2 CI includes 0.5 while T3 beats C and T2.
- **Stop / rethink:** E1 CI includes 0.5 (no advantage over the free native substitute), or T5 ≥ T4.

### 9.3 Guardrails
| Guardrail | Proposed threshold |
|---|---|
| Median questions per session (vague stratum) | ≤ 4 |
| Over-asking on well-specified tasks (≥ 2 questions) | ≤ 20% of such tasks |
| Session abandonment before prompt delivered | ≤ 20% (L2), monitored in production |
| Median active time to prompt | ≤ 120 s (vague tasks) |
| Hallucinated constraints in prompt | ≤ 5% of prompts |
| Degradation of already-good prompts (T3b vs. C on expert-written prompts) | LC win rate not < 0.45 |
| p95 question-turn latency | ≤ 3.5 s (08 §10) |
| Cost per session | ≤ $0.05 (08 §9) |
| Subgroup harm | No skill tier with LC win rate vs. C < 0.45 |

---

## 10. Evaluation cost estimate (one full L1 run; Hypothesis on token counts)

- Downstream generation: 300 tasks × 7 arms ≈ 2,100 outputs × (1,000 in + 2,000 out) on a $2/$10 model ≈ 2,100 × $0.022 ≈ **$46** (× 3 samples ≈ $139).
- Judging: 6 contrasts × 300 tasks × 2 orders × 2 judges = 7,200 calls × (4,500 in + 600 out) at $2/$10 ≈ 7,200 × $0.015 ≈ **$108**.
- SubText pipeline + simulator: < $15.
- **Total ≈ $170–270 per full run at standard prices; roughly half via Batch APIs** (50% discounts — [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI](https://developers.openai.com/api/docs/pricing), [Gemini](https://aistudio.google.com/docs/pricing)).
- Human costs dominate: 200 calibration pairs × 3 raters × ~3 min ≈ 30 rater-hours; L2 study 72 participants × ~75 min plus third-party rating of ~430 outputs. Budget estimate (Hypothesis): **$3k–6k** for L2 including incentives and rating, depending on panel rates (WS3).

---

## 11. Failure-analysis methodology

1. **Sample:** all T4 losses vs. T2/T3 on the dev split + a random 20% of T4 wins (to avoid only studying losses) + all guardrail violations.
2. **Code** each case with the taxonomy below; two annotators; report Krippendorff's α on a 20% overlap; adjudicate disagreements.
3. **Attribute to stage with counterfactual replay** (the "oracle ladder"):
   - Replace the intent state with the **oracle state** (all intent-card facts) → if T4 now wins, the failure is upstream (questioning/integration).
   - Replace only *integration* (keep questions, use gold answers parsed perfectly) → isolates answer integration.
   - Replace the composer with an expert-written `reference_prompt` → if still losing, the downstream model or the task is the bottleneck.
   - Swap renderer generic ↔ target-specific → renderer effect.
4. **Quantify:** failure counts by category × task category × skill tier; prioritise by frequency × severity × fixability.
5. **Feed back:** each fixed failure becomes a regression test in the dev split (L0/L1); never add test-split items to prompts.

| Code | Failure | Stage |
|---|---|---|
| F1 | Intent misread / wrong task type | Analyse |
| F2 | Missed a material gap (should have asked) | Engine |
| F3 | Low-value or irrelevant question | Engine / Question gen |
| F4 | Redundant question (already answered or inferable) | Engine / state |
| F5 | Leading or confusing question; poor options | Question gen |
| F6 | Over-asking (too many questions for value) | Engine stop rule |
| F7 | Stopped too early | Engine stop rule |
| F8 | Answer mis-integrated or lost | Update / state |
| F9 | Composer dropped a requirement | Compose |
| F10 | Composer hallucinated a constraint / presented assumption as fact | Compose |
| F11 | Over-constrained or bloated prompt degraded output ([Yang et al.](https://arxiv.org/abs/2505.13360)) | Compose |
| F12 | Target-format mismatch | Renderer |
| F13 | Downstream model failed despite good prompt | Target model |
| F14 | Simulator artefact (unrealistic answer/leakage) | Eval harness |
| F15 | Judge error (verified by human review) | Eval harness |

---

## 12. Evaluation in production

### 12.1 Implicit and explicit signals

| Signal | Definition | What it indicates | Caveats |
|---|---|---|---|
| **Copy / export rate** | % sessions where final prompt copied or exported | Perceived usefulness | Copy ≠ success downstream |
| **Edit distance** | Normalised Levenshtein (or token-level) distance between generated and copied/saved prompt | Large edits → composer missed intent | Some edits are healthy personalisation; segment by edit type |
| **Regenerate / recompose rate** | % sessions with re-composition | Dissatisfaction with first prompt | |
| **Re-ask / return-to-session rate** | User returns to the same session within 30 min to refine | Downstream result insufficient | Extension needed to observe downstream directly — avoid reading third-party outputs (08 §14) |
| **"Just write it" / skip rate** | % sessions where user bypasses questions; % questions skipped | Question friction too high | High skip on specific question types → engine fix |
| **Abandonment by question index** | Hazard of leaving at question k | Patience curve; informs λ (§6) | |
| **Thumbs / 1–5 rating** | Explicit rating on prompt | Satisfaction | Low response rates, selection bias |
| **Downstream-outcome micro-survey** | Sampled 10%: "Did the AI's answer do what you needed?" next visit | Closest proxy to real outcome | Recall bias |
| **Return rate** | D7/D30 return; sessions per active user | Habit/value | Confounded by marketing |
| **Sampled online judge** | LLM judge on consented, redacted production prompts (prompt-level rubric) | Drift detection | Privacy consent required (WS8) |
| **Operational** | Latency p50/p95, schema failures, fallback rate, cost/session | Health | |

### 12.2 Online experimentation
- Session-level (or user-level for multi-session effects) randomisation for engine/composer variants; primary metric = successful-session rate; guardrails = abandonment, time to prompt, latency.
- Use variance reduction (pre-period covariates, e.g., CUPED) and sequential testing with pre-set stopping boundaries to avoid peeking bias.
- Canary new model/prompt versions to ~5% with automatic rollback on guardrail breach.
- **Monthly offline regression** on the locked test split with pinned judges, and **replay** of a sample of production states (08 §4.2) against candidate versions before rollout.

### 12.3 Model-upgrade gate
A new model or prompt version ships only if (a) L0 component metrics are non-inferior (margin pre-set), (b) L1 dev win rate vs. current production ≥ 0.5 with no guardrail regressions, (c) cost and latency within budget. Test split checked at most once per release cycle.

---

## 13. Tooling

| Tool | Status / facts | Use in SubText | Source |
|---|---|---|---|
| **Inspect AI** | Open-source eval framework from UK AI Security Institute and Meridian Labs; datasets → solvers (single call to multi-turn agents) → scorers (incl. model-graded); log viewer; 20+ providers | **L1 harness** — multi-turn solver with simulated user; model-graded pairwise scorers | [inspect.aisi.org.uk](https://inspect.aisi.org.uk/) — Verified |
| **promptfoo** | Open-source CLI/library for side-by-side prompt/model matrices, assertions, CI, red-teaming; OpenAI announced acquisition 2026-03-09 and said it would keep the OSS project | **L0 CI regression** of stage prompts; consider vendor-neutrality risk | [docs](https://www.promptfoo.dev/docs/intro/) Verified; acquisition [OpenAI](https://openai.com/index/openai-to-acquire-promptfoo/) `[snippet only]` |
| **Langfuse** | OSS tracing, datasets, annotation queues; Cloud from free | Production traces, human annotation queues for calibration | [pricing](https://langfuse.com/pricing) Verified |
| **Braintrust / LangSmith** | Hosted eval + tracing; self-host enterprise-only | Alternatives with stronger eval UX | [secondary](https://www.developersdigest.tech/blog/llm-observability-acquisitions-2026) |
| **Pydantic Evals** | Grades outputs and trajectories on datasets or sampled production traffic | If Python stack | [docs](https://pydantic.dev/docs/ai/overview/) (Claimed) |
| **DSPy (GEPA, MIPROv2)** | Prompt/program optimisation against a metric + labelled examples | Phase 3: optimise stage prompts on dev split only | [dspy.ai](https://dspy.ai/) Verified |
| OpenAI Evals | Not reviewed from a primary source in this workstream | — | — |

---

## 14. Related benchmarks (for borrowing method, not for direct use)

| Benchmark | What it measures | Relevance | Source |
|---|---|---|---|
| Laban et al. "Lost in Multi-Turn" | Sharded vs. concatenated instructions; 39% drop in multi-turn; Concat ≈ 95.1% of Full | Core justification for "consolidate into one prompt"; simulation method | [arXiv 2505.06120](https://arxiv.org/abs/2505.06120) |
| What Prompts Don't Say | Underspecification; models infer unstated requirements 41.1% of the time; underspecified prompts ~2× more likely to regress across model/prompt changes; adding all requirements not consistently helpful | Guards against "longer is better"; supports explicit requirements for robustness | [arXiv 2505.13360](https://arxiv.org/abs/2505.13360) |
| QuestBench | Choosing the minimal necessary question; ~40–50% on Logic-Q/Planning-Q | Question-selection component eval (WS5) | [arXiv 2503.22674](https://arxiv.org/abs/2503.22674) |
| ClarifyMT-Bench | Multi-turn ask-vs-answer; 6,120 dialogues; under-clarification bias | Simulator personas; over/under-asking metrics | [arXiv 2512.21120](https://arxiv.org/abs/2512.21120) |
| InfoQuest | Hidden-context open-ended dialogue; assistants struggle to gather critical info | Scenario-generation method for benchmark authoring | [arXiv 2502.12257](https://arxiv.org/abs/2502.12257) |
| IN3 / Mistral-Interact | Implicit intention; upstream clarification module before agent | Architectural precedent | [arXiv 2402.09205](https://arxiv.org/abs/2402.09205) |
| ClarEval | Code agents under ambiguity; Average Turns to Clarify, Key Question Coverage | Friction-aware metrics | [arXiv 2603.00187](https://arxiv.org/abs/2603.00187) |
| RegretBench | Clarification as sequential policy; regret vs. reference policy | Stop-rule evaluation | [arXiv 2607.21143](https://arxiv.org/abs/2607.21143) |
| CollabLLM | Multiturn-aware rewards; user study (201): +17.6% satisfaction, −10.4% time | Reference effect size; evidence native models can learn to clarify | [arXiv 2502.00640](https://arxiv.org/abs/2502.00640) |
| MT-Bench / Chatbot Arena | LLM-as-judge validity; pairwise crowd preference | Judge methodology | [2306.05685](https://arxiv.org/abs/2306.05685), [2403.04132](https://arxiv.org/abs/2403.04132) |
| AskBench, UserBench | Interactive clarification; simulated users with incrementally revealed preferences | Additional simulator designs | [AskBench](https://arxiv.org/html/2602.11199v1), [UserBench](https://arxiv.org/html/2507.22034v1) `[snippet only]` |

---

## 15. Unresolved questions

1. What win-rate difference users actually perceive and value (is 0.60 enough to change behaviour?) — needs L2 preference data.
2. How realistic LLM-simulated users are for this task (answer brevity, misunderstanding, impatience); how much L1 overstates question value.
3. Whether judge rankings on downstream outputs match intent-holder satisfaction for *own* tasks (only the intent-holder knows the real goal).
4. Tie rates under both-order judging (assumed 25–40% in power calculations).
5. ICC of outcomes within participant (assumed 0.1) — pilot needed.
6. Whether results generalise across target models (a prompt that helps GPT may not help Claude).
7. Native-substitute trajectory: how often current ChatGPT/Claude/Gemini already ask clarifying questions by default (WS1/WS5) — T5 measures it at one point in time only.
8. Ethical/consent requirements for sampled production judging and for any study using participants' real tasks (WS8).

## 16. Validation experiments (ordered)

| # | Experiment | Cost/time | Kills or confirms |
|---|---|---|---|
| X1 | L1 on v0 (60 tasks): T1, C, T2, T3, T4-lite (Architecture A), T5 | ~1 week, < $100 tokens + C-prompt collection | Early kill if T4 ≈ T3 ≈ T2 with large n of ties |
| X2 | Judge calibration: 200 human-labelled pairs | ~30 rater-hours | Whether LLM judges can be trusted for this task |
| X3 | Simulator audit (50 transcripts) | 1 day | Whether L1 is meaningful |
| X4 | Forced-stop ablation k = 0…8 | < $50 | Shape of quality-vs-questions curve; informs WS5 stop rule |
| X5 | Length-matched control T3L | < $20 | Whether gains are length artefacts |
| X6 | L1 v1 test split (200 tasks), two target models | ~$300 | Release gate |
| X7 | L2 pilot (10 participants) → full L2 (72) | ~4–6 weeks, $3k–6k | **The decisive test of the thesis** |
