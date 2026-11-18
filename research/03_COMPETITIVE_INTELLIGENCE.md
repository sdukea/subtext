# 03 · Competitive Intelligence (WS1)

Accessed: 2026-11-13. Full competitor data: `research/data/competitors.csv` (53 rows). Sources: `research/sources/WS1_sources.md` (IDs `[WS1-n]`).

Labels used: **Verified** (I read the primary source or inspected the product), **Claimed** (vendor marketing or self-report), **Hypothesis** (my inference). `[snippet only]` means I saw only a search-result summary, not the page.

---

## Summary of key findings

1. **The core idea already exists, several times over, and some versions are free.** At least six standalone tools already run "describe → clarifying questions → structured prompt": Prompt Like A Pro (free, no signup), get-prompt.ai (up to five optional questions aimed at detected gaps), Pretty Prompt's Optimizer, Prompt Builder (up to three questions), Feedough (three tailored follow-ups with quick picks, free and unlimited) and NeuralWriter `[snippet only]`. **Verified/Claimed** from their own pages [WS1-27, 28, 29, 31, 35]. None shows meaningful scale. The largest has roughly 44K visits in three months [WS1-48].
2. **The same loop is now built into products where the prompt is actually used.** Bolt.new's "Enhance prompt" opens a "Help us enhance your prompt" dialog with questions, then returns an editable prompt (**Verified** [WS1-16]). Lovable Plan mode "often asks clarifying questions" (**Verified** [WS1-17]). Claude Code and Cursor ask structured multiple-choice questions in plan mode [WS1-19, 21]. Microsoft ships a free **Prompt Coach** agent to every Copilot Chat user [WS1-23, 25].
3. **The general-purpose assistants now clarify natively.** Since March 2026, Claude can show clickable multiple-choice, multi-select or ranking options in place of typed replies, on all plans (**Verified** [WS1-15]). ChatGPT Deep Research "may ask clarifying questions" and lets you edit its plan [WS1-8, snippet only]. ChatGPT shopping research asks about budget and preferences first [WS1-9]. Gemini Deep Research shows an editable plan [WS1-11].
4. **The labs are retiring their own standalone prompt-improvement tools.** This is the strongest disconfirming signal I found. Anthropic sunset its legacy Workbench and retired its generate/improve/templatize prompt APIs on Aug 17, 2026 (**Verified**, release notes [WS1-1]). The prompt-improver and prompt-generator doc URLs now redirect to a general best-practices page [WS1-3]. OpenAI is shutting down its dataset-backed Prompt Optimizer, along with Evals, reusable prompts and Agent Builder, on Nov 30, 2026 (**Verified** [WS1-4, 5]). **Hypothesis:** the labs see the value moving into the model and the agent loop, not into a separate "improve my prompt" step.
5. **Shutdowns, pivots and consolidation run across the category.** Anthropic acqui-hired Humanloop and shut it down in Sept 2025 (**Verified** [WS1-50]). Elastic acquired PromptPerfect's parent, Jina, in Oct 2025 (**Verified** [WS1-33]); PromptPerfect itself reportedly closed on Sept 1, 2026 (**Claimed** by a competitor [WS1-32]). FlowGPT pivoted to character chat [WS1-61]. Vellum pivoted to a personal AI assistant (**Verified** [WS1-57]). ClickHouse bought Langfuse, Mintlify bought Helicone, and OpenAI bought Promptfoo [WS1-51, 52, 53]. Traffic to AIPRM, PromptBase and PromptHero is flat or falling [WS1-43, 44, 46].
6. **Willingness to pay looks weak.** Direct tools charge roughly $8–20 a month and nearly all have generous free tiers. The median marketplace prompt sells for about $5.99 [WS1-62, low reliability]. Hacker News launches of prompt improvers typically draw 1–14 points [WS1-65]. A typical HN reaction asks why this beats "generating a prompt from the LLM itself" [WS1-64].
7. **Where room may remain (Hypothesis):** (a) deciding which questions are worth asking, an explicit value-of-information stop rule that no competitor documents; (b) a portable, provider-neutral "intent brief" that carries over into Claude, ChatGPT, Gemini and coding agents; (c) evidence that the prompt actually improved the output, which no consumer competitor shows; (d) team or enterprise standards for prompting outside the Microsoft ecosystem. Each is thin and easy for the platforms to copy.

