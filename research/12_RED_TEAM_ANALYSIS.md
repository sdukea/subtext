# 12 — Skeptical Red Team Analysis

**Owner:** Coordinator, acting as an independent investor and skeptical product reviewer
**Date:** 2026-11-18
**Brief:** Find the strongest arguments against building SubText. Do not protect the idea.
**Sources:** inline; coordinator sources `[RT-n]` in `sources/RT_sources.md`. ✔ = re-verified by the coordinator against the primary source.

---

## 1. The investor's one-paragraph view

> "You're proposing a better input box for products your users already pay for, at the exact moment those products are building the same input box themselves. The labs, who have the most data on whether prompt improvement works, just *retired* their prompt improvers. Your best academic evidence says gains shrink as models get stronger, and that asking questions gives a better first draft but not a better final result. Your users would pay for a second AI tool at a 13% rate, and churn 30% faster than non-AI app users. I'd pass on the thesis as written. I'd take a second meeting only if you can show a blind test where your brief beats Lovable's own Plan mode and Claude's own clarifying questions, and that people come back to it without being asked."

## 2. Arguments against, by theme

### 2.1 Native LLM competition: the core loop is already shipping natively
- Claude shows clickable multiple-choice, multi-select and ranking inputs "available to all Claude users" ([Claude help, 2026-03-16](https://support.claude.com/en/articles/13641943-visual-and-interactive-content) ✔).
- Claude Code / Agent SDK `AskUserQuestion`: 1–4 questions with 2–4 options plus free text, especially in plan mode ([docs](https://code.claude.com/docs/en/agent-sdk/user-input)).
- ChatGPT Deep Research's clarifier is instructed to ask only questions that change scope or depth, ~3–6 of them ([OpenAI cookbook](https://developers.openai.com/cookbook/examples/deep_research_api/introduction_to_deep_research_api)). Gemini Deep Research shows an editable plan before starting ([Google help](https://support.google.com/gemini/answer/15719111)).
- In the builder niche itself: Bolt's "Enhance prompt" opens a "Help us enhance your prompt" question dialog and returns an editable prompt ([Bolt docs](https://support.bolt.new/building/chat-tools) ✔). Lovable shipped a questions tool and a Plan mode ([Lovable](https://lovable.dev/en/blog/chat-mode-and-questions)). Cursor Plan Mode does the same ([docs](https://cursor.com/docs/agent/plan-mode)).
- Microsoft ships a free Prompt Coach to every Copilot Chat user (`03` §A).

**Implication:** the native version sits where the prompt is executed, with zero switching cost and full context about the tool. A separate tool must beat it by a margin users can feel.

### 2.2 Commoditisation and category decline
- Anthropic retired `/v1/experimental/generate_prompt`, `improve_prompt` and `templatize_prompt` along with the legacy Workbench on 2026-08-17 ([release notes](https://platform.claude.com/docs/en/release-notes/overview.md) ✔).
- OpenAI's dataset-backed Prompt Optimizer goes read-only 2026-10-31 and shuts down 2026-11-30 with the Evals platform ([guide](https://developers.openai.com/api/docs/guides/prompt-optimizer) ✔).
- Humanloop was acqui-hired by Anthropic and sunset on 2025-09-08 [RT-8]. Jina (PromptPerfect's parent) went to Elastic, and PromptPerfect reportedly closed 2026-09-01 (Claimed). FlowGPT and Vellum pivoted. Langfuse, Helicone and Promptfoo were acquired (`03` §J).
- Traffic to AIPRM, PromptBase and PromptHero is flat or falling. The largest indie clarify-then-prompt tool has ~44K visits per quarter (`03` §J; Similarweb estimates, medium-low reliability).
- Searches for "prompt engineering" fell ~33% from Oct 2025 to Sep 2026 (RankHero estimate, low-medium reliability; `02` §0).

### 2.3 Weak willingness to pay
- Only 13% of AI payers pay for a second AI product ([a16z](https://a16z.com/100-gen-ai-apps-7/)). Fewer than 10% of ChatGPT weekly users even visited another major model provider [RT-7].
- Assistant price anchors are $8–20/month (`10` §2). A tool that only improves the *input* to that assistant struggles to charge more than ~$5–10.
- Indie competitors are free or $8–20 with generous free tiers. Hacker News launches of prompt improvers draw 1–14 points (`03` §E).

### 2.4 Poor retention and episodic use
- AI apps "churn 30% faster" than non-AI apps ([RevenueCat 2026](https://www.revenuecat.com/state-of-subscription-apps/) [RT-5]).
- The trigger, "I'm about to start a big AI task", is episodic. A builder might start a new app monthly.
- "User habits are sticky and resistant to change" ([Hicke & Tomlinson 2026](https://arxiv.org/html/2605.29018v1)). Adding a pre-step before the tool people already use is a habit change.

### 2.5 Question fatigue and harm from bad questions
- Low-quality clarifying questions measurably lower satisfaction ([Zou et al.](https://irlab.science.uva.nl/wp-content/papercite-data/pdf/zou2022asking.pdf)).
- Conversational elicitation took ~53% longer than a web form ([Kim et al. CHI 2019](https://soominkim.github.io/project/CHI2019_KIM_Comparing.pdf)).
- LLMs are poor at deciding *when* to ask: ten LLMs showed a "consistent under-clarification bias", and CoT doesn't fix ambiguity detection ([ClarifyMT-Bench](https://arxiv.org/abs/2512.21120); [CLAMBER](https://arxiv.org/abs/2405.12063)). The thing SubText must be best at is the thing models are worst at, which is good for differentiation but bad for feasibility.

### 2.6 Lack of measurable output improvement
- Asking improved first drafts (41 vs 25, p=0.028), but after users refined both, the difference vanished (18 vs 13, p=0.155) ([Tix 2024](https://arxiv.org/abs/2407.12017)).
- Gains shrink on stronger models. In Peng 2026 a one-sentence prompt already scored 4.778/5 on Claude, and structured intent added only +0.217 versus +1.006 for Gemini. The author acknowledges a ceiling effect ([arXiv 2603.29953](https://arxiv.org/abs/2603.29953), read from PDF; low reliability: single author, single LLM judge, conflict of interest [RT-2]). Low-ambiguity tasks reversed the gain ([arXiv 2603.18976](https://arxiv.org/abs/2603.18976) [RT-3]).
- Over-specifying hurts: up to a 19% drop with 19 requirements ([Yang et al.](https://arxiv.org/html/2505.13360v2) ✔).
- Misaligned automated rewriting "can actively undermine" the gains of a better model ([Jahani et al. 2024](https://arxiv.org/abs/2407.14333)).

### 2.7 Model improvement making the product unnecessary
- Clarifying behaviour can be trained into models directly. CollabLLM reports +17.6% user satisfaction and −10.4% time in a 201-person study ([arXiv 2502.00640](https://arxiv.org/abs/2502.00640)).
- Vendors now tell models to ask: GPT-5.2 guidance to ask 1–3 clarifying questions, Google's Imagen prompt rewriter on by default (`04` §0).
- Vendor memory, projects and custom instructions erode the "context" advantage within one ecosystem.

### 2.8 Switching costs, distribution and acquisition
- Search demand is real but low-value. "AI prompt generator" gets ~74K searches/month globally, ~11% from the US, at ~$0.99 CPC (RankHero estimate; `02` §0).
- At $8–12 ARPU and 30%-faster AI churn, paid acquisition can't pay back. Growth must be organic or community-led (`10` §3–5).
- A browser-extension distribution path faces UI breakage and a trust deficit. Malicious AI-sidebar extensions with ~900K users stole ChatGPT conversations ([OX Security](https://www.ox.security/blog/malicious-chrome-extensions-steal-chatgpt-deepseek-conversations)), and consumer ToS ban automated extraction (`11` §browser extensions).

### 2.9 Technical complexity is not the problem, and that is itself a problem
- A session costs ~$0.003–0.06 at list prices (`08` §9; Claude prices re-verified ✔: Haiku 5.5 $0.10/$0.50, Sonnet 5.5 $2/$10 per MTok). It is cheap to build, so it is cheap to copy. The hard part, calibrated question selection, can only be shown by evaluation, and evaluation needs data you don't have yet.

### 2.10 Platform and legal risk
- Anthropic Commercial Terms D.4 bars using the services "to build a competing product or service" ([terms](https://www.anthropic.com/legal/commercial-terms) ✔). A prompt optimiser is probably not "competing", but this needs counsel (`11`).
- The Gemini API forbids apps "likely to be accessed by" under-18s ([terms](https://aistudio.google.com/docs/terms) ✔). That closes the student segment on that provider and adds DPDP child-consent obligations in India (`11`).

## 3. The five most serious risks

| # | Risk | Evidence (summary) | Likelihood | Severity | Mitigation | Testable before building? |
|---|---|---|---|---|---|---|
| R1 | **Native absorption:** assistants and builders already ask clarifying questions where the prompt runs, for free | §2.1, §2.2, §2.7 | **Very high.** It is already happening. | **High.** It removes the reason to switch. | Don't compete on "asking". Compete on (a) cross-tool memory, (b) a portable brief for several targets, (c) outcome-calibrated question selection. Pick a niche where users switch tools. | **Yes.** Blind head-to-head vs native Plan modes and "ask me questions first" (`09` arms T2/T5) with a Wizard-of-Oz SubText. 2–3 weeks. |
| R2 | **No measurable improvement** over strong baselines on frontier models, especially once users iterate | §2.6 | **Medium-high** | **High.** Without it there is no product. | Target high-ambiguity, high-cost tasks where gains are largest. Measure time and iterations to an acceptable result, not first-output quality. Keep briefs short. | **Yes.** A 60-task pilot in week 2–3, then a 150–350-task benchmark (`09` §7). |
| R3 | **Weak willingness to pay** (second-subscription problem) | §2.3 | **High** | **High** | Credit packs priced against wasted builder credits; team tier; B2B clarification API as a fallback revenue path. | **Yes.** Fake door + Van Westendorp (n≥150) + concierge pre-sales. |
| R4 | **Low retention / episodic use:** the habit step is skipped | §2.4 | **High** | **High** | Make memory the reason to return (project briefs that update; "never asked twice"). Integrate where work starts (MCP server, export to builders). Reusable templates. | **Partly.** A 3-week concierge or diary study measuring unprompted second use; true retention needs a live beta. |
| R5 | **Question quality:** fatigue or irrelevant questions make the product worse than none | §2.5 | **Medium** | **High** | Hard cap (≤3 per round, usually ≤2 rounds); assume-and-show by default; skip-all always visible; zero-question path for specific requests; per-question rubric eval. | **Yes.** Wizard-of-Oz with human-picked questions vs LLM-picked questions; question-level rubric (`06` §J). |

Secondary risks: acquisition cost (§2.8), platform/ToS (§2.10), copyability (§2.9), regulatory for minors (§2.10).

## 4. Steelman: the best case *for* building something here

To be fair to the idea, these points survive the red team:
1. **The underlying problem is measured, not imagined.** Unstated requirements are guessed correctly only 41% of the time, and intent misunderstanding is the top dissatisfaction cause (`01` §1).
2. **The form factor has a mechanism behind it.** Gathering information conversationally and then compiling one consolidated prompt recovers ~95% of single-turn performance, versus a 39% loss in underspecified multi-turn chat ([Laban et al.](https://arxiv.org/abs/2505.06120)).
3. **Native tools optimise for their own platform.** Lovable's Plan mode won't write you a brief for Cursor or Claude Code. Users use ~3 assistants on average ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)), so a neutral, portable brief plus memory has a structural reason to exist. **Unverified:** how often builders actually switch tools mid-project (Open Question OQ-3).
4. **Wasted runs cost money.** Builder platforms bill in credits (Lovable 1 credit/message, `03` §A) and Lovable passed $500M ARR (`02`), so a better first brief has a visible payoff.
5. **Calibrated "when to ask" is an unsolved research problem** (§2.5). A team that measures it well has a real, if narrow, technical edge.

## 5. Recommendation

| Option | Verdict | Why |
|---|---|---|
| Build as proposed (general consumer prompt improver) | **Reject** | Not novel, commoditised from three directions, weak WTP, shrinking gains (R1–R3) |
| **Narrow + reposition + redesign** (pre-flight brief builder for costly AI runs, with memory and portable export) | **Recommended, conditional on validation** | Only version supported by a mechanism (consolidated brief), a visible payoff (wasted credits/runs) and a structural gap (cross-tool) |
| Pivot to B2B clarification engine/API for other AI products | **Probe in parallel** | Money flows to embedded capabilities, but builders like Bolt and Lovable have already built their own. Low confidence. |
| Abandon | **Default outcome if Phase 0 kill criteria trigger** | See `01` §4 |

**The single most important experiment:** a blind, pre-registered comparison of a Wizard-of-Oz SubText brief versus (a) the target tool's own Plan mode or clarifying questions and (b) "improve this prompt" in the same frontier model. Measure output preference *and* time/iterations to an acceptable result on 30–60 realistic builder and agent tasks. Run it before writing production code.
