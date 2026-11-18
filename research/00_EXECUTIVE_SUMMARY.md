# 00 — Executive Summary: SubText Product Discovery Dossier

**Date:** 2026-11-18 · **Research window:** 2026-11-13 → 2026-11-18
**Method:** Eight parallel research workstreams (competitive, prompt engineering, user research, UX, questioning engine, architecture and evaluation, market and GTM, privacy and legal) plus coordinator-led thesis validation and red team. Roughly 500 sources are logged in `SOURCE_REGISTER.md`, and key claims were re-verified by the coordinator against primary sources (`RESEARCH_LOG.md`).
**Limits:** No interviews or user tests were conducted; all user evidence is published research, usage reports and public discussion. Reddit and G2 were blocked to our tools. No competitor product was used while logged in. Details are in `INDEX.md` → Coverage checklist.

---

## The verdict in one paragraph

**Don't build the product as proposed.** A general "describe your idea → we ask questions → you get a better prompt" tool is **not novel and is being commoditised from three directions**: free indie tools; builders that embed it where the prompt runs (Bolt's guided "Enhance prompt", Lovable Plan mode, Microsoft Prompt Coach); and the assistants themselves (Claude's clickable clarifying options on all plans, ChatGPT Deep Research's clarifier, Claude Code and Cursor plan modes). The labs that know most about prompt improvement **retired their own prompt improvers in 2026**. Anthropic's generate/improve-prompt APIs ended 2026-08-17, and OpenAI's Prompt Optimizer shuts down 2026-11-30. Willingness to pay for a second AI tool is low (13% of AI payers). A **narrower product** is supported by evidence and worth a **4-week validation sprint before any production build**: a *pre-flight brief builder for expensive AI runs* (app builds, coding-agent tasks, deep research). It asks only the few questions that change the result, shows its assumptions, remembers your project across tools and exports a compact brief. If that sprint's kill criteria trigger, stop.

## Answers to the core questions

