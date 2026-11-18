# 01 — Product Thesis Validation

**Owner:** Coordinator (synthesis across WS1–WS8 + red-team research)
**Date:** 2026-11-18 (research conducted 2026-11-13 to 2026-11-18)
**Sources:** cited inline. Coordinator-gathered sources are `[RT-n]` in `sources/RT_sources.md`; others are in the workstream source files and the merged `SOURCE_REGISTER.md`.
**Labels:** **Verified** = primary source read by an agent and, where marked ✔, re-checked by the coordinator. **Claimed** = vendor/self-report or untraced secondary. **Hypothesis** = our inference.

---

## 1. The thesis as stated

> A product that accepts a vague request, detects missing/ambiguous information that materially affects the result, asks adaptive follow-up questions only while their value exceeds their friction, and composes a structured, model-aware prompt the user can edit, copy and export, making sophisticated prompt engineering accessible to non-experts.

We broke it into seven testable claims and graded each against the evidence.

| # | Claim embedded in the thesis | Verdict | Confidence | Key evidence |
|---|---|---|---|---|
| T1 | Users' vague prompts materially hurt output quality | **Partly true.** It is real for a minority of tasks: long, high-stakes "doing" tasks. Most usage is low-stakes. | Medium-high | Intent misunderstanding is the top cause of dissatisfaction with ChatGPT (32%), and 72% of dissatisfactions stay unresolved ([Kim et al., IUI 2024](https://arxiv.org/html/2311.07434v3)). >23% of OpenAssistant queries are severely under-specified ([Herlihy et al., MSR](https://microsoft.com/en-us/research/uploads/prodnew/2024/06/Overcoming_RLHF.pdf)). But 49% of ChatGPT messages are "Asking", and ~two-thirds of writing requests edit user-supplied text ([NBER w34255](https://www.nber.org/papers/w34255)). See `05_USER_RESEARCH.md` §0–1. |
| T2 | Users know what they want but can't articulate it | **Partly true, and not the main story.** Intent often *forms through iteration*, and experienced users iterate more, not less. | Medium | Experienced Claude users are "much less likely" to use one-shot directive patterns and succeed ~3–5 pp more ([Anthropic Economic Index, Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)). Iteration is near-universal ([NN/g](https://www.nngroup.com/articles/accordion-editing-apple-picking/)). The "gulf of envisioning" has three parts: capability, instruction and intentionality ([Subramonyam et al., CHI 2024](https://arxiv.org/html/2309.14459v2)). |
| T3 | Supplying missing information improves outputs | **True, with an important caveat.** Missing requirements matter more than technique. Specifying *everything* backfires. | High | LLMs guess unstated requirements correctly by default in only 41.1% of cases. Specifying many requirements cut accuracy by up to 19% (1 requirement 98.7% → 19 requirements 85.0% for gpt-4o) ([Yang et al., Findings of ACL 2026](https://arxiv.org/html/2505.13360v2) ✔ [RT-1]). Multi-turn underspecified chats lose 39%, and consolidating the same information into one prompt recovers ~95% ([Laban et al. 2025](https://arxiv.org/abs/2505.06120)). |
| T4 | Asking clarifying questions is the right way to get that information | **True only for good questions.** Bad questions measurably harm. The benefit is a better *starting point*, not necessarily a better *end result*. | Medium-high | High-quality questions raise satisfaction and low-quality ones "disturb" users ([Zou et al.](https://irlab.science.uva.nl/wp-content/papercite-data/pdf/zou2022asking.pdf)). Users preferred documents written after questions (p=0.028), but after refinement there was no significant difference (p=0.155) ([Tix 2024](https://arxiv.org/abs/2407.12017)). Chatbot elicitation took ~53% longer than a form ([Kim et al., CHI 2019](https://soominkim.github.io/project/CHI2019_KIM_Comparing.pdf)). |
| T5 | Applying prompt-engineering technique for the user adds value | **Weak and shrinking.** Many classic techniques are now neutral or harmful on reasoning models. | High | Explicit chain-of-thought and few-shot examples can hurt reasoning models ([OpenAI reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)). Personas don't improve accuracy ([arXiv 2311.10054](https://arxiv.org/abs/2311.10054)). Rewrite gains shrink with stronger models: BPO +22% on ChatGPT vs +10% on GPT-4 (`04` §0). Structured-intent gain was Claude +0.217 vs Gemini +1.006 on a 5-point scale, near the ceiling ([Peng 2026](https://arxiv.org/abs/2603.29953), low reliability [RT-2]). |
| T6 | Nothing adequate exists; there is whitespace | **False for the general form.** The core loop is already shipped by indie tools, by builders where the prompt is used, and natively by assistants. | High | ≥6 indie tools run describe → questions → prompt (get-prompt.ai, Prompt Like A Pro, Feedough…). Bolt "Enhance prompt" opens a guided-question dialog and returns an editable prompt ([Bolt docs](https://support.bolt.new/building/chat-tools) ✔). Claude shows clickable multiple-choice options on all plans ([Claude help, Mar 2026](https://support.claude.com/en/articles/13641943-visual-and-interactive-content) ✔). Lovable Plan mode, Claude Code AskUserQuestion, Cursor Plan Mode and ChatGPT Deep Research all clarify (`03` §A). |
| T7 | People will pay for it | **Weak.** No evidence of strong willingness to pay for a standalone consumer prompt tool. | Medium-high | Only 13% of AI payers pay for a second AI product ([a16z Top 100, 7th ed.](https://a16z.com/100-gen-ai-apps-7/)). Direct tools cost $8–20/mo with generous free tiers (`03` §C). PromptPerfect reportedly closed Sept 2026 (Claimed). Anthropic retired its generate/improve-prompt APIs on 2026-08-17 ([release notes](https://platform.claude.com/docs/en/release-notes/overview.md) ✔). OpenAI's dataset-backed Prompt Optimizer shuts 2026-11-30 ([guide](https://developers.openai.com/api/docs/guides/prompt-optimizer) ✔). |

## 2. What survives

Strip away the claims that failed and a narrower thesis survives, consistently, across all eight workstreams:

1. **The valuable act is *eliciting missing, private context* (audience, constraints, quality bar, prior attempts, success criteria), not applying prompt technique.** (T3, T5)
2. **That act is worth its cost only when a misread intent is expensive:** long-running, credit-burning, hard-to-reverse tasks such as AI app builds, coding-agent runs, deep-research runs and multi-page documents. (T1, T4)
3. **Questions must be few, batched, skippable, mostly multiple-choice, and paired with visible, editable assumptions.** Otherwise they destroy the value they create. (T4; `06`, `07`)
4. **The deliverable should be a compact consolidated brief, not a long "optimised" prompt.** (T3; Laban et al.; Yang et al.)
5. **Asking questions per se is table stakes, not a moat.** What native tools structurally don't do well is (a) remember user and project context *across* tools and sessions, (b) produce a portable brief that works in several targets, and (c) prove with outcome data which questions actually changed results. (T6; `06` §9, `03` §G–H)

## 3. Refined thesis (the hypothesis we recommend testing)

> **SubText is a pre-flight brief builder for expensive AI runs.** Before you launch an app build, a coding-agent task or a deep-research job, SubText turns your rough idea into a short, reviewable brief. It asks only the 2–6 questions whose answers would change the result and shows every assumption as an editable chip. It remembers your project and preferences, so you're never asked twice, and it exports the brief to the tool you're about to use.

This is a **narrowing** (segment, task type) and a **repositioning** (from "prompt generator" to "brief/spec for costly runs"), plus a **redesign** of the core artefact (Brief → compiled prompt, rather than prompt alone).

## 4. What would falsify the refined thesis

Any of these, observed in the 30-day validation (`14_DEVELOPMENT_ROADMAP.md` Phase 0), should stop or redirect the project:

| Kill criterion | Test | Threshold (pre-registered; assumption to calibrate) |
|---|---|---|
| Native clarification is as good | Blind comparison: SubText brief vs the target tool's own Plan mode / "ask me questions first" vs raw prompt, 30–60 tasks | SubText preferred in <55% of non-tied pairs vs the best native baseline |
| Questions don't beat rewriting | Same benchmark, arm T3 (no-questions rewrite) | No significant win over T3 |
| The gain doesn't survive iteration | Measure turns/time to an acceptable output, not just first-output quality | No reduction in iterations or time |
| No pull | Fake-door + concierge with builders | <10% landing → waitlist from community traffic; <40% of interviewees report a wasted build/rework in the past month |
| No repeat use | Concierge / Wizard-of-Oz over 3 weeks | <20% produce a second brief unprompted |

## 5. Answers to the client's primary questions (A–M), in brief

| Q | Answer | Detail |
|---|---|---|
| A. Real, painful problem? | Real but conditional. Painful only for costly, long-running tasks. Most everyday usage is satisficed. | §1 T1–T2; `05` §0 |
| B. Who experiences it most? | People launching expensive AI runs: non-technical builders, coding-agent users, deep-research users, professionals producing long documents. Students and casual consumers have high volume but low pain and low WTP. | `05` personas; `02` §segments |
| C. What exists? | Indie clarify-then-prompt tools; embedded enhancers (Bolt, Lovable, Microsoft Prompt Coach); native clarification in Claude, ChatGPT, Gemini, Cursor, Claude Code; prompt libraries (declining); dev prompt/eval platforms (consolidating). | `03` |
| D. What do they fail at? | No documented stop rule, no cross-tool memory, no portable brief, no evidence of output improvement, questions often generic. | `03` §G |
| E. Differentiated opportunity? | Thin. A defensible version depends on context memory, portability and outcome-calibrated questioning, not on asking. | `12` |
| F. Techniques? | Context elicitation, task-family slot priors, consolidated single-shot prompts, model-specific renderers, minimal technique injection. | `04` |
| G. Questioning engine? | Deterministic orchestrator + typed LLM functions; per-slot assume / assume-and-show / ask; score = P(wrong) × impact × output sensitivity ÷ effort; combinable stop rules. | `06` |
| H. Experience? | One input → inferred Brief → ≤3 chip-based questions per round → compiled prompt; skip-all always available. | `07` |
| I. Architecture? | Hybrid state machine with 2–3 schema-constrained LLM calls; no multi-agent. ~$0.003–0.06 per session. | `08` |
| J. Measurement? | Blind A/B against strong baselines (incl. native clarification); ~150–350 tasks for power; quality × user time. | `09` |
| K. Who pays? | Power users and builders who burn credits, possibly teams. Consumer WTP is weak; a B2B clarification API is an alternative path. | `10` |
| L. Smallest compelling product? | A web app that produces one excellent brief for one target family (AI app builders / coding agents), with memory and export. | `13` |
| M. What makes it obsolete? | Native clarification plus memory in assistants and builders; models trained to ask (CollabLLM); labs already retiring prompt tools. | `12` |

## 6. Recommendation

**Do not build the thesis as written.** **Narrow, reposition and redesign** as in §3, and **validate before building**: a 30-day evidence sprint with explicit kill criteria. If the sprint fails, the evidence favours abandoning the consumer product. A B2B clarification engine embedded in other products remains a secondary option to probe. Full reasoning: `12_RED_TEAM_ANALYSIS.md`; scope: `13_MVP_AND_PRODUCT_REQUIREMENTS.md`.