**Bottom line for the client:** a standalone, general-purpose "ask clarifying questions, then generate a prompt" product is **not novel**. It is being commoditised from three directions at once: free indie tools, vertical builders, and the frontier assistants. The labs that know the most about prompting are retiring their dedicated tools. If SubText is built, it needs a sharper wedge than the thesis as written (see sections G–I).

---

## Method and limitations

- I read official docs, changelogs, pricing pages and help centres where they were reachable, and inspected Lateni's public JavaScript bundle because its single-page app would not render for fetching.
- **Blocked or partial:** help.openai.com (403; I relied on search snippets of the official page), PromptBase and FlowGPT (Cloudflare challenge, not bypassed), G2 (403), and Reddit (blocked in both the fetch tool and the browser; `site:reddit.com` searches returned nothing usable). **The Reddit sentiment the brief asked for could not be collected directly.** Sentiment below draws on HN (via the Algolia API), Product Hunt, Chrome Web Store figures, GitHub-issue mirrors and press.
- I did not sign up for or log into any product, so the UI was not tested hands-on. "Inspected" in the CSV means public pages or static assets only.
- Not covered individually: Agenta, Arize Phoenix, W&B Weave, Jasper, Copy.ai, Notion AI, Zapier/n8n/Make/Dify/Flowise/Relevance AI, Perplexity, Meta AI, Grok and Manus (Manus appears only through a competitor's claim). Their relevance to the thesis is low; see Unresolved questions.

---

## A. Competitor database (summary)

Classification: **Direct** means it turns a vague request into a better prompt for use elsewhere. **Substitute** means users get the same outcome without a prompt tool (native clarification, DIY "ask me questions"). **Indirect** means it improves prompts but without clarification (one-click rewriters, libraries). **Adjacent** means prompt management or evals for engineers. **Potential future** means a well-placed company with no feature yet.

| Name | Class | Asks questions? | Price (accessed 2026-11-13) | Verification | Threat |
|---|---|---|---|---|---|
| ChatGPT / Claude / Gemini (chat, projects, memory, custom instructions) | Substitute | When asked; Claude has native clickable options [WS1-15] | Free–$200+/mo | Docs | **H** |
| Claude.ai interactive options | Substitute | Y (multiple-choice, multi-select, ranking) | All plans | Docs | **H** |
| ChatGPT Deep Research | Substitute | "May ask" + editable plan [WS1-8] | ChatGPT plans | Marketing-only (snippet) | **H** |
| Gemini Deep Research | Substitute | Plan edit, no questions documented [WS1-11] | Gemini plans | Docs | **H** |
| Bolt.new Enhance prompt | Direct (embedded) | **Y**: guided questions dialog [WS1-16] | Bolt plans | Docs | **H** |
| Lovable Plan mode | Substitute (vertical) | Y [WS1-17] | 1 credit/msg | Docs | **H** |
| Claude Code plan mode / AskUserQuestion | Substitute (dev) | Y | Claude plans | Docs | **H** (dev) |
| Microsoft 365 Prompt Coach | Direct (enterprise) | Y (per walkthroughs) [WS1-24] | Free with Copilot Chat | Docs | **H** (enterprise) |
| Pretty Prompt | Direct | Partial (Optimizer) | Free 5/wk; Pro from $8.25/mo | Marketing-only | M |
| Prompt Builder (promptbuilder.cc) | Direct | Partial (≤3 Qs) | Free 5; $9 / $19 / $49 | Marketing-only | M |
| get-prompt.ai | Direct | Y (≤5 optional, gap-targeted) | Free trial; Pro price not shown | Marketing-only | M |
| Feedough Prompt Generator | Direct | After first draft (3 Qs, quick picks) | Free, unlimited | Marketing-only | M |
| Prompt Cowboy | Direct | Claimed by 3rd party | ~$11/mo `[snippet only]` | Marketing-only | M |
| GPT Store "Prompt Professor"/"Prompt Engineer" GPTs | Substitute/Direct | Unknown | Free in ChatGPT | Marketing-only | M |
| Prompt Like A Pro | Direct | Y | Free, no signup | Marketing-only | L |
| Lateni (5W3H Prompt Designer) | Direct | Unknown (form + AI expansion) | CNY subscription; free trial | Inspected | L |
| PrompTessor | Direct | N (iterates on feedback) | Free 5/mo; $10–20 | Marketing-only | L |
| NeuralWriter Prompt tool | Direct | ≤3 Qs `[snippet only]` | Free | Marketing-only | L |
| PromptPerfect (Jina/Elastic) | Direct (defunct) | N | Was freemium | Docs + Claimed shutdown | L |
| One-click enhancer extensions (Promptify, PromptJolt, Prompt Genie, Promptimize, PromptDC, Prompt Pilot) | Indirect | N | Free–~$12/mo | Marketing-only | L |
| OpenAI Playground Generate | Indirect | N | Free | Docs | M |
| Anthropic Console improver/generator | Direct (dev; status uncertain) | N (feedback loop) | Free in Console | Docs | M |
| Vertex AI Prompt Optimizer | Indirect | N | Usage-based | Docs (snippet) | M |
| Gemini Gems magic wand | Substitute | N | Included | Docs (snippet) | M |
| AIPRM | Indirect (library) | N | Free; Plus $10; Pro $33 | Docs | L |
| PromptBase / PromptHero / FlowGPT (Kaon) | Indirect / Adjacent | N | Marketplace commission / freemium | Marketing-only | L |
| PromptLayer, Langfuse, Helicone, PromptHub, LangSmith, Braintrust, Promptfoo, DSPy | Adjacent | N | Free tiers; $12–$249/mo | Docs | L |
| Superhuman (formerly Grammarly) Go | Potential future | N | Go free to Feb 2026; Pro ~$12–15 | Marketing-only | M |
| ChatPRD | Adjacent | Unknown | Free; $15; $29/seat | Docs | L |

**Competitor vs. adjacent.** Only the "Direct" rows compete for the same job: "turn my vague ask into a strong prompt I take elsewhere." The biggest threats are substitutes, which deliver the result the user wants (good output) without a separate prompt artefact.

---

## B. Feature comparison matrix

Y = documented; P = partial; N = not documented; ? = unknown. Rows are SubText's thesis capabilities (AGENT_BRIEF steps 2–10).

| Capability | SubText (thesis) | get-prompt.ai | Pretty Prompt | Prompt Builder | Feedough | Bolt Enhance | Claude.ai | ChatGPT Deep Research | MS Prompt Coach | Anthropic Improver | OpenAI Generate |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Accepts vague request | Y | Y | Y | Y | Y | Y | Y | Y | Y | N (needs a draft prompt) | Y |
| Detects missing context | Y | Y (claimed) | P | P | P | P | P | Y | P | N | N |
| Asks clarifying questions | Y | Y (≤5) | P (Optimizer) | P (≤3) | Y (after draft) | Y | Y (clickable) | Y ("may") | Y | N | N |
| Adaptive questions | Y | P | ? | ? | Y | ? | Y | P | ? | N | N |
| Stops when value of more info is low | Y | P (optional/skippable) | ? | ? | P (skip) | ? | ? | ? | ? | N | N |
| Structured optimised prompt output | Y | Y | Y | Y | Y | Y | N (answers directly) | N (executes) | Y | Y | Y |
| Review / edit / copy | Y | Y | Y | Y | Y | Y (editable) | n/a | Plan edit | Y | Y | Y |
| Multi-provider conventions | Y | Y | Y | Y | P | N | N | N | N | N | N |
| Runs the prompt | N | N | N | Y (Assistant) | N | Y | Y | Y | N | Y | Y |
| Persistent user context/memory | ? | ? | Library | Library | Memory | Project | Projects/memory | Memory | M365 graph | N | N |
| Shows outcome improvement evidence | ? | N | N | N | N | Before/after example | N | N | N | Claimed +30% (internal test) | N |
| Browser extension / in-place | ? | N | Y | Y | N | n/a | n/a | n/a | n/a | n/a | n/a |
| MCP / agent integration | ? | N | Y | N | Y | n/a | n/a | n/a | n/a | n/a | n/a |

Takeaway (**Hypothesis**): every thesis row is already covered somewhere. No single product combines adaptive, value-gated questioning with provider-specific output **and** proof that results improved. That combination is the only unoccupied cell, and the last item (proof) is the hardest to deliver.

---

## C. Pricing comparison (accessed 2026-11-13)

| Product | Free tier | Paid | Pricing page |
|---|---|---|---|
| Pretty Prompt | 5 prompts/week | Pro from $8.25/mo | https://www.pretty-prompt.com/ |
| Prompt Builder | 5 credits | Starter $9 · Pro $19 · Unlimited $49 /mo; lifetime $149 promo | https://promptbuilder.cc/ |
| PrompTessor | 5 uses/mo | Pro $10 · Pro+ $15 · Max $20 /mo | https://promptessor.com/ |
| get-prompt.ai | First few prompts + 1 optimizer run | Pro (price not shown) | https://get-prompt.ai/ |
| Feedough | Unlimited, no login | n/a | https://www.feedough.com/ai-prompt-generator/ |
| Prompt Like A Pro | Free, no signup | Tip jar | https://www.promptlikea.pro/ |
| Prompt Cowboy | Freemium | ~$11/mo `[snippet only]` | https://www.promptcowboy.ai/ |
| AIPRM | Free (unlimited time) | Plus $10 · Pro $33 (examples on page) | https://www.aiprm.com/pricing/ |
| PromptHub | 10 enhancements/mo | Pro $12 ($9 yearly) · Team $20/user | https://www.prompthub.us/pricing |
| PromptLayer | 5 users, 2.5k req/mo, 10 prompts | Paid tiers | https://www.promptlayer.com/pricing |
| LangSmith | 1 seat, 5k traces | Plus $39/seat/mo | https://www.langchain.com/pricing |
| Braintrust | Starter free | Pro $249/mo | https://www.braintrust.dev/pricing |
| ChatPRD | 3 chats | Pro $15 · Teams $29/seat | https://www.chatprd.ai/pricing |
| MS Prompt Coach | Included with Copilot Chat | n/a | [WS1-25] |
| OpenAI Generate / Anthropic tools / Claude options / Bolt Enhance | Included | n/a | [WS1-6, 1, 15, 16] |

Pattern (**Verified** across pages): consumer prompt tools cluster at **$8–20 a month** with permanent free tiers, and the best substitutes cost nothing extra. Price competition sits at the floor; vertical builders and assistants bundle the feature for free.

---

## D. Positioning analysis

Two axes separate the field: **who it serves** (consumer/prosumer ↔ developer/enterprise) and **where the work happens** (standalone, copy-paste ↔ embedded where the prompt is used).

```
                     EMBEDDED (prompt consumed in place)
                                   |
   Claude.ai options  ChatGPT DR   |   Claude Code plan/AskUserQuestion
   Gemini DR plan     Gems wand    |   Cursor plan   Devin /megaplan
   Bolt Enhance(Qs)   Lovable Plan |   MS Prompt Coach (M365)
   Ideogram Magic Prompt           |   LangSmith Engine  Braintrust Loop
 CONSUMER -------------------------+------------------------- DEVELOPER/ENTERPRISE
   Pretty Prompt (ext)  PromptDC   |   OpenAI Generate   Vertex optimizer
   AIPRM (library ext)             |   Anthropic improver (retiring)
   get-prompt.ai  Prompt Builder   |   PromptHub  PromptLayer  Langfuse
   Feedough  Prompt Like A Pro     |   DSPy  Promptfoo
   [SubText thesis sits here]      |
                     STANDALONE (copy/paste to another tool)
```

**Reading (Hypothesis):** SubText as specified sits in the most crowded, least defensible quadrant: consumer and standalone, where the free tools live. Momentum is moving up the chart toward embedded flows, and every frontier vendor is investing there. Prompt Builder and Pretty Prompt are moving toward embedded use through browser extensions and MCP servers [WS1-29, 31].

---

## E. Customer sentiment analysis

Evidence base: HN threads read via the Algolia API, Product Hunt reviews, Chrome Web Store aggregates, GitHub-issue mirrors and consumer press. **Reddit could not be accessed**, which is a material gap.

**What users like about prompt enhancers**
- Speed and less trial-and-error. Pretty Prompt's PH reviews (5.0 from 19) centre on "productivity boost" and "time-saving." One reviewer said "take it away from me now and I'd be genuinely annoyed" [WS1-30]. Small, launch-biased sample.
- They help beginners learn to prompt [WS1-30].
- AIPRM keeps 1,000,000 Chrome users at 4.4 stars (3.4K ratings) [WS1-42]. Templates in the chat box retain users, but traffic is falling 6.9% month on month [WS1-43].

**Recurring objections and complaints**
- **"Why not just ask the LLM?"** On a Show HN for a prompt tool, a commenter asked why it "would be better than generating a prompt from the LLM itself" [WS1-64]. Press and libraries publicise the DIY version: add "ask me any contextual questions before you answer" [WS1-67, 69].
- **Native assistants already clarify when asked.** In a Feb 2026 HN thread, a user wrote that question-and-answer clarification is "existing behavior of codex and claude at the moment"; others named Cursor's planning mode [WS1-63].
- **Up-front questions have limits.** The same thread: "You don't know what you want. That's why asking questions doesn't work" (clktmr). The commenter argued that clarity comes from iterating on solutions [WS1-63]. This directly challenges the thesis's elicit-first premise.
- **Question fatigue.** Users call ChatGPT's habit of ending replies with questions annoying [WS1-68]. Claude Code users report the question widget interrupting reading and losing typed answers [WS1-20]. OpenAI's release notes reportedly describe GPT-5.5 Instant as cutting "unnecessary follow-up questions" [WS1-10, snippet only, translated page]. **Hypothesis:** the frontier is tuning toward *fewer* questions, which makes value-gating essential rather than optional.
- **Signup friction kills trial.** An HN commenter complained about having to make an account just to test the tool [WS1-64]. The free competitors all let you start with no signup.
- **Requests from people who use the tools:** a native desktop app, more integrations, custom-context controls [WS1-30]. They want the tool where they already work, not another tab.

**Abandonment and switching signals**
- PromptPerfect users were pushed to alternatives by the shutdown [WS1-32]; Humanloop customers were forced to migrate [WS1-50].
- OpenAI points Evals users to Promptfoo [WS1-5]. Anthropic's Workbench users lost saved prompts and evals unless they exported them [WS1-1].

**Developer interest is low.** HN stories since 2024 about prompt improvers, enhancers or optimizers mostly drew 1–14 points and 0–8 comments [WS1-65].

---

## F. Competitive threat assessment

| Threat | Level | Why |
|---|---|---|
| Frontier assistants (Claude, ChatGPT, Gemini) | **High** | Native clarifying UI (Claude, Mar 2026 [WS1-15]); clarify-first deep research and shopping flows [WS1-8, 9]; memory and projects keep context. They own the destination and can turn the feature on for hundreds of millions of users. |
| Vertical builders and coding agents (Bolt, Lovable, Replit, Claude Code, Cursor, Devin) | **High** | They clarify where the prompt is consumed and can tailor questions to their own domain. Bolt already ships the thesis loop [WS1-16]. |
| Microsoft Prompt Coach | **High (enterprise)** | Free, bundled, already inside the enterprise tenant [WS1-25]. |
| Superhuman (Grammarly) | **Medium (latent)** | Sits in every text box on 1M+ sites and apps; "improve this AI prompt" is a small step [WS1-60]. |
| Indie direct tools (Pretty Prompt, Prompt Builder, get-prompt.ai, Feedough) | **Medium as a group, Low individually** | They prove the idea, anchor price near zero and win SEO for "prompt generator". None has meaningful scale. |
| Libraries and marketplaces | **Low** | Declining traffic; a different job (templates). |
| Dev prompt management and evals | **Low** | A different buyer; consolidating into larger platforms. |

---

## G. Market whitespace analysis

These are candidate gaps, each with its counter-evidence. All are **Hypothesis**.

1. **Value-gated questioning.** No competitor documents deciding *whether* a question is worth asking. get-prompt.ai and NeuralWriter skip questions when the idea is clear [WS1-28, 38], which is a crude form of this. *Counter:* labs are actively tuning this behaviour [WS1-10, 15], so any lead may be short-lived.
2. **A portable, provider-neutral intent brief.** Assistant memory and projects are locked to one vendor; a person using Claude, ChatGPT, Cursor and Lovable re-explains context in each. *Counter:* MCP servers from Pretty Prompt and Feedough already move toward this [WS1-29, 35], and memory import between vendors may become standard.
3. **Proof that outcomes improved.** No consumer tool measures whether its prompt produced better output. Anthropic's own +30% claim came from internal tests, and its improver was later retired [WS1-2, 1]. The Lateni author's paper finds gains shrink sharply for the strongest model (+0.217 vs +1.006 on a 5-point judge scale) [WS1-40]. *Counter:* if gains near zero on frontier models, measuring them honestly may show there is no product.
4. **Non-developer handoff into agents.** Converting a vague business ask into a spec or brief for coding and research agents. *Counter:* the agents (Lovable Plan, Claude Code AskUserQuestion, Devin) do this inside their own flows [WS1-17, 19, 22]; ChatPRD occupies the PM version [WS1-59].
5. **Prompting standards for teams outside Microsoft 365** (shared intent templates, governance). *Counter:* PromptHub and PromptLayer serve the developer version [WS1-58, 54], and Microsoft gives away Prompt Coach.

---

## H. Opportunities for differentiation

All **Hypothesis**; each should be validated before build (see Validation experiments).

- **Lead with outcome, not prompt.** Measure and show improvement on the user's own task (side-by-side output from the target model) instead of handing back a prettier prompt. This addresses the main objection and is something native assistants have no incentive to show.
- **An explicit question budget.** Ask zero to three questions, chosen by expected impact, with tappable answers and "skip, assume X" defaults shown visibly. Compete on *fewer, better* questions; the market already resents more.
- **Embed where prompts are consumed.** Browser or desktop overlay, MCP server, and handoff into Claude, ChatGPT, Cursor and Lovable. Standalone copy-paste is the weakest position (section D).
- **Pick a vertical with high-stakes, underspecified requests** (e.g. research briefs, agent specs for non-engineers, marketing or legal briefs), where a wrong assumption is costly and native assistants underperform. Generic "write a professional email" is fully commoditised.
- **Make the intent model portable** across vendors and persistent across sessions, as a user-owned asset.

---

## I. Why would somebody use our product instead of simply asking ChatGPT, Claude or Gemini to improve their prompt?

### What native assistants already do (evidence)

| Capability | Status | Evidence |
|---|---|---|
| Claude asks clarifying questions with clickable options | **Yes**, all users, help article dated Mar 16, 2026 | **Verified** [WS1-15] |
| ChatGPT Deep Research asks clarifying questions and offers an editable plan | **Yes** ("may ask") | Official help page, **snippet only** [WS1-8] |
| Gemini Deep Research lets you edit its research plan | **Yes**; no clarifying questions described | **Verified** [WS1-11] |
| Claude Research asks clarifying questions | **Not documented** in the help article | **Verified absence** [WS1-14] |
| Anthropic prompt improver | Existed from Oct 2024 (CoT, XML, examples, prefill; no questions). In 2026 the Workbench and prompt APIs were retired and the docs now redirect. Current UI status unverified | **Verified** [WS1-1, 2, 3] |
| OpenAI prompt tools | Playground Generate still documented, with its meta-prompts published; dataset-backed Optimizer shuts Nov 30, 2026 | **Verified** [WS1-4, 5, 6] |
| Google | Vertex zero-shot optimizer explains which guidelines it applied; the Gems wand rewrites instructions | Docs, snippet [WS1-12, 13] |
| Clarify-first vertical flows | ChatGPT shopping research; Microsoft Prompt Coach | [WS1-9, 23] |

### The strongest case that people would NOT use SubText

1. **The feature is free where people already are.** Claude shows tappable clarifying options natively. ChatGPT clarifies in its research and shopping flows. Any assistant will "ask me questions first" if told, a trick mainstream press keeps publishing [WS1-67].
2. **An extra step is friction.** SubText adds a tab, a copy-paste and an account. Users already complain about signups and context switching [WS1-64, 30].
3. **The labs, who have the most data on whether prompt improvement works, are retiring their dedicated tools** (Anthropic Aug 2026; OpenAI Optimizer Nov 2026) [WS1-1, 5]. The plain reading is that better models and agent loops make separate prompt optimisation less valuable.
4. **The gains shrink for strong models.** Even a structured-prompt advocate measured only +0.217 on 5 points for Claude, against +1.006 for a weaker model [WS1-40]. Better models are also tuned to infer intent and to ask *fewer* unnecessary questions [WS1-10].
5. **Elicit-first may be the wrong mental model.** Users often learn what they want by iterating on drafts [WS1-63]. Cheap regeneration makes "draft, react, refine" competitive with "interview, then draft."
6. **The category has a poor track record.** PromptPerfect closed, Humanloop was absorbed, Vellum and FlowGPT pivoted, library traffic is falling, and the direct tools remain tiny [WS1-32, 50, 57, 61, 43, 48].
7. **No defensibility.** The core loop is replicable in a single meta-prompt; OpenAI publishes its own [WS1-6]. A free version exists with no signup [WS1-27].

### The best case that they WOULD (all Hypothesis, needs validation)

- **Cross-vendor users** want one place to express intent once and send it to Claude, ChatGPT, Gemini, Cursor or Lovable, each in its own conventions. No assistant is motivated to optimise for a competitor's model.
- **Systematic, value-gated questioning.** Native questioning is opportunistic and inconsistent; one comparison claims Claude Research "rarely" asks [WS1-73, low reliability]. A product built only for this could ask better questions more reliably. Proven only if blind tests beat native assistants.
- **High-stakes, long-running tasks** such as agent runs, deep research and coding projects, where a bad assumption wastes minutes to hours of compute and attention. There an up-front brief has measurable return, but the agents themselves are moving here too.
- **Teams and organisations** wanting consistent briefs, templates and governance across vendors, outside Microsoft 365.
- **Novices** who do not know what context matters and would not think to tell an assistant to ask them questions. *Counter:* this is exactly the audience assistants are adding native clarification for.

**Verdict:** For a generic consumer prompt improver, the evidence says most people will **not** pay for or adopt a separate tool over asking the assistant directly, and the assistants are closing the remaining gap. A defensible version would need to be **cross-vendor, embedded, value-gated, and prove better outcomes on frontier models**, probably for a specific high-stakes use case. That is a materially different product from the thesis as written.

---

## J. Signals of category health

| Signal | Date | Detail | Evidence |
|---|---|---|---|
| Humanloop acquired by Anthropic; platform shut | Aug 13 / Sept 8, 2025 | Team joined Anthropic; product sunset | **Verified** [WS1-50] |
| Jina AI acquired by Elastic | Oct 2025 | PromptPerfect's parent | **Verified** [WS1-33] |
| Grammarly rebrands to Superhuman; Go assistant | Oct 29, 2025 | Cross-app assistant | `[snippet]` [WS1-60] |
| Langfuse acquired by ClickHouse | Jan 16, 2026 | Stays MIT OSS | `[snippet]` [WS1-51] |
| Helicone acquired by Mintlify | Mar 3, 2026 | Reportedly maintenance mode | Secondary [WS1-52] |
| Promptfoo acquired by OpenAI | Mar 9, 2026 | Stays OSS; OpenAI's Evals migration target | `[snippet]` [WS1-53] |
| Claude adds clickable clarifying options | Mar 16, 2026 | All users | **Verified** [WS1-15] |
| OpenAI deprecates Optimizer/Evals, reusable prompts, Agent Builder | Announced Jun 3, 2026; shutdown Nov 30, 2026 | | **Verified** [WS1-4, 5] |
| PromptPerfect shutdown | Sept 1, 2026 | Data deletion Oct 1, 2026 | **Claimed** (competitor blog) [WS1-32] |
| Anthropic retires legacy Workbench + prompt generate/improve APIs | Announced Jul 17, 2026; effective Aug 17, 2026 | Docs redirect to best practices | **Verified** [WS1-1, 3] |
| Vellum pivots to personal AI assistant | 2026 | Pricing page | **Verified** [WS1-57] |
| FlowGPT pivots to character chat (Kaon) | 2024–2026 | | Secondary [WS1-61] |
| Traffic (Similarweb, Oct 2026) | Oct 2026 | AIPRM 708.9K/3 mo (−6.9% MoM); PromptBase 538.1K (−1.8%); PromptHero −2.4%; PromptLayer 85.9K (−4.6%); Pretty Prompt 44K (+19.3%); ChatPRD 128.8K (+1.5%); FlowGPT 1.8M (+13.3%, character chat) | Modelled estimates [WS1-43–49] |

**Reading:** money and attention are consolidating into model vendors and data platforms. Consumer prompt libraries and optimizers are shrinking or pivoting, with small indie tools growing from a tiny base. Funding data for the direct indie tools was not found; none discloses funding.

---

## Verified vs. claimed vs. hypothesis (key claims)

| Claim | Status |
|---|---|
| Anthropic retired its Workbench and prompt generate/improve APIs on Aug 17, 2026 | Verified [WS1-1] |
| OpenAI's dataset-backed Prompt Optimizer shuts Nov 30, 2026 | Verified [WS1-4, 5] |
| Claude offers clickable clarifying options to all users | Verified [WS1-15] |
| Bolt Enhance prompt asks guided questions | Verified [WS1-16] |
| ChatGPT Deep Research asks clarifying questions | Official source, snippet only [WS1-8] |
| PromptPerfect shut down Sept 1, 2026 | Claimed by competitors; no official notice found [WS1-32] |
| Six or more standalone tools ask questions before generating | Claimed (vendor pages) [WS1-27–38] |
| Labs see diminishing value in standalone prompt improvement | Hypothesis |
| Value-gated, cross-vendor, outcome-proven questioning is the only open whitespace | Hypothesis |

---

## Unresolved questions

1. Does the Anthropic Console still have a prompt-improver UI after the Workbench became Playground? This needs a logged-in check.
2. What exactly do ChatGPT Deep Research and default GPT-5.x chat do on vague prompts today, and how often do they ask questions? (Help centre blocked.)
3. How do Reddit communities (r/PromptEngineering, r/ChatGPT, r/ClaudeAI) view prompt-improver tools now? Not reachable in this run.
4. What are the real usage and retention numbers for Pretty Prompt, Prompt Builder, Prompt Cowboy (claims 1M users) and get-prompt.ai?
5. Was PromptPerfect's shutdown officially announced, and why? Its stated reason (Elastic wanted embeddings, not the consumer tool) comes from a competitor.
6. Does Manus, ChatGPT agent or Perplexity clarify before executing? Not verified.
7. Not individually researched: Agenta, Arize Phoenix, W&B Weave, Jasper, Copy.ai, Notion AI, workflow builders (Zapier, n8n, Make, Dify, Flowise, Relevance AI). Believed low relevance.
8. Is Lateni's flow adaptive questioning or form-filling? Its UI did not render, so this needs a hands-on session.

## Validation experiments

1. **Native-baseline bake-off (decisive).** Take 30 vague requests across the thesis examples. Compare (a) sending each directly to Claude, ChatGPT and Gemini (current models, default settings), (b) the same plus "ask me questions first", (c) get-prompt.ai and Pretty Prompt, (d) a SubText prototype. Have blind human raters judge the final outputs, not the prompts. If (d) does not clearly beat (b), stop or pivot.
2. **Question-budget test.** Run the prototype with 0, 1, 3 and 5 questions. Measure output quality, time to result, and drop-off. This establishes whether value-gating changes outcomes.
3. **Willingness-to-pay smoke test.** Landing page plus pricing ($0 / $8 / $20) aimed at cross-vendor power users and one vertical (e.g. agent specs for non-engineers). Compare conversion with benchmarks for $8–20 prompt tools.
4. **Embedded vs. standalone.** Compare activation and 4-week retention between a browser/MCP embed and a standalone web app.
5. **Competitor teardown sessions.** Hands-on use (with user consent and free tiers) of get-prompt.ai, Pretty Prompt Optimizer, Prompt Builder, Feedough, Bolt Enhance and Lovable Plan, recording question count, adaptivity and output quality on the same 10 tasks.
6. **Reddit/G2 sentiment pass** from an environment where those sites are reachable, coding complaints into themes (WS3 can reuse).
