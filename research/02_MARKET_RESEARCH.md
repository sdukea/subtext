# 02 — Market Research (WS7)

**Workstream:** WS7 Market (sizing, segments, demand, threats)
**Date accessed for all sources:** 2026-11-13
**Companion file:** `10_BUSINESS_AND_GTM.md` (business model, pricing, GTM). Sources: `sources/WS7_sources.md` (tagged `[WS7-#]`).
**Boundaries:** WS1 owns competitor details and the price table; WS3 owns detailed user behaviour. Here, competitor facts appear only as *market signals* (traction, exits, shutdowns).

**Labels:** **Verified** = I read the primary source or the live listing. **Claimed** = vendor or company self-report, or secondary reporting I could not trace to a primary source. **Hypothesis** = my inference. `[snippet only]` = I saw only a search snippet; the page was not read.

---

## 0. Summary of key findings

1. **The AI assistant market is huge, and almost all of it sits with a few platforms.** ChatGPT reported ~900M weekly active users and 50M+ paying consumer subscribers in Feb 2026 (Verified, [TechCrunch](https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users)). Gemini passed 1B monthly users in Q3 2026 (Verified via secondary report of Alphabet's earnings, [PPC Land](https://ppc.land/gemini-app-gains-350m-users-in-a-year-to-pass-1bn-alphabet-says/)). U.S. AI users now use an average of 3.0 assistants ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)). Users are plentiful. What they will pay a third party for is the open question.
2. **Prompt engineering as a job and as a set of tricks is fading. Supplying intent and context is not.** Indeed searches for prompt-engineer roles peaked in April 2023. An Indeed economist calls it a skill rather than a job title ([Fortune](https://fortune.com/2025/05/07/prompt-engineering-200k-six-figure-role-now-obsolete-thanks-to-ai/)). Gartner says "context engineering is in, and prompt engineering is out" `[snippet only]`. Wharton found chain-of-thought prompting adds little for reasoning models `[snippet only]`. The thesis survives only if it is about **eliciting missing intent and context**, not prompt-engineering technique.
3. **Users do get better with practice, but slowly.** Claude users with 6+ months' tenure have higher conversation success. The gap is about 4 percentage points with full controls (Anthropic's headline says "10% higher"), and they iterate more instead of delegating directives ([Anthropic Economic Index, Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)). The skill gap is real but modest, and it narrows as people use the tools.
4. **The platforms are building clarifying questions into their own products, and this is the biggest threat.** Each of these does natively what SubText's core loop does, at the point where the prompt is used:
   - Lovable shipped a questions tool in Dec 2025 that asks about audience, features, design and tech before building ([Lovable](https://lovable.dev/en/blog/chat-mode-and-questions)).
   - Claude Code and the Agent SDK have `AskUserQuestion`, with 1–4 multiple-choice questions per call, mainly in plan mode ([Anthropic docs](https://code.claude.com/docs/en/agent-sdk/user-input)).
   - ChatGPT deep research asks clarifying questions before it starts `[snippet only]`.
   - OpenAI and Anthropic both ship free prompt optimisers for developers ([OpenAI cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook), [Maginative](https://www.maginative.com/article/anthropic-launches-tool-to-help-you-write-better-prompts-for-claude)).
5. **Existing prompt tools show weak and declining traction.**
   - PromptPerfect, the best-known prompt optimiser, is reported shut down as of 1 Sep 2026, after Elastic bought Jina AI for its embedding models (Claimed by several third parties; I found no primary notice) ([dev.to/Prompeteer](https://dev.to/team_prompeteer_b8b6250cd/promptperfect-is-sunsetting-heres-what-i-switched-to-482n)).
   - AIPRM, the largest prompt extension, lists 1M Chrome users, but its site traffic fell ~7% month on month and its global rank slipped (Verified listing, [CWS](https://chromewebstore.google.com/detail/aiprm-for-chatgpt/ojnbohmppadfgpejeebfnmnknjdlckgj); Similarweb estimate, [Similarweb](https://www.similarweb.com/website/aiprm.com/)).
   - Prompt Genie has repositioned around *saving tokens* ([CWS](https://chromewebstore.google.com/detail/prompt-genie-best-ai-prom/inafdkdkghgibhijaplaobmomoahefin)).
6. **Search demand for "prompt generator" is large in volume but low in value.** "AI prompt generator" gets ~74K global monthly searches, but only ~8.1K (11%) are from the U.S. CPC is ~$0.99 and keyword difficulty 8/100. "Prompt engineering" fell ~33% from Oct 2025 to Sep 2026 (RankHero estimates, Low–Med reliability, [RankHero](https://www.rankhero.com/keywords/ai-prompt-generator)). Cheap traffic, mostly from low-willingness-to-pay countries.
7. **Published "prompt engineering market" reports cannot support decisions.** Estimates for 2025 range from about $0.3B to $7B depending on the firm's definition. They mix services, training and enterprise platforms, and give no transparent bottom-up method (Section 4). **I do not produce a TAM from them.**
8. **Money in consumer AI is real but concentrated, and it mostly goes to the assistants and to tools that *do* the work.**
   - 55% of U.S. AI users now pay for at least one AI product ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)).
   - Only 13% of people who pay for one AI product pay for another. The top 1% of spenders account for 19.5% of spend ([a16z Top 100, 7th ed.](https://a16z.com/100-gen-ai-apps-7/)).
   - AI apps churn annual subscribers ~30% faster than non-AI apps ([RevenueCat via TechCrunch](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows)).
   - A product that only improves the *input* to a tool the user already pays for is a hard sell as a second subscription.
9. **The best segment candidates are where a bad brief has a visible cost:**
   - non-technical builders using vibe-coding tools, where credits are burned and the wrong app gets built (Lovable passed $500M ARR, [Dealroom](https://dealroom.co/news/134215-lovable-hits-500m-annualised-revenue-as-ai-app-builders-boom/));
   - knowledge workers launching long agent or deep-research runs;
   - teams that want standard, reusable briefs.

   Students and casual users have high volume but weak willingness to pay and short retention.

**Bottom line (Hypothesis, high confidence):** A standalone consumer prompt generator is a weak business. It faces declining category demand, it gets absorbed into the platforms, and existing tools show low willingness to pay. A defensible version would have to be either (a) a **brief/spec builder for expensive, long-running agent tasks**, sold where a bad prompt has measurable cost, or (b) a **clarification engine licensed or embedded into other products** (B2B/API). Section 9 and `10_BUSINESS_AND_GTM.md` develop this.

---

## 1. How the market evolved, 2024–2026

| Period | Dominant pattern | Evidence |
|---|---|---|
| 2023 | "Prompt engineer" hype; prompt marketplaces and template libraries (PromptBase, AIPRM) | Indeed searches for the role peaked in Apr 2023 ([Fortune](https://fortune.com/2025/05/07/prompt-engineering-200k-six-figure-role-now-obsolete-thanks-to-ai/)) — Verified |
| 2024 | Assistants become mainstream. Labs ship prompt tooling for developers. | Anthropic Console prompt improver, Nov 2024 ([Maginative](https://www.maginative.com/article/anthropic-launches-tool-to-help-you-write-better-prompts-for-claude)) — Verified |
| 2025 | Reasoning models; "context engineering" replaces "prompt engineering" in elite discourse; deep research and agents arrive; vibe coding takes off | Gartner, Jul 2025: "context engineering is in, and prompt engineering is out" `[snippet only]`. Wharton: CoT prompting gives diminishing returns on reasoning models `[snippet only]`. OpenAI GPT-5 Prompt Optimizer ([cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook)) — Verified |
| 2026 | Assistant consolidation at scale (ChatGPT ~1B WAU, Gemini 1B+ MAU); multi-assistant usage; agents become a consumer behaviour; app builders reach hundreds of millions in ARR; platforms add native clarifying questions | Menlo 2026: 41% of U.S. AI users have tried an agent, 24% use one regularly ([Menlo](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)) — Verified. Lovable questions tool and Plan mode ([Lovable](https://lovable.dev/en/blog/chat-mode-and-questions)) — Verified |

**Scale (official or primary where available):**

| Metric | Value | Source | Label |
|---|---|---|---|
| ChatGPT weekly active users | ~900M (Feb 2026), up from 800M (Oct 2025) | [TechCrunch](https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users) | Verified (OpenAI statement reported by TechCrunch) |
| ChatGPT paying consumer subscribers | 50M+ (Feb 2026) → **~5.6% of WAU** (my calculation) | same | Verified figure; ratio is Hypothesis arithmetic |
| ChatGPT 1B–1.2B WAU (Jul–Sep 2026) | Reported by secondary stats sites | various | Claimed `[snippet only]`, not traced to OpenAI |
| Gemini app MAU | 1B+ (Q3 2026), up from 650M a year earlier | [PPC Land on Alphabet Q3 2026](https://ppc.land/gemini-app-gains-350m-users-in-a-year-to-pass-1bn-alphabet-says/) | Verified secondary report of earnings materials; no paid subscriber figures disclosed |
| Claude consumer users | No official MAU. Third-party estimates range from 19M (web) to 245M+ and conflict by an order of magnitude. | various | Low reliability `[snippet only]` |
| Relative scale (web visits / mobile MAU) | ChatGPT ≈ 2× Gemini and 6× Claude on web; 2.5× Gemini and 14× Claude on mobile | [a16z 7th ed.](https://a16z.com/100-gen-ai-apps-7/) | Verified (a16z using Similarweb/Sensor Tower) |
| U.S. adults using AI | 64% (2026), 61% (2025); daily: 25% of adults | [Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/) | Verified (Morning Consult, n=5,067) |
| Global AI users | ~2.0B (Menlo estimate) | same | Claimed (VC estimate) |
| U.S. consumers with a paid ChatGPT/Gemini/Claude sub | 4.5% of eligible consumers (Aug 2026), up from 2.1% | [a16z 7th ed.](https://a16z.com/100-gen-ai-apps-7/) | Verified (YipitData card panel) |

**What people use assistants for.** OpenAI/NBER: non-work messages rose from 53% to more than 70% of usage. Practical guidance, seeking information and writing make up ~80% of conversations. Coding is a relatively small share of consumer ChatGPT use ([NBER w34255](https://www.nber.org/papers/w34255)) — Verified. Menlo 2026 adds that among people doing a task, the share who use AI for it is 61% for writing support, 58% for coding projects and 56% for school/work assignments — Verified.

**Implication (Hypothesis):** Most usage is short, casual and non-work. That is a weak setting for a multi-question elicitation flow, because the friction outweighs the gain on a quick question. The thesis fits a minority of high-stakes, multi-step requests.

---

## 2. Is prompt engineering becoming more or less important?

**Evidence it is becoming less important (as a separate skill or product):**
- **Job market:** Indeed searches peaked Apr 2023. An Indeed economist calls prompt engineering "not an entire title". Gen-AI terms appear in 3 of every 1,000 Indeed postings ([Fortune, May 2025](https://fortune.com/2025/05/07/prompt-engineering-200k-six-figure-role-now-obsolete-thanks-to-ai/)) — Verified. Indeed's VP of AI told the WSJ that postings are minimal `[snippet only]`. Third-party claims of "79%" or "40%" declines in postings have no traceable source, so I disregard them.
- **Analyst framing:** Gartner's Jul 2025 note is titled roughly "Lead the Shift to Context Engineering as Prompt Engineering Fades" `[snippet only; Gartner pages returned 403]`.
- **Technique value:** Wharton's *Prompting Science Report 2* (Jun 2025) found explicit CoT prompting gives marginal or negative accuracy changes on reasoning models, with a small benefit on non-reasoning models `[snippet only; SSRN not read]`.
- **Labs absorbing optimisation:** OpenAI's Prompt Optimizer rewrites prompts to the model's best practices and flags contradictions and format ambiguity ([cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook)). Anthropic's prompt improver claimed +30% accuracy on a classification task ([Maginative](https://www.maginative.com/article/anthropic-launches-tool-to-help-you-write-better-prompts-for-claude)). Both are free developer tools — Verified (product descriptions); performance numbers are Claimed.
- **Search interest:** "prompt engineering" fell from ~201K to ~135K monthly global searches between Oct 2025 and Sep 2026, per RankHero (Low–Med reliability; Etsy-oriented keyword tool) ([RankHero](https://www.rankhero.com/keywords/prompt-engineering)). **I could not access Google Trends directly.** Secondary reports say interest peaked in 2023 and "context engineering" rose from mid-2025 `[snippet only]`.

**Evidence it still matters (as intent and context supply):**
- Developers' top frustration with AI tools is solutions that are "almost right but not quite" (66%), and 45.7% distrust AI accuracy ([Stack Overflow 2025](https://survey.stackoverflow.co/2025/ai)) — Verified. Part of this comes from underspecified requests (Hypothesis; WS3/WS5 should confirm).
- Experienced users succeed more often, and the gap is not explained by task mix (Anthropic) — Verified. So how people interact still affects outcomes.
- Platforms are *adding* clarification steps (Lovable, Claude Code, ChatGPT deep research). That is strong evidence that **missing intent is a real failure mode**. It is also evidence that the platforms intend to solve it themselves.

**Verdict (Hypothesis, high confidence):** Technique-level prompt engineering (role prompts, CoT incantations, formatting tricks) is losing value fast, and selling it is selling a melting asset. Supplying *goal, constraints, context and acceptance criteria* is gaining value as tasks get longer and more autonomous. A failed 30-minute agent run costs much more than a mediocre chat reply. SubText's adaptive questioning is aligned with the durable part. Its "optimised prompt" output is aligned with the decaying part.

---

## 3. Are users getting better at prompting naturally? (brief; WS3 owns depth)

- **Yes, modestly.** Anthropic, Mar 2026: users with 6+ months' tenure have higher success rates. That holds within the same task, at ~3–4 pp with controls, against a headline of "10% higher". Their prompts need more years of schooling to understand, and they iterate rather than delegate. The authors cannot rule out survivorship or early-adopter effects ([Anthropic](https://www.anthropic.com/research/economic-index-march-2026-report)) — Verified.
- **People use AI more over time.** OpenAI data cited by Menlo shows message volume per weekly user rising in every sign-up cohort. 52% of U.S. AI users say they use AI more than a year ago ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)) — Verified.
- **Prompts are already far longer than search queries.** Similarweb data reported by OfficeChai gives ChatGPT prompts averaging "60" against "3.4" for Google. The unit is labelled characters, which looks like a mislabel for words. Low reliability; directional only ([OfficeChai](https://officechai.com/ai/chatgpt-queries-17x-longer-than-google-searches-6x-longer-than-googles-ai-mode-similarweb-data)).
- **Implication (Hypothesis):** The pool of users who need training wheels shrinks with tenure. A product whose value is teaching or doing prompting faces a user base that graduates. Retention must come from something that does not decay: saved context, reusable briefs, team standards, or integration into the workflow.

## 4–5. Problems by user type (brief pointers; WS3 owns depth)

| User type | Problem with direct market relevance | Evidence |
|---|---|---|
| Non-technical / casual | Short, vague requests; don't know what context matters; but mostly low-stakes, non-work use | NBER non-work >70% ([NBER](https://www.nber.org/papers/w34255)); newer users are more directive (Anthropic) |
| Students | Near-universal use (92% of UK undergraduates in 2025), but much of it is assessment help; free premium offers are common | HEPI 2025 `[snippet only]` |
| Developers | "Almost right" outputs; distrust; agents used by ~31% at work | [Stack Overflow 2025](https://survey.stackoverflow.co/2025/ai) — Verified |
| Vibe coders / non-technical builders | Vague app specs lead to wrong builds and burned credits; platform added questions and Plan mode to address this | [Lovable](https://lovable.dev/en/blog/chat-mode-and-questions) — Verified that the feature exists; the pain is inferred (Hypothesis) |
| Experienced users | Iterate more and need fewer prompts written for them; want reuse, context persistence and speed | Anthropic tenure findings — Verified |

---

## 6. Emerging trends and what each means for SubText

| Trend | Evidence | Effect on thesis |
|---|---|---|
| **Agents** | 41% of U.S. AI users have tried an agent, 24% regular (Menlo 2026). 30.9% of developers use agents at work (SO 2025). | **Positive for brief quality** (a bad brief costs more), **negative for a standalone tool** (agents ask their own questions) |
| **Deep research** | ChatGPT deep research asks clarifying questions and proposes a plan first `[snippet only]` | Platform already does the elicitation step |
| **Memory and persistent context** | ChatGPT plans list "longer memory" and "expanded memory" as tier features ([chatgpt.com/pricing](https://chatgpt.com/pricing), page read; prices not rendered) | Assistants hold user context natively, which shrinks the "tell it about yourself" part of elicitation |
| **Vibe coding** | Lovable $500M ARR, 1M new projects/week (Jun 2026) ([Dealroom](https://dealroom.co/news/134215-lovable-hits-500m-annualised-revenue-as-ai-app-builders-boom/)); later reports put it at ~$600M `[snippet only]` | Clear, costly pain with money flowing. Platforms are adding planning modes. |
| **MCP / app platforms** | MCP donated to the Linux Foundation's Agentic AI Foundation (Dec 2025); ~97M monthly SDK downloads claimed `[snippet only]`. ChatGPT app directory opened to third parties `[snippet only]`. | Cheap distribution inside assistants. ChatGPT apps reportedly can't sell digital goods (as of Jan 2026) `[snippet only]`, so the channel is for acquisition, not monetisation. |
| **Multi-assistant use** | 3.0 assistants per user (Menlo 2026); 81% of enterprises use 3+ model families (a16z via The Decoder) | Supports a **model-agnostic** layer, the one durable structural advantage over any single lab |

---

## 7. Changing user behaviour: usage and payment

- **Payment has normalised.** 55% of U.S. AI users pay for at least one AI product in 2026. That is not comparable with Menlo's 2025 *global* estimate of 3%, which used a different population and method ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)) — Verified. 50% of payers are on flat monthly plans, 26% annual, 17% usage-based.
- **Spend is concentrated.** Menlo: the top 14% of payers (spending $100+/month) account for 60% of spending. a16z: the top 1% average ~$903/month and the median payer ~$25/month. 7.3% of Claude consumer payers are on the $100 Max plan ([a16z](https://a16z.com/100-gen-ai-apps-7/)) — Verified.
- **People rarely stack paid AI products.** Only 13% of people who pay for one AI product pay for another, and only 8% of ChatGPT subscribers also pay for Claude ([a16z](https://a16z.com/100-gen-ai-apps-7/)) — Verified. This is the most important willingness-to-pay data point for SubText: most users have one AI budget line, and it already belongs to an assistant.
- **Specialised tools still get used.** 75% of U.S. AI users use at least one specialised AI tool. Menlo argues specialists can coexist if they are "materially better" at one job. It also notes that a better product "can be objectively better... and still lose to a familiar assistant" ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/)) — Verified quotes (short).
- **Retention.** AI apps: 12-month retention of monthly subscribers is 6.1% against 9.5% for non-AI apps; annual plans 21.1% against 30.7%. Trial-to-paid conversion is higher (8.5% against 5.6%) ([RevenueCat via TechCrunch](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows)) — Verified secondary report of RevenueCat data (mobile-heavy sample). "AI sells, but it doesn't stick" ([RevenueCat](https://www.revenuecat.com/state-of-subscription-apps/)).

## 8. Where demand concentrates

1. **Coding and building.** Coding, productivity and creative tools are growing among high spenders (a16z). Cursor ARR is reported at ~$2B `[snippet only]`, Lovable at $500M+, and Claude Code run-rate at >$2.5B `[snippet only]`.
2. **Writing and work assignments.** These are the highest-penetration use cases (Menlo), but assistants serve them natively.
3. **High-spend power users** who pay $100+/month and run long agent tasks.
4. **Geography.** Search demand for prompt-help terms is heavily non-U.S. ("ai prompt": India 25%, U.S. 6%; "prompt generator": U.S. 6%) ([RankHero](https://www.rankhero.com/keywords/ai-prompt)). PromptBase's traffic is 28% U.S., then Pakistan and India ([Similarweb](https://www.similarweb.com/website/promptbase.com/)). Hypothesis: much of the organic interest in "prompt generators" comes from price-sensitive markets.

## 9. Adjacent markets (where the capability could be worth more)

| Adjacent market | Size signal | Relevance |
|---|---|---|
| AI writing assistants (Grammarly/Superhuman) | Grammarly claimed >$700M annual revenue, 40M daily users, 50K organisations (May 2025) `[snippet only]` | The best analogue for an "improve what you send, everywhere" browser-extension business. It took a decade and a universal job (correctness), and B2B is a large part of revenue. |
| Vibe-coding / app builders | Lovable $500M+ ARR (Verified, Dealroom) | The richest pain pool for spec/brief quality, but platforms build it in natively |
| LLMOps / prompt management for developers | Humanloop team acqui-hired by Anthropic and platform shut down (Sep 2025) `[snippet only]`; Langfuse joined ClickHouse (Jan 2026) `[snippet only]` | Prompt management is being consolidated into platforms as a *feature* |
| Team prompt libraries / AI enablement | Team-GPT, TeamPrompt (with data-loss prevention), AIPRM team plans; OpenAI reportedly building shared prompts for teams (Oct 2025) `[snippet only]` | Where B2B money flows, but it is crowded and native features are coming |
| AI literacy and training | Vanderbilt's "Prompt Engineering for ChatGPT" on Coursera: 756,811 enrolled ([Coursera](https://www.coursera.org/learn/prompt-engineering)) — Verified | Demand for *learning* to prompt exists. A "teach while eliciting" angle could serve education. |
| Prompt marketplaces | PromptBase traffic estimated at ~538K visits per Similarweb window (Oct 2026), -1.8% MoM ([Similarweb](https://www.similarweb.com/website/promptbase.com/)); revenue claims of $10M GMV, ~$900K/yr company revenue `[snippet only, Low]` | Small; shows the ceiling of prompt-as-product |

## 10. Threats

| Threat | Severity | Evidence |
|---|---|---|
| **Native clarification in assistants, agents and builders** | **Critical** | Lovable questions tool and Plan mode; Claude Code `AskUserQuestion`; ChatGPT deep research clarifying questions; OpenAI and Anthropic prompt optimisers (all cited above) |
| Models need less prompting | High | Wharton CoT findings `[snippet only]`; Gartner `[snippet only]`; labs ship optimisers |
| Memory and persistent context in assistants | High | Memory listed as a tier feature on ChatGPT plans (Verified, pricing page) |
| Single AI budget line; low stacking | High | 13% pay for a second AI product (a16z) |
| AI-app churn | High | 30% faster annual churn (RevenueCat) |
| Category decay and exits | High | PromptPerfect reported shut down (Claimed); AIPRM traffic declining (Similarweb estimate); Prompt Genie pivoted to token saving (Verified listing) |
| Platform policy and distribution control | Medium | ChatGPT apps reportedly limited to physical-goods monetisation (Jan 2026) `[snippet only]`; GPT Store revenue share stayed a limited pilot `[snippet only]` |
| Commoditisation (many cheap clones) | Medium | Many Chrome "prompt improver" extensions with tiny user bases, e.g. "AI Prompt Improver", 8 users ([CWS](https://chromewebstore.google.com/detail/ai-prompt-improver/cnobocnibkojcfcphkgjgfgjaaohdedd?hl=en)) |

---

## 11. Three markets, kept separate

### (a) The AI software market (context only)
Consumer AI spend is ~$40B in 2026, up from ~$12B in 2025 (Menlo estimate, Claimed). Anthropic's run-rate was reported at >$30B by Apr 2026 `[snippet only]`. OpenAI said ~$2B/month, mostly enterprise `[snippet only]`. **This number is irrelevant to SubText's sizing.** It is captured by model providers and products that do the work.

### (b) The "prompt engineering tools" market: published reports, critically assessed

| Publisher | Claim | Definition | Read? | Credibility |
|---|---|---|---|---|
| Grand View Research | $222.1M (2023) → $893.7M (2026) → $2.06B (2030), 32.8% CAGR | Software **plus services and training**; segmented by "technique" (n-shot, CoT) and industry; vendor list mixes Salesforce and AWS with PromptBase, AIPRM, Prompt Genie | Yes ([GVR](https://www.grandviewresearch.com/industry-analysis/prompt-engineering-market-report)) | **Low.** Generic methodology statement. Segmenting by prompting technique is not a market. Big-platform revenue is plausibly counted. No disclosed bottom-up. |
| Market Glass (formerly GIA) | $332.4M (2024) → $1.7B (2030), 30.6% | Unclear | No `[snippet only]` | Low |
| The Business Research Company | $4.51B (2030), 31.9% | Unclear | No `[snippet only]` | Low (press-release research firm) |
| Technavio | Prompt engineering *tools* +$2.63B over 2025–2030, 18.9% | Tools | No `[snippet only]` | Low–Med |
| Mordor Intelligence | $6.95B (2025) → $40.87B (2030) | **Combines prompt engineering and agent programming tools** | No `[snippet only]` | Low; definition too broad to apply |

**Assessment:** The 2025 estimates differ by more than 10×, depending mainly on the definition. The CAGRs cluster suspiciously at ~30–33%. None ties to observable revenue of named prompt-tool companies. The observed traction is far smaller than these figures imply: the best-known optimiser was reported shut down, the largest extension's traffic is declining, and the largest marketplace has six-figure monthly visits. **Do not cite these figures in a pitch or plan.**

### (c) Actual addressable market for SubText: what the evidence supports

I do **not** produce a TAM/SAM/SOM, because the key inputs are unknown:
- what share of assistant users would adopt a separate pre-prompt step;
- what share of those would pay on top of their assistant;
- whether usage persists once platforms ship native clarification.

**Observable bounds and comparables (Verified unless noted):**
- **Reachable base (upper bound on interest):** ~50M+ paying ChatGPT consumer subscribers (Feb 2026), plus paying Claude and Gemini users. Claude has about a third of ChatGPT's U.S. paid subscribers (a16z).
- **Stacking constraint:** 13% of AI payers pay for a second AI product (a16z). A prompt-quality tool would compete for that 13% against Cursor, Lovable, Suno, Perplexity, Midjourney and others that *produce outputs*.
- **Comparable traction for prompt tools:** AIPRM has 1M listed Chrome users (description claims 2M) and ~709K visits per Similarweb window ([CWS](https://chromewebstore.google.com/detail/aiprm-for-chatgpt/ojnbohmppadfgpejeebfnmnknjdlckgj), [Similarweb](https://www.similarweb.com/website/aiprm.com/)). PromptBase ~538K. God of Prompt ~128K. The last two are Similarweb estimates; the window label is ambiguous (monthly or 3-month). For scale, lovable.dev shows 31.1M on the same basis ([Similarweb](https://www.similarweb.com/website/lovable.dev/)). **The largest prompt destinations get roughly 1–2% of the traffic of one vibe-coding app.**
- **GPT Store "prompt" GPTs:** scraped directories list "Prompt Professor" at 800K+ conversations `[snippet only, Low]`. OpenAI provides no reliable per-GPT analytics beyond conversation counts, and the builder revenue share stayed a limited pilot `[snippet only]`. Distribution is possible; monetisation there is not proven.

**Illustrative sensitivity (Hypothesis; not a forecast).** This shows the *order of magnitude* only.

| Paying share of ChatGPT's 50M consumer subscribers | Payers | ARR at $8/mo | ARR at $15/mo |
|---|---|---|---|
| 0.05% | 25K | $2.4M | $4.5M |
| 0.2% | 100K | $9.6M | $18M |
| 1.0% | 500K | $48M | $90M |

Comparables (AIPRM, PromptBase, PromptPerfect's exit) suggest a consumer-only business sits at the **low end** of this range: a small, possibly profitable indie business, not a venture-scale one. Reaching 1% would require Grammarly-like ubiquity. **Data needed to firm this up:**
- conversion from a fake-door pricing page within the target segment;
- measured uplift in output quality (WS6 evaluation);
- retention cohorts at week 4 and week 12;
- willingness to pay from Van Westendorp surveys (see `10_BUSINESS_AND_GTM.md`).

---

## 12. Segment assessment

Scores are 1 (worst) to 5 (best) for SubText. For "competitive intensity", 5 means *low* competition. Confidence: H/M/L.

| Segment | Pain intensity | Frequency | Willingness to pay | Accessibility | Retention potential | Competitive intensity (5 = low) | Ease of reaching | **Total /35** | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| **Vibe coders / non-technical builders** (Lovable, Bolt, v0, Replit) | 5 | 4 | 4 | 4 | 3 | 2 | 4 | **26** | M |
| **Knowledge workers launching agent / deep-research tasks** | 4 | 3 | 3 | 3 | 3 | 2 | 3 | **21** | M–L |
| **Teams wanting standard prompts** (SMB/enterprise) | 3 | 4 | 4 | 2 | 4 | 2 | 2 | **21** | M |
| **Founders** (research, plans, specs) | 4 | 3 | 3 | 4 | 2 | 2 | 4 | **22** | M–L |
| **Marketers / content creators** | 3 | 5 | 3 | 4 | 3 | 1 | 4 | **23** | M |
| **Developers using coding agents** | 3 | 5 | 4 | 4 | 2 | 1 | 4 | **23** | M |
| **Students** | 2 | 4 | 1 | 5 | 2 | 2 | 4 | **20** | M |
| **Researchers / academics** | 3 | 3 | 2 | 3 | 3 | 3 | 3 | **20** | L |
| **Educators** (teaching AI literacy) | 3 | 2 | 2 | 3 | 3 | 4 | 3 | **20** | L |
| **AI image/video creators** | 3 | 4 | 3 | 4 | 2 | 1 | 4 | **21** | M–L |
| **Casual consumers** | 1 | 2 | 1 | 5 | 1 | 1 | 2 | **13** | H |

**Score rationale (evidence in brackets):**
- **Vibe coders.**
  - Pain 5: a vague spec produces the wrong app and burns usage credits. Lovable built a questions tool because vague prompts lead the AI to make assumptions ([Lovable](https://lovable.dev/en/blog/chat-mode-and-questions)).
  - Frequency 4: builders iterate many times per project (1M new projects per week, Dealroom).
  - Willingness to pay 4: they already pay platforms (Lovable $500M+ ARR).
  - Retention 3: projects are episodic.
  - Competition 2: the platforms themselves add Plan mode and questions. This is the key risk.
  - Reach 4: concentrated communities (platform Discords and subreddits, YouTube tutorials), plus 15% of developers vibe-code (SO 2025).
  - Hypothesis: a cross-platform "PRD/spec builder" that outputs platform-ready briefs and is portable across Lovable, Bolt, v0 and Claude Code is the sharpest wedge.
- **Developers using coding agents.** High frequency and willingness to pay (Claude Code, Cursor spend). But developers are the most skilled prompters, and `AskUserQuestion`/plan mode already does elicitation inside the tool ([docs](https://code.claude.com/docs/en/agent-sdk/user-input)), so competition scores 1. Low incremental value.
- **Marketers and creators.** Highest frequency. This is AIPRM's historical core (marketing/SEO templates). But it is very crowded: templates, Jasper, Copy.ai's pivot, and native assistants. Jasper's valuation cut and Copy.ai's pivot show how exposed this space is `[snippet only]`.
- **Teams and enterprise.** Willingness to pay and retention are higher with seat-based, standardised workflows. Access is slower (sales cycle, security reviews; WS8). Native shared-prompt features are reportedly coming to ChatGPT `[snippet only]`.
- **Students.** 92% of UK undergraduates use AI (HEPI 2025, `[snippet only]`), so volume is huge. But willingness to pay is weak, and assistants and labs give away premium tiers to students. There are also academic-integrity sensitivities.
- **Casual consumers.** Short, non-work questions (NBER). The friction of a question flow exceeds the benefit. Not a target.

**Strongest initial niche (Hypothesis, medium confidence):** **non-technical builders using AI app builders and agents.** They need a structured brief/spec before an expensive build, and they work across tools. Reasoning:
1. The cost of a bad brief is concrete and monetary (credits, time, rework).
2. Money is already flowing in large amounts.
3. The community is concentrated and reachable.
4. A *cross-platform* brief has value that no single platform's native questions can offer.
5. The output (PRD, spec, acceptance criteria) is a durable artifact that is reused and edited, unlike a throwaway prompt.

**Main disconfirming risk:** the platforms' native Plan modes may be "good enough". This must be tested head-to-head (see Validation experiments).

---

## Verified vs. claimed vs. hypothesis: summary of the load-bearing claims

| Claim | Status |
|---|---|
| ChatGPT ~900M WAU and 50M+ paid subs (Feb 2026) | Verified (TechCrunch reporting OpenAI) |
| Gemini 1B+ MAU (Q3 2026) | Verified secondary report of Alphabet materials |
| 55% of U.S. AI users pay for ≥1 AI product; 3.0 assistants per user | Verified (Menlo / Morning Consult) |
| 13% of AI payers pay for a second AI product | Verified (a16z / YipitData) |
| AI apps churn ~30% faster | Verified secondary report (TechCrunch on RevenueCat) |
| Platforms ship native clarifying questions (Lovable, Claude Code) | Verified (primary docs) |
| ChatGPT deep research clarifying questions | `[snippet only]` (OpenAI help returned 403) |
| PromptPerfect shut down Sep 2026 | Claimed (several third-party, partly competitor, sources) |
| Prompt-engineering market reports | Claimed, low credibility |
| Gartner "context engineering is in" | `[snippet only]` |
| Consumer standalone prompt tool is a weak business | Hypothesis (high confidence) |
| Vibe coders are the best initial niche | Hypothesis (medium confidence) |

## Unresolved questions

1. Do native clarification features (Lovable Plan mode, Claude Code plan mode, ChatGPT deep research) already capture most of the quality uplift SubText would provide? If so, by how much?
2. What share of assistant users would accept a separate pre-prompt step? Is there demand for *portability across tools*, or do users stay inside one platform?
3. Actual paid conversion and revenue for AIPRM, God of Prompt and PromptBase (all private). Is any prompt tool above ~$5M ARR?
4. Google Trends series for "prompt engineering", "context engineering" and "prompt generator" (not accessible in this workstream).
5. Is the ChatGPT app directory's monetisation still limited to physical goods? Status of Claude connector or app monetisation?
6. Exact Claude consumer user counts (no official figure).

## Validation experiments

1. **Head-to-head quality test (with WS6):** 30 realistic builder briefs. For each, compare (a) the raw prompt into Lovable or Claude Code, (b) the platform's native Plan mode, and (c) a SubText brief. Blind-rate the outputs and count rework iterations and credits used. **Kill criterion:** SubText fails to beat native Plan mode by a meaningful margin (e.g., ≥1 fewer iteration on average, or a blind preference ≥60%).
2. **Fake-door demand test by segment:** identical landing pages for vibe coders, marketers and team leads, with a pricing page and a "start free" button. Measure click-to-signup and visits to the pricing page. Budget ~$300–500 of community-targeted ads per segment.
3. **Willingness-to-pay survey:** Van Westendorp plus a stated-switching question ("would you pay this *in addition to* your assistant?"), n ≥ 150 per segment.
4. **Retention probe:** a 4-week concierge or Wizard-of-Oz pilot with 20 builders. Do they come back for project #2 without prompting?
5. **Search-intent check:** run Google Ads for "prompt generator" and "PRD generator" for a week to get actual CPC, CTR and conversion by geography.
