# 10 — Business Model & Go-to-Market (WS7)

**Workstream:** WS7 (business model, pricing strategy, distribution, GTM)
**Date accessed for all sources:** 2026-11-13
**Companion file:** `02_MARKET_RESEARCH.md` (market, segments, threats). Sources: `sources/WS7_sources.md`.
**Labels:** **Verified** = I read the primary source. **Claimed** = self-report or untraced secondary source. **Hypothesis** = my inference. `[snippet only]` = I saw only a search snippet.
**Boundary:** WS1 owns the full competitor price table. Prices below are *anchors* only.

---

## 0. Summary

1. **There is little evidence that people will pay for a standalone consumer prompt tool.**
   - Users concentrate AI spend in one assistant: only 13% of AI payers pay for a second AI product ([a16z](https://a16z.com/100-gen-ai-apps-7/)).
   - The best-known optimiser, PromptPerfect, was reportedly shut down (Claimed).
   - The largest prompt extension (AIPRM, 1M users) shows declining traffic (Similarweb estimate).
   - Labs give prompt optimisers away free to developers.
2. **Price anchors are tight.** A full assistant costs $8 (ChatGPT Go, [MacRumors](https://www.macrumors.com/2026/01/16/chatgpt-go-now-available-worldwide/)), $7.99 (Google AI Plus) or $20 (ChatGPT Plus, Claude Pro, Google AI Pro). A tool that only improves the *input* to that assistant will struggle to charge more than ~$5–10/month to individuals. AIPRM's solo tiers are listed at $10 and $33 ([AIPRM](https://www.aiprm.com/pricing/)).
3. **In this space, money flows to:**
   - (a) tools that *do the work* (app builders, coding agents);
   - (b) power users who spend $100+/month. They are 14% of payers but 60% of spend ([Menlo 2026](https://menlovc.com/perspective/2026-the-state-of-consumer-ai/));
   - (c) teams buying seats for standardisation and governance;
   - (d) capabilities embedded inside platforms. Prompt-management startups were absorbed: Humanloop's team went to Anthropic and Langfuse joined ClickHouse `[snippet only]`.
4. **Recommended model (Hypothesis):** a free tier that is useful on its own and lives where prompts are used (MCP server / Claude and ChatGPT app / Chrome extension). On top of it:
   - a **paid "Builder" tier** for reusable project briefs and context profiles across tools;
   - a **Team tier** for shared brief templates;
   - an exploratory **API/licensing** track that sells the clarification engine to app builders and vertical AI products.

   Plan for the B2B or embedded path to matter more than consumer subscriptions.
5. **Best initial channel (Hypothesis):** community-led distribution into **AI app-builder communities**, with an MCP/agent integration so the brief lands directly in the user's builder or agent. Cheap SEO for "prompt generator" / "PRD generator" free tools runs alongside as top of funnel. That search traffic is mostly non-U.S. and low-value ([RankHero](https://www.rankhero.com/keywords/ai-prompt-generator)).
6. **Strongest initial niche:** non-technical builders using Lovable, Bolt, v0, Replit and similar tools, who need a portable, high-quality spec before they spend credits. Position the product as a **brief/spec builder for AI builds**, not a "prompt generator".
7. **Gate the decision on evidence.** Run a 90-day validation-first plan with explicit kill criteria (Section 8) before committing to a full build.

---

## 1. Business model options compared

| Model | Fit | Evidence | Verdict |
|---|---|---|---|
| **Freemium (consumer)** | Necessary for acquisition; weak monetisation | Freemium apps: median download-to-paid by day 35 is 2.1% (top quartile >4.5%); hard paywalls 10.7%. Year-one retention is nearly identical for both ([RevenueCat](https://www.revenuecat.com/state-of-subscription-apps/)) — Verified | Use freemium, but keep the free tier narrow, because LLM calls cost real money per user (RevenueCat notes AI apps cutting freemium generosity) |
| **Subscription (individual)** | Plausible only for power users | AI apps earn ~41% more per payer but churn ~30% faster ([TechCrunch/RevenueCat](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows)) — Verified secondary | Viable at a low price point; expect high churn |
| **Usage-based / credits** | Good fit for builders, whose own platforms bill in credits | 17% of AI payers are on usage-based plans and 15% on mixed (Menlo 2026) — Verified | Test "pay per brief/spec pack" alongside subscriptions |
| **Developer API** | Labs offer free optimisers; developers have DSPy, Promptfoo, etc. (WS2) | OpenAI Prompt Optimizer and Anthropic prompt improver are free ([cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook); [Maginative](https://www.maginative.com/article/anthropic-launches-tool-to-help-you-write-better-prompts-for-claude)) — Verified | Weak as a "prompt optimisation API". **Stronger as a "clarification/elicitation API"** for consumer apps that need to interview users (Hypothesis) |
| **Team subscriptions** | Where willingness to pay and retention are better | Team-GPT, TeamPrompt (with data-loss prevention) and AIPRM team plans exist; OpenAI reportedly building shared team prompts `[snippet only]` | Year-1 add-on once a consumer wedge proves value; crowded |
| **Enterprise licensing** | High value, slow, needs security work (WS8) | Enterprises use 3+ model families (a16z via The Decoder) — supports model-agnostic standards | Not first; possibly year 2 |
| **Browser extension** | Proven reach for prompt tools (AIPRM 1M users), and Grammarly's playbook | [AIPRM CWS](https://chromewebstore.google.com/detail/aiprm-for-chatgpt/ojnbohmppadfgpejeebfnmnknjdlckgj) — Verified | Good secondary surface. Fragile to DOM changes and platform UI changes. |
| **Desktop app** | Low; adds install friction | No evidence of demand | Skip |
| **Custom GPT (GPT Store)** | Free distribution; no reliable monetisation | GPT Store revenue share stayed a limited pilot `[snippet only]`; "prompt" GPTs claim large conversation counts `[snippet only, Low]` | Use as a free acquisition funnel |
| **ChatGPT app / Claude connector / MCP server** | Cheap distribution *inside* the assistant or agent; delivers the brief directly | ChatGPT app directory open to third parties; monetisation of digital goods reportedly not allowed (Jan 2026) `[snippet only]`; MCP supported across major clients `[snippet only]` | **Primary integration surface for acquisition and workflow lock-in.** Monetise on own web app. |
| **Raycast / VS Code extension** | Niche power-user and developer reach | Developers are least in need (SO 2025; `AskUserQuestion`) | Later, cheap to build |
| **Embedded / partnerships** (app builders, education platforms) | Potentially the largest money pool | Lovable built native questions, which shows they value it and also that they might build rather than buy | Explore. Most likely outcome: a partnership or acqui-hire rather than a licence. |

**Where money actually flows (Hypothesis, high confidence):** In consumer AI, money goes to products that produce the output (assistants, builders, Suno, Midjourney) and to heavy users. In prompt tooling, the developer-side companies with traction were absorbed by platforms rather than becoming large independent businesses. An independent consumer prompt tool's likely ceiling is a profitable small business, unless it becomes the default "brief layer" across several high-spend tools, or is licensed into one.

---

## 2. Willingness-to-pay evidence and price anchors

| Anchor | Price (USD/mo) | Source | Label |
|---|---|---|---|
| ChatGPT Go / Plus / Pro | $8 / $20 / $200 (launch prices, Jan 2026); a $100 Pro tier was reportedly added Apr 2026 | [MacRumors](https://www.macrumors.com/2026/01/16/chatgpt-go-now-available-worldwide/); $100 tier `[snippet only]` | Verified (Go/Plus/Pro); Claimed ($100) |
| Claude Free / Pro / Max | $0 / $20 ($17 annual) / $100+; Team $25 monthly or $20 annual per seat | [claude.com/pricing](https://claude.com/pricing) | Verified |
| Google AI Plus / Pro / Ultra | $7.99 / $19.99 / from $99.99 (I/O 2026) | [The Decoder](https://the-decoder.com/google-overhauls-its-ai-subscriptions-at-i-o-2026-with-three-tiers-starting-at-10-a-month/) | Verified secondary |
| Grammarly (Pro/Premium) | ~$12 annual / ~$30 monthly | Vendr and others `[snippet only]` (live page showed only INR prices) | Claimed |
| AIPRM Plus / Pro | $10 / $33 (billing period not shown) | [AIPRM](https://www.aiprm.com/pricing/) | Verified |
| Median AI payer spend | ~$25/mo | [a16z](https://a16z.com/100-gen-ai-apps-7/) | Verified |
| Top 1% AI spenders | ~$903/mo | same | Verified |

**Interpretation (Hypothesis):**
- **Individuals:** a prompt/brief tool priced above ChatGPT Go or Google AI Plus ($8) would be priced higher than an entire assistant. Plausible range is **$5–10/month**, and higher only for builder-specific value (project libraries, cross-tool export).
- **Power users and builders:** they spend $25–$100+/month on tools. A tool that saves even one wasted build session could justify $10–20/month or credit packs. This is untested.
- **Teams:** Claude Team at $20–25 per seat sets the ceiling for an *assistant*. A brief-standardisation layer would plausibly sit at **$5–12 per seat**.

**Consumer AI conversion and retention benchmarks (for target setting):**
- ChatGPT: 50M+ paid out of ~900M WAU ≈ **5.6%** (calculated from [TechCrunch](https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users)). This is the best-in-class ceiling, not a target.
- RevenueCat (mostly mobile):
  - AI trial-to-paid: 8.5% median;
  - freemium download-to-paid by day 35: 2.1% median, >4.5% top quartile;
  - 12-month retention of AI monthly subscribers: 6.1%;
  - annual plans: 21.1%.

---

## 3. Acquisition: channels and cost

| Channel | Evidence | Assessment |
|---|---|---|
| **SEO (free tools)** | "ai prompt generator" ~74K global monthly, 8.1K U.S., KD 8, CPC ~$0.99; "prompt generator" ~135K global, 8.1K U.S. (6%), CPC ~$0.96; "prompt engineering" down ~33% YoY ([RankHero](https://www.rankhero.com/keywords/prompt-generator)). These are estimates from an Etsy-oriented keyword tool; Low–Med reliability, and I could not access Ahrefs, Semrush or Google Keyword Planner. | Easy to rank, but traffic is mostly from low-willingness-to-pay countries and the category is shrinking. Useful only as cheap top of funnel. Target builder-intent terms instead ("PRD generator", "Lovable prompt", "app spec template"). I collected no volume data for these, so they need testing. |
| **Community-led** (builder Discords and subreddits, YouTube tutorials, X/LinkedIn build-in-public) | Lovable: 1M new projects per week (Dealroom); 15% of developers vibe-code (SO 2025) | **Best initial channel.** The audience is concentrated and suffers the pain. A shareable brief/spec template produces content naturally. |
| **In-assistant distribution** (MCP / ChatGPT app / Claude connector / Custom GPT) | App directory open; MCP widely supported `[snippet only]` | Low-cost discovery. Integration delivers the brief where it is used. Platform-controlled ranking. |
| **Chrome Web Store** | AIPRM shows prompt extensions can reach 1M users | Secondary; useful for "improve before send" inside any AI UI |
| **Partnerships** (app builders, bootcamps, AI-literacy courses) | Coursera prompt course: 756,811 enrolled ([Coursera](https://www.coursera.org/learn/prompt-engineering)) | Education partners could distribute a "learn by being asked" tool. Builder partners may prefer to build in-house. |
| **Paid acquisition** | Low CPCs on generic terms, but AI-app churn means payback must be fast | Use only for tests, not growth, until retention is proven |

**Viral loops (Hypothesis):** Shareable briefs ("here's the spec I used to build X with Lovable") and public template galleries. Every exported brief can carry an unobtrusive "built with SubText" footer the user can remove. Remixable templates per project type. PromptBase and AIPRM show people browse and share prompts, but their traffic shows the ceiling of prompt-as-content.

---

## 4. "AI wrapper" economics and platform risk

- **Gross margin:** each elicitation session needs several LLM calls (analysis, question generation, final synthesis). RevenueCat reports AI apps cutting free tiers and pushing annual plans because of per-user model costs (Verified). Implication: use small, fast models for question selection, cap free sessions, and pass heavy usage to paid tiers (WS6 to cost this).
- **Platform risk is direct, not hypothetical.** The core feature (asking clarifying questions before acting) already ships natively in Lovable, Claude Code and ChatGPT deep research, and optimisers ship free from OpenAI and Anthropic (all cited in `02`). Jasper's valuation cut after ChatGPT and Copy.ai's pivot to GTM workflows `[snippet only]` show how thin AI-writing wrappers ended up.
- **Distribution risk:** ChatGPT apps reportedly can't sell digital goods `[snippet only]`. GPT Store revenue sharing stayed a pilot `[snippet only]`. Chrome extensions depend on host UIs.
- **Moats that are plausible (Hypothesis):**
  1. **Cross-tool portability.** One brief, exported to Lovable, Bolt, v0, Claude Code, ChatGPT and Gemini. Users run 3.0 assistants on average, and no lab will optimise for a rival.
  2. **Persistent project and context profiles** that outlive any one chat.
  3. **Team standards and templates.**
  4. **Evaluation data** on which questions improve outcomes (WS5/WS6).

  None of these is strong on its own.

---

## 5. Best initial distribution channel and why

**Recommendation (Hypothesis, medium confidence):** **Community-led launch inside AI app-builder communities, with a free web app plus an MCP/agent integration and one-click export to the major builders.**

Why:
1. The pain is sharpest and most monetary there (credits, rework).
2. The audience is concentrated, active and content-hungry: tutorials, templates and show-and-tell.
3. Cross-builder export is something a single platform's native Plan mode cannot offer.
4. A free tool is cheap to seed (no ad spend needed to get the first 1,000 users if the brief template is genuinely useful; this is an assumption to test).

Why not SEO-first: generic prompt-generator demand is shrinking and mostly non-U.S.
Why not the GPT Store first: there is no monetisation path.
Why not enterprise first: slow cycles, security requirements (WS8), and no proof of value yet.

### 5a. Channel scorecard (Hypothesis; 1–5, 5 = best)

| Channel | Reach to target niche | Cost to acquire | Monetisation path | Platform dependence (5 = low) | Speed to signal | Total /25 |
|---|---|---|---|---|---|---|
| Builder communities (Discord, Reddit, YouTube creators) | 5 | 4 | 4 (to own web app) | 4 | 5 | **22** |
| MCP server / Claude connector | 3 | 5 | 2 (no in-platform billing assumed) | 2 | 3 | 15 |
| ChatGPT app / Custom GPT | 4 | 5 | 1 (digital goods reportedly not allowed `[snippet only]`) | 1 | 4 | 15 |
| Chrome extension | 3 | 4 | 4 | 2 (host DOM changes) | 3 | 16 |
| SEO free tools ("prompt generator") | 2 (non-U.S., generic intent) | 4 (KD 8) | 2 | 3 (Google) | 2 | 13 |
| Builder-platform partnership | 5 | 3 | 4 | 1 | 1 | 14 |
| Education partnerships | 3 | 3 | 2 | 4 | 2 | 14 |
| Paid ads | 3 | 2 | 3 | 4 | 4 | 16 |
| Raycast / VS Code | 2 | 4 | 3 | 3 | 3 | 15 |

Communities win because they have the highest reach to the niche *and* send people to a surface the product controls. The in-assistant channels are the cheapest way to get discovered, but they hold users inside someone else's billing and ranking. Use them to move users into the funnel, not to make money.

### 5b. Strongest initial niche: reasoning and fallback

**Primary niche: non-technical builders** (founders, designers, operators) **using AI app builders.** Section 12 of `02` scores this group 26/35, the highest of any segment. The reasons:
- **The cost of a bad brief is visible.** Wrong builds burn credits and time. Lovable shipped a questions tool specifically because vague prompts lead the AI to guess ([Lovable](https://lovable.dev/en/blog/chat-mode-and-questions)).
- **Money already flows.** Lovable has passed $500M ARR ([Dealroom](https://dealroom.co/news/134215-lovable-hits-500m-annualised-revenue-as-ai-app-builders-boom/)).
- **The output lasts.** A spec or PRD is kept and reused across iterations, unlike a throwaway chat prompt. That supports retention.
- **Cross-tool portability is a gap.** Each platform's native Plan mode serves only that platform.

**Biggest risk:** native Plan modes may be good enough. The head-to-head test in Section 8 is the gate.

**Fallback niches, in order:**
1. **Knowledge workers launching agent or deep-research runs.** The same "costly brief" logic applies, but the audience is more diffuse and harder to reach.
2. **Teams standardising briefs** (B2B). Willingness to pay and retention are better, but sales cycles are slower.
3. **API/embedded licensing** to vertical AI apps.

**Explicitly not first:**
- **Students:** willingness to pay is weak and premium tiers are given away to them.
- **Casual consumers:** friction exceeds benefit (NBER: more than 70% of usage is non-work).
- **Developers:** they are skilled prompters and `AskUserQuestion` already covers them.

### 5c. Unit economics sketch (Hypothesis; needs WS6 costing)

| Input | Assumption | Basis |
|---|---|---|
| Price (Builder) | $10/mo | Midpoint of the $8–12 hypothesis; at or below assistant anchors |
| LLM cost per guided brief | Unknown. **WS6 must estimate it.** Plausibly cents per session if small models handle question selection. | Not researched here |
| Paid churn | ~15–20%/month (blended) | AI monthly subscribers keep only 6.1% at 12 months (RevenueCat), which implies ~21% average monthly churn (0.79^12 ≈ 0.06). The lower bound assumes SubText does better than the median. |
| Expected paid lifetime | ~5–7 months → LTV ≈ $50–70 gross revenue (before LLM and payment costs) | Arithmetic from the above |
| Affordable CAC (LTV:CAC ≥ 3) | ≤ ~$17–23 per paying user | Arithmetic |
| Implied CAC per free signup at 2% free→paid | ≤ ~$0.35–0.45 | Arithmetic: only near-zero-cost channels (community, organic, in-assistant) fit |

**Conclusion (Hypothesis):** at consumer prices and AI-app churn rates, paid acquisition does not pay back. The business only works with organic or community distribution, or with a higher-value B2B or API buyer. This reinforces the channel choice and the B2B option.

### 5d. Activation, retention and monetisation definitions

- **Activation:** in the first session, the user completes the question flow and copies or exports a brief.
- **Aha moment (to validate in WS3 and WS4):** the user sees a question they would not have thought of, and it changes the output.
- **Retention:** the user creates a second brief within 28 days. Month-2 retention of paid users is tracked separately.
- **Monetisation trigger:** the second or third project, or reaching the free-brief limit, or wanting saved project profiles or team sharing.
- **Leading quality indicator:** the share of exported briefs that users report "worked first time" in an in-product thumbs-up after the build or task (with consent).

---

## 6. Positioning options (3–5, by niche)

1. **Builders (recommended):** "Describe your app idea. SubText asks the questions a senior product manager would, then gives you a build-ready spec for Lovable, Bolt, v0 or Claude Code. Fewer wasted credits, fewer rebuilds."
2. **Agent / deep-research users:** "Before you send an agent off for 30 minutes, spend 60 seconds getting the brief right. SubText finds what's missing and writes the brief your agent needs."
3. **Teams:** "Your team's best briefs, reusable. Shared templates that ask the right questions every time, across ChatGPT, Claude and Gemini."
4. **Learners and educators:** "Get better results by being asked better questions. SubText shows you what a great request includes, and you learn while you work."
5. **Embedded / API (B2B):** "An intent-clarification engine for your AI product. Interview users adaptively and turn vague requests into structured, complete inputs."

Avoid "prompt generator" or "prompt engineering" as the headline category. That language matches shrinking search interest (`02`, Section 2) and invites comparison with free optimisers.

---

## 7. Business model recommendation

**Recommended (Hypothesis, to validate):**
- **Free:** a limited number of guided briefs per month, unlimited editing and copying, export to any tool, and an MCP/connector integration.
- **Builder ($8–12/mo, or credit packs):** saved project profiles, unlimited briefs, multi-tool export presets, versioned briefs, a brief library.
- **Team ($6–10 per seat, minimum 3):** shared templates, admin controls, basic usage insight (WS8 must review data handling).
- **Exploratory API/licence:** the clarification engine for builder platforms and vertical AI apps, priced per session or as a platform licence. Pursue this as soon as the engine shows measurable uplift. It may be the real business.

**Explicit skepticism:** if the head-to-head test shows native Plan modes get within a small margin of SubText's output quality, the consumer subscription will not hold. Then the options are the embedded/API route or stopping.

---

## 8. First 90 days: validation-first GTM

Targets marked **[A]** are assumptions to test. They are anchored to the cited benchmark, not invented, and still need validating for this product.

| Phase | Weeks | Actions | Success metrics and targets |
|---|---|---|---|
| **0. Pre-build validation** | 1–3 | Fake-door landing pages for three positionings (builders, agent users, teams); Van Westendorp survey; 15–20 user interviews (WS3 guide); concierge briefs for 10 builders | Landing → waitlist ≥10% from community traffic **[A, no reliable benchmark; set as a learning threshold]**. ≥40% of interviewees describe a wasted build or rework in the past month **[A]**. Van Westendorp acceptable range identified with n ≥ 150. |
| **1. Head-to-head proof** | 3–5 | 30-task blind comparison: SubText brief vs. native Plan mode vs. raw prompt (with WS6) | **Kill or pivot gate:** SubText preferred in ≥60% of blind comparisons, *or* ≥1 fewer iteration on average **[A]** |
| **2. Free beta launch in builder communities** | 5–9 | Free web app plus MCP integration and export presets; publish 10 public spec templates; creator collaborations (2–3 tutorial videos) | Activation = completes the questions *and* exports a brief within the first session. Target ≥40% of signups **[A]**. Week-4 return rate (2nd brief) ≥20% **[A]**. No reliable public benchmark exists for this exact metric, so treat the first cohort as a baseline. |
| **3. Monetisation test** | 9–13 | Introduce the Builder tier; A/B test $8 vs $12, and credit packs vs subscription; painted-door Team tier | Free→paid by day 35 ≥2% (RevenueCat freemium median 2.1%), stretch 4.5% (top quartile) — **[A, anchored]**. Track refund rate (AI median 4.2%) and month-2 retention. Team painted-door clicks from ≥5% of active users **[A]**. |
| **4. B2B probe** (parallel) | 6–13 | 5–10 conversations with app-builder and vertical-AI product teams about embedding a clarification API | ≥2 letters of intent or paid pilots signals the embedded path **[A]** |

**North-star metric (Hypothesis):** *briefs exported that were followed by a successful build or task without major rework* (self-reported plus integration telemetry where users consent).

---

## 9. Pricing hypotheses and how to test them

| Hypothesis | Test | Decision rule |
|---|---|---|
| H1: Individuals won't pay more than an assistant ($8) for prompt help | Van Westendorp (too cheap / cheap / expensive / too expensive) plus "in addition to your current AI subscription?" | If the optimal price point is below $5, consumer subscriptions are not viable, so shift to team/API |
| H2: Builders pay more because the cost is visible (credits) | Segment-specific Van Westendorp; fake-door $12 Builder plan vs $8 | Builders' acceptable range is ≥1.5× generic users' → focus there |
| H3: Credit packs beat subscriptions for episodic builders | A/B: $9 for 20 briefs vs $9/mo unlimited | Higher conversion and revenue per visitor wins |
| H4: Teams value standard templates enough to pay per seat | Painted-door "Team" button plus 10 discovery calls | ≥3 teams agree to a paid pilot at ≥$6 per seat |
| H5: Free-tier limits affect conversion more than price does | Vary free briefs/month (3 vs 10) | Choose the limit that maximises paid conversion without lowering activation by more than 20% |

Methods: Van Westendorp Price Sensitivity Meter (n ≥ 150 per segment); Gabor-Granger for specific price points; fake-door pricing pages with "join waitlist at this price"; painted-door upgrade buttons in the beta; and once traffic exists, live price A/B tests with refund tracking.

---

## Verified vs. claimed vs. hypothesis (load-bearing items)

| Claim | Status |
|---|---|
| Price anchors (ChatGPT $8/$20/$200; Claude $20/$100; Google $7.99/$19.99/$99.99; AIPRM $10/$33) | Verified (Google via secondary report) |
| Freemium 2.1% vs hard paywall 10.7% conversion; AI 30% faster churn | Verified (RevenueCat / TechCrunch) |
| 13% of payers pay for a second AI product | Verified (a16z) |
| ChatGPT apps can't sell digital goods | `[snippet only]` |
| Humanloop and Langfuse absorbed | `[snippet only]` |
| "Prompt generator" search volumes | Claimed estimates (RankHero) |
| Builder niche, pricing ranges, 90-day targets | Hypothesis (targets anchored where marked) |

## Unresolved questions

1. Real revenue and conversion of any independent prompt tool (AIPRM, God of Prompt, PromptBase). None is public.
2. Current monetisation rules for ChatGPT apps and Claude connectors (late 2026).
3. Would builder platforms license an elicitation engine, or keep building their own? Lovable's native questions tool suggests build.
4. LLM cost per guided session, and so the gross margin at $8 (WS6).
5. U.S. search volume for builder-intent keywords ("PRD generator", "app spec", "Lovable prompt"). Not collected.
6. Data/privacy obligations for team tiers and integrations (WS8).

## Validation experiments

See Section 8 (the 90-day plan) and Section 9 (pricing tests). The **single most important experiment** is the head-to-head blind comparison against native Plan or clarification modes. If SubText does not clearly win, no business model fixes it.