| | Question | Answer (confidence) |
|---|---|---|
| A | Is the problem real and painful? | **Real but conditional** (medium-high). LLMs guess unstated requirements correctly only 41% of the time ([Yang et al., ACL Findings 2026](https://arxiv.org/html/2505.13360v2)), and intent misunderstanding is the top cause of ChatGPT dissatisfaction ([Kim et al. 2024](https://arxiv.org/html/2311.07434v3)). But most usage is low-stakes asking where vague prompts are good enough ([NBER w34255](https://www.nber.org/papers/w34255)). Pain concentrates in long, costly, hard-to-reverse tasks. |
| B | Who has it most? | People launching **expensive AI runs**: non-technical builders on Lovable/Bolt/v0, coding-agent users, deep-research users (medium). Students and casual consumers have volume but low pain and low WTP; under-18s are effectively off-limits (Gemini API terms; India DPDP). |
| C/D | What exists, and what does it miss? | ≥6 indie clarify-then-prompt tools; embedded enhancers; native clarification (high). Gaps: no documented stop rule, no cross-tool memory, no portable brief, **no evidence of output improvement** (`03` §G). |
| E | Differentiated opportunity? | **Thin** (medium). Asking questions is table stakes. Defensible pieces: outcome-calibrated question selection, persistent context across tools, the Brief as a portable artefact (`06` §9, `12`). |
| F | Which techniques matter? | **Eliciting missing context matters more than prompt technique.** Keep prompts short and consolidated (over-specifying cut accuracy by up to 19%; multi-turn chat loses 39%, consolidation recovers ~95% ([Laban et al.](https://arxiv.org/abs/2505.06120))). Many classic tricks (explicit CoT, personas, emphatic caps) are neutral or harmful on current reasoning models (`04`). |
| G | How should questioning work? | A deterministic orchestrator with typed LLM calls. Each slot is assumed silently, assumed and shown, or asked, scored by P(wrong) × impact × output sensitivity ÷ effort, with uncertainty from sampled interpretations rather than self-reported confidence. ≤3 questions per round; combinable stop rules (`06`). |
| H | Experience? | One input → an inferred, editable Brief → a few chip-based questions with "You decide" → a compact prompt/spec; skip-all always visible; Copy is the primary action (`07`). |
| I | Architecture? | A hybrid state machine with 2–3 schema-constrained LLM stages and target renderers. No multi-agent. ~$0.003–0.06 per session at list prices, so **the cost of a question is user time, not compute** (`08`). |
| J | How do we know it works? | A pre-registered blind A/B against **strong baselines**, including native clarification and "improve this prompt" in the same model, measuring preference *and* time-to-acceptable-output. ~150 tasks for a 0.65 win rate, ~350 for 0.60; 72-person human study (`09`). |
| K | Who pays? | Weak consumer WTP. Plausible payers: builders burning credits (credit packs or $8–12 tier), power users, teams. A B2B clarification API is a speculative fallback (`10`). |
| L | Smallest compelling product? | A web app that produces one excellent brief for AI-app-build and coding-agent tasks, with memory and export (`13`). |
| M | What makes it obsolete? | Native clarification plus memory in assistants and builders, already shipping; models trained to ask (CollabLLM +17.6% satisfaction); shrinking gains on stronger models (`12`). |

## Why would someone use this instead of asking ChatGPT, Claude or Gemini?

For the general case, **mostly they wouldn't**. Typing "ask me clarifying questions first" or using built-in Deep Research / Plan modes gets most of the way there at zero switching cost (`03` §I). The defensible reasons are narrow, and all are unproven until tested:
1. **Portability:** one brief and one memory that work across Lovable, Cursor, Claude Code and ChatGPT. Each vendor optimises only for its own surface, and users use ~3 assistants ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)). How often builders switch tools is unmeasured (OQ-3).
2. **Selectivity:** asking fewer, better questions with explicit stop rules. Models show a documented under-clarification bias and poor ambiguity detection (`06` §0).
3. **Never asked twice:** structured project and personal context reused as defaults.
4. **Evidence:** a published benchmark showing the effect, which no competitor offers.

## The five most serious risks (detail in `12`)

1. **Native absorption** (very high likelihood, high severity). Test: blind head-to-head vs native Plan modes.
2. **No measurable improvement** on frontier models once users iterate (medium-high, high). Test: 60-task pilot measuring time-to-acceptable.
3. **Weak willingness to pay** (high, high). Test: fake door + Van Westendorp + concierge pre-sales.
4. **Episodic use and poor retention** (high, high). Test: unprompted repeat use in a 3-week concierge study.
5. **Bad questions worse than none** (medium, high). Test: Wizard-of-Oz with question-level ratings.

## Final recommendation: actionable answers

- **What exactly should we build?** *Conditionally*: a pre-flight **brief builder** for expensive AI runs. It infers a Brief from one input, asks ≤2 rounds of ≤3 high-value questions, shows assumptions as editable chips, remembers project and personal context, and compiles a short spec for the target tool (generic, AI-app builder, coding agent). Spec: `13`.
- **Who first?** Adult non-technical and semi-technical **builders using AI app builders and coding agents** (Lovable, Bolt, v0, Replit, Cursor, Claude Code), reached through builder communities (`10` §5).
- **What should v1 do?** F1–F12 in `13` §3: input, inferred Brief, value-gated questions, assumption chips, skip-all, compile, edit, Copy/export, consented memory, history, outcome feedback, privacy defaults.
- **What should it not do?** Browser-extension injection; executing tasks; prompt marketplace; teaching prompt engineering; one-click "optimise my prompt" as a headline feature; under-18 users; image/video prompts; multi-agent; fetching URLs by default (`13` §4).
- **Why would people use it?** To avoid wasted credits and rework on long AI runs, with a brief and context that move across tools. *Hypothesis; must beat native Plan modes in blind tests.*
- **Why would they pay?** Only if it saves visibly more than it costs in credits and time, priced as credit packs or an $8–12 Builder tier against wasted builder credits. *Hypothesis; consumer WTP evidence is weak.*
- **What makes it hard to replicate?** Honestly, little at first. Over time: outcome data on which questions change results, persistent cross-tool context, and curated per-task slot priors kept current as models change.
- **How do we know it works?** The pre-registered evaluation in `09`: blind pairwise preference and time-to-acceptable-output versus raw prompt, "improve this prompt", a no-question rewrite and native clarification, with cross-provider judges calibrated to human labels and a human study.
- **First 30 days?** (`14` Phase 0)
  - **Week 1:** 15–20 builder interviews; three fake-door pages; benchmark v0 of 60 tasks.
  - **Week 2:** a Wizard-of-Oz prototype.
  - **Weeks 2–3:** the blind head-to-head; a concierge study with 10 builders.
  - **Weeks 3–4:** legal review.
  - **Week 4:** go/no-go against the kill criteria in `01` §4.
  - **Write no production code until the gate passes.**

## Document map

See `INDEX.md` for every deliverable, how the 27 dossier sections map onto files, and the coverage checklist.
