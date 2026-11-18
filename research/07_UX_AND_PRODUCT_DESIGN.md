# 07 — UX and Product Design (WS4)

**Workstream:** WS4, Product Design and Conversational UX (design side)
**Date:** 2026-11-13
**Scope:** experience design, information architecture, flows, interaction specs, wireframe descriptions, and surface trade-offs for SubText, a tool that asks clarifying questions before writing a prompt. Competitor business facts belong to WS1, question-selection logic to WS5, architecture to WS6, and the business case for each surface to WS7.

**Evidence labels used throughout:**
- **Verified:** I read the primary source or inspected the product page or docs myself.
- **Claimed:** vendor marketing or self-report.
- **Hypothesis:** my own design inference, to be tested.
- **[snippet only]:** I saw only a search-result summary, not the page.

---

## 0. Summary of key findings

1. **The core interaction is already shipping inside the host products. That is the biggest risk to SubText as a standalone UX.** Verified examples:
   - ChatGPT deep research "may ask clarifying questions to confirm your goals" and shows an editable research plan ([OpenAI Help](https://help.openai.com/en/articles/10500283-deep-research), read in browser).
   - Claude's `AskUserQuestion` renders 1–4 multiple-choice questions with 2–4 options each, plus free text ([Claude Agent SDK docs](https://code.claude.com/docs/en/agent-sdk/user-input)).
   - Cursor's plan mode asks clarifying questions in an interactive UI ([Cursor docs](https://cursor.com/docs/agent/plan-mode)).
   - Bolt's "Enhance prompt" opens a dialog of guided questions and then produces an editable recommended prompt ([Bolt support](https://support.bolt.new/building/chat-tools)). That is close to the SubText thesis.

   For SubText, the UX has to be clearly better than these built-in versions, not just present. The levers are question quality, a visible and editable model of intent, reuse, and model-specific output.
2. **Clarifying questions help only when they are good.** Zou et al. (ACM TOIS 2023) report that high-quality clarifying questions raise performance and satisfaction, while low- and mid-quality ones are harmful. Users may do better with no questions at all ([TU Delft record](https://research.tudelft.nl/en/publications/users-meet-clarifying-questions-toward-a-better-understanding-of-) [snippet only]). The UX therefore has to make asking feel cheap and skipping feel free, and the engine (WS5) has to ask less than it could.
3. **Structured widgets beat numbered text questions, but the evidence is expert opinion, not experiments.** NN/g (Moran, March 2026) recommends buttons and checkboxes with an open-text escape, one question at a time rather than a numbered list, and a cap on the number of questions. The article reports no controlled test ([NN/g](https://www.nngroup.com/articles/genui-buttons-and-checkboxes/), Verified).
4. **The "one question at a time" (Typeform) advantage is weakly evidenced.** Typeform's 47% vs 21.5% completion figure is vendor data [snippet only]. Survey-methodology research finds paging vs scrolling barely changes breakoff (a 14-study meta-analysis found no effect). On mobile, scrolling grids were faster and rated higher ([HSE summary of Mavletova & Couper](https://publications.hse.ru/en/view/100571784) [snippet only]). **Design implication:** show a short round of 1–3 questions on one surface. Do not force one-per-screen pagination.
5. **Make the intent model visible and editable. This is the strongest differentiation available.** HAX guidelines G9 ("Support efficient correction") and G11 ("Make clear why the system did what it did") ([Microsoft Research](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/), Verified), Apple HIG's "Keep people in control" ([Apple HIG Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai), Verified, updated 2026-06-08), and Shape of AI's "Prompt enhancer: preserve intent, highlight added content" ([shapeof.ai](https://www.shapeof.ai/patterns/prompt-enhancer), Verified) all point to the same move. Show a live **Brief** of goal, audience, constraints, and assumptions as editable chips, and generate the prompt from it.
6. **A fast path is mandatory.** NN/g says wizards are wrong for tasks users repeat often and for experts ([NN/g Wizards](https://www.nngroup.com/articles/wizards/), Verified). Linear's principle "Simple first, then powerful" ([Linear Method](https://linear.app/method/introduction), Verified) says the same. A "Just write it" path that skips every question and still shows the assumptions it made should be one keystroke away.
7. **Latency is a UX budget, not only an engineering metric.** Nielsen's limits are 0.1 s, 1 s, and 10 s ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/), Verified). Apple HIG (June 2026) asks for specific status text such as "Summarizing key themes…" instead of "Processing…" (Verified). The first question must start appearing within about 1 s. The popular "400 ms Doherty threshold" figure is not clearly in the 1982 IBM paper [snippet only], so treat it as a heuristic.
8. **"Open in ChatGPT/Claude" deep links are fragile.**
   - Anthropic documents `claude://claude.ai/new?q=` for the desktop app. It prefills only and does not send, and truncates at about 14,000 characters ([Claude Help](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link), Verified, dated 2026-06-30).
   - The web form `claude.ai/new?q=` is widely reported but I did not verify it.
   - ChatGPT's `?q=` is undocumented. It was the subject of a 2025 prompt-injection advisory that led OpenAI to add auto-submit protections ([Tenable TRA-2025-22](https://www.tenable.com/security/research/tra-2025-22), Verified).

   **Copy to clipboard must be the primary action. Deep links are a secondary convenience with a fallback.**

**Bottom line for design (Hypothesis):** a minimal web app built around three objects: the **Request** you type, a **Brief** that SubText builds and you can correct, and the **Prompt** generated from the Brief. Questions come in short rounds as cards, every round can be skipped, and assumptions are always visible as chips. The UX alone will not beat native features. It helps only if the questions are noticeably smarter and the Brief and saved context save real time on repeat use. The validation experiments in section 13 should run before significant build investment.

---

## 1. Evidence base

### 1.1 General product-design principles

| Principle | Evidence | Label | Implication for SubText |
|---|---|---|---|
| Response-time limits are 0.1 s (instant), 1 s (flow kept), 10 s (attention kept). Beyond 10 s, show percent-done or absolute progress and offer a way to interrupt. | [NN/g, Nielsen](https://www.nngroup.com/articles/response-times-3-important-limits/) | Verified | Typing and chip toggles must react in under 100 ms. First question visible in about 1 s. Prompt generation streams, and any wait over about 10 s needs real progress and a Stop control. |
| Progress indicators: looped for 2–10 s, percent-done for 10 s and up. A stalling bar frustrates users. With an animated indicator, people waited about 3× longer. | [NN/g, Sherwin 2014](https://www.nngroup.com/articles/progress-indicators/) | Verified | No percent bar for questioning, because its length is unknown and a bar would be fake precision. Show absolute progress instead: which parts of the brief are covered. |
| Doherty threshold: feedback under about 400 ms keeps users engaged. | [Laws of UX](https://lawsofux.com/doherty-threshold/) | Claimed / heuristic. The 400 ms figure's origin in the 1982 IBM paper is disputed [snippet only] | Use it as a target for acknowledgement (echo, skeleton), not as a scientific constant. |
| 100 ms rule and keyboard-first design. Every action has a shortcut, and shortcut hints sit in the UI. | [Superhuman blog, 2022](https://blog.superhuman.com/superhuman-is-built-for-speed/) | Claimed (vendor) | Full keyboard operation of question cards (number keys, Enter, Esc), and a ⌘K palette. |
| Progressive disclosure: put frequent items on the first screen, limit to 2 levels, label the path to secondary options clearly. | [NN/g, Nielsen 2006](https://www.nngroup.com/articles/progressive-disclosure/) | Verified | The first screen is one input. Advanced controls (target model, format, saved context) sit one level down. |
| Staged disclosure (wizards) fails when steps depend on each other or users need to go back and forth. | Same source | Verified | Questions are not a rigid wizard. Users can revisit any answer from the Brief at any time. |
| Wizards suit novices and infrequent tasks, not frequent tasks or experts. Remember previous selections as defaults. | [NN/g Wizards, Budiu 2017](https://www.nngroup.com/articles/wizards/) | Verified | Fast path for repeat users. Saved context pre-answers questions (this also covers WCAG 3.3.7 Redundant Entry). |
| Linear Method: "Simple first, then powerful", "Purpose-built" over endless flexibility, "Say no to busy work", "Decide and move on". | [Linear Method intro](https://linear.app/method/introduction) | Verified | Opinionated defaults. Do not expose prompt-engineering knobs by default. The system should decide and state its assumption rather than ask. |
| Quality as differentiation, and designing for someone in particular. | [Linear, "Why is quality so rare"](https://linear.app/now/why-is-quality-so-rare) | [snippet only] | Pick a primary persona with WS3. Do not design for everyone. |

### 1.2 AI-specific UX guidance

| Source | Guidance relevant here | Label |
|---|---|---|
| **Microsoft HAX, 18 guidelines** (Amershi et al., CHI 2019) | G1 Make clear what the system can do. G2 Make clear how well. G3 Time services based on context. G7 Efficient invocation. G8 Efficient dismissal. G9 Efficient correction. **G10 Scope services when in doubt ("engage in disambiguation")**. G11 Make clear why. G12 Remember recent interactions. G13 Learn from user behavior. G15 Granular feedback. G16 Convey consequences of user actions. G17 Global controls. | Verified ([MSR blog](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)) |
| **Google PAIR Guidebook** | Mental Models: "onboard in stages", explain what it can and cannot do, avoid human-like over-expectation. Feedback + Control: "Balance control & automation". People want control when they enjoy the task, feel responsible, the stakes are high, or **preferences are hard to communicate**. Errors: "Provide paths forward from failure". | Verified ([Mental Models](https://pair.withgoogle.com/chapter/mental-models/), [Feedback + Control](https://pair.withgoogle.com/chapter/feedback-controls/), [Errors](https://pair.withgoogle.com/chapter/errors-failing/)) |
| **Apple HIG: Generative AI** (new June 2025, updated June 8, 2026) | Keep people in control: dismiss, revert, retry. Set clear expectations and offer curated suggestions for open-ended inputs. "Seek clarity before making assumptions" that may stereotype. Put Edit, Undo, Retry, Adjust controls near output and **acknowledge when corrections take effect**. Give specific, reassuring status text during generation. Offer alternate versions. Feedback is always voluntary. | Verified ([HIG JSON](https://developer.apple.com/design/human-interface-guidelines/generative-ai)) |
| **Apple HIG: Machine learning** | Request explicit feedback only when necessary and keep it voluntary. Describe options by their consequence ("Suggest less pop music"), not with vague terms like "dislike". Act immediately on feedback and persist it. | Verified ([HIG](https://developer.apple.com/design/human-interface-guidelines/machine-learning)) |
| **NN/g: Prompt controls** (Liu, Aug 2024) | Controls aid discoverability, education, constraints, and follow-ups. Half of diary-study conversations had a follow-up and 77% had more than one exchange. Use standard icons with labels, name features clearly ("Think Carefully" confused users), group controls by function, and follow platform conventions. | Verified ([NN/g](https://www.nngroup.com/articles/prompt-controls-genai/)) |
| **NN/g: Accordion editing and apple-picking** (Gibbons, Mugunthan, Nielsen, Sept 2023; n=8) | Users repeatedly shrink and expand outputs and re-quote earlier responses, which costs a lot of effort. Recommends compartmentalized editing, direct editing, and point-to-select. | Verified ([NN/g](https://www.nngroup.com/articles/accordion-editing-apple-picking/)) |
| **NN/g: Buttons and checkboxes in GenUI** (Moran, Mar 2026) | Use checkboxes and buttons to gather context, always with an open-text option. Present questions one at a time instead of a numbered list (as Perplexity does). Constrain generated UI, citing Claude's 4-question cap. Opinion-based, no controlled data. | Verified ([NN/g](https://www.nngroup.com/articles/genui-buttons-and-checkboxes/)) |
| **NN/g: Prompt suggestions** (Moran & Neusesser, Apr 2025) | Follow-up suggestions tied to context are currently the most useful kind. Suggestions are ignored when misplaced or irrelevant. | Verified ([NN/g](https://www.nngroup.com/articles/prompt-suggestions/)) |
| **Shape of AI** (Emily Campbell) | Categories: Wayfinders, Prompt actions, Tuners, Governors, Trust builders, Identifiers. **Follow-up**: anchor in context, keep it short, separate visually from output. **Prompt enhancer**: make changes explicit and reviewable, preserve intent, highlight added content, keep the raw prompt accessible, single default action plus "Advanced". **Action plan**: advisory vs contractual, editable, collapsible once trusted. | Verified ([home](https://www.shapeof.ai/), [follow-up](https://www.shapeof.ai/patterns/follow-up), [prompt enhancer](https://www.shapeof.ai/patterns/prompt-enhancer), [action plan](https://www.shapeof.ai/patterns/action-plan)) |
| **Smashing: Design Patterns for AI Interfaces** (Friedman, Jul 2025) | Typing prompts is slow (30–60 s) and people struggle to state intent. Use prompt builders, presets, and familiar controls. Chat becomes a supporting layer, with task-oriented UIs taking the lead. Minimize interaction cost. | Verified ([Smashing](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)) |

### 1.3 How existing products handle clarification (UX patterns only)

| Product | Pattern observed | What I verified vs read about |
|---|---|---|
| **ChatGPT deep research** | Describe outcome → *may* ask clarifying questions → proposed research plan you can review and modify → progress you can follow and interrupt → report with TOC, sources, and activity history. | **Verified** in the current Help Center article, read in browser on 2026-11-13. The UI presentation of the questions (plain text vs widgets) is not described there. A Reddit-shared system prompt suggests it skips questions when the request is already detailed [unverified, user-shared]. |
| **Claude AskUserQuestion** (Claude Code / Agent SDK) | 1–4 questions per call, each with a `header` (≤12 chars), 2–4 options with `label` and `description`, `multiSelect`, an "Other" free-text option, optional option previews (markdown/HTML), and an optional general free-form reply instead of answering. | **Verified** in the [SDK docs](https://code.claude.com/docs/en/agent-sdk/user-input). NN/g describes the rendered card ("question 2 of 4", "Something else" option, Skip button) ([NN/g](https://www.nngroup.com/articles/genui-buttons-and-checkboxes/), Verified secondary). |
| **Claude Research** | Toggle in the + menu, then multi-step searching. The help article does not mention a clarifying step. | Verified absence in the [help article](https://support.claude.com/en/articles/11088861-using-research-on-claude). Behaviour in the product not inspected. |
| **Gemini Deep Research** | Prompt → research plan → **Edit plan** → **Start research** → about 5–10 min → notification → Open. This is a "contractual plan" pattern. | **Verified** ([Gemini Help](https://support.google.com/gemini/answer/15719111); [Google blog](https://blog.google/products/gemini/google-gemini-deep-research/)). |
| **Cursor plan mode** | Shift+Tab into Plan → agent asks clarifying questions → researches → editable markdown plan → "Build". Plans can be saved to the workspace. The 2.1 changelog added "an interactive UI to easily answer questions". | Docs **Verified** ([plan mode](https://cursor.com/docs/agent/plan-mode)). Changelog wording [snippet only] ([2.1](https://cursor.com/changelog/2-1)). |
| **Perplexity Pro Search / Copilot** | Historically asked clarifying questions before searching. Now known mostly for follow-up suggestions after answers. NN/g criticises five follow-ups given as plain numbered text. | Clarifying behaviour [snippet only] (Perplexity help: "asks clarifying questions as needed"). The NN/g critique is Verified. Not inspected in product. |
| **Bolt "Enhance prompt"** | + menu → "Help us enhance your prompt" dialog with guided questions → recommended prompt you can edit before sending. | **Verified** ([Bolt support](https://support.bolt.new/building/chat-tools)). The closest shipped analogue to SubText. |
| **v0** | May offer to enhance a simple prompt with more details. | [snippet only] |
| **Ideogram Magic Prompt** | On/off toggle, default on. Rewrites the prompt. Turn it off to keep exact words. APIs offer Auto/On/Off, and rewriting can break reproducibility unless the final prompt is reused. | [snippet only]. The docs page returned 404 when I opened it in the browser on 2026-11-13. |
| **Anthropic Console prompt improver** | Takes an existing prompt and rewrites it in steps: example identification, draft, chain-of-thought section, XML-standardised examples. | Launch blog and docs [snippet only]. The docs URL now redirects to the prompting best-practices page. |
| **OpenAI Playground Prompts + Optimize** | Versioned, reusable prompts with variables and rollback. "Optimize" fixes contradictions, unclear instructions, and missing output formats. | [snippet only]. The Help Center returned 403. |
| **Typeform** | One question per screen, keyboard-driven. | Vendor claims only. The help page was bot-blocked. |

**Synthesis (Hypothesis):** the field has converged on three moves:
1. Ask a small, capped number of structured questions with an escape hatch.
2. Show a plan or rewritten artefact that the user can edit before committing.
3. Let users skip.

None of the products I examined keeps a persistent, editable intent model ("brief") separate from the prompt that is reused across sessions. That is the open space for SubText. No competitor I looked at shows assumptions as first-class editable objects, but this needs WS1 confirmation.

### 1.4 Forms, conversational surveys, and answer types

- **One-at-a-time vs single page.** Couper & Mavletova's meta-analysis of 14 studies found no effect of scrolling on breakoff. Peytchev et al. (2006) found the same response rate (43.6% vs 43.4%) but more skipped items when scrolling (2.3% vs 1%). On mobile, scrolling was faster, with fewer technical problems and higher ratings ([HSE](https://publications.hse.ru/en/view/100571784) [snippet only]). Google's Sedley & Callegaro (2012) tested three pagination levels on a 15-question survey. The abstract page gives only the hypothesis ([Google Research](https://research.google/pubs/effects-of-pagination-on-short-online-surveys/), Verified that results are not on the page).
- **Typeform's completion advantage** (47.3% vs a 21.5% "industry average") is vendor platform data, not a controlled comparison [snippet only]. Treat it as **Claimed**.
- **Conversational vs form surveys.** Xiao et al. (ACM TOCHI 2020) found a chatbot elicited more engaged, higher-quality open-ended answers than Qualtrics, across about 5,200 responses ([arXiv 1905.10700](https://arxiv.org/abs/1905.10700v2) [snippet only]). A KU Leuven longitudinal study found the web survey often gave better data quality ([KU Leuven](https://lirias.kuleuven.be/retrieve/697279) [snippet only]). The evidence is mixed.
- **Clarifying questions in search.** 66–84% of users found a question-based system helpful ([Zou et al. 2020](https://export.arxiv.org/abs/2008.00279?context=cs) [snippet only]). Low-quality questions *suppress* engagement, and follow-up high-quality questions can recover it ([UvA, IP&M 2023](https://www.dare.uva.nl/id/2cbf36e0-24e3-4be3-bc5c-01e332c33c9c) [snippet only]).

**Design implications (Hypothesis, grounded in the above):**
- Use **chips for the likely answers plus free text** on every question. Chips cut typing, which Smashing puts at 30–60 s per prompt. Free text avoids forcing a wrong option (NN/g, Claude's "Other").
- Every question includes a **"You decide"** chip that delegates to the system's stated default. This follows Linear's "Decide and move on" and the PAIR guidance that people give up control readily when a task is outside their expertise.
- Every question includes **"Not sure"**. This differs from "You decide": it tells the engine the user lacks the information, so the system should write the prompt to hedge or to ask the downstream LLM to cover options (WS5/WS2).
- Show a **round of 1–3 questions** together, keyboard-navigable. This avoids both a wall of fields and one-per-screen tedium. The survey evidence does not justify forced pagination.

### 1.5 Prompt display, editing, and export

- Prompt enhancers should **show the rewrite, highlight additions, preserve the user's nouns and constraints, and keep the raw prompt accessible** ([Shape of AI](https://www.shapeof.ai/patterns/prompt-enhancer), Verified).
- **Compartmentalised and direct editing beat re-prompting** ([NN/g accordion editing](https://www.nngroup.com/articles/accordion-editing-apple-picking/), Verified). The prompt should have sections the user can edit, regenerate, or remove individually.
- **Versioning and rollback** are standard in developer prompt tools such as OpenAI Prompts [snippet only]. For a consumer tool, a lightweight version history with diffs is enough.
- **Deep links:**
  - Claude desktop `claude://claude.ai/new?q=` is **documented**: it prefills only, never sends, and truncates at about 14k characters ([Claude Help](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link), Verified).
  - Web `https://claude.ai/new?q=` is reported by third parties [unverified].
  - ChatGPT `chatgpt.com/?q=` is undocumented. One OpenAI community thread says it is not a supported integration mechanism [snippet only]. Tenable showed in 2025 that it auto-submitted, and OpenAI added "auto-submit protections based on the sec-fetch-site header" ([Tenable](https://www.tenable.com/security/research/tra-2025-22), Verified). Current behaviour from a third-party site is therefore likely prefill-without-submit at best, and could change without notice.
  - Prompts in URLs also leak into browser history and referrer logs, which is a privacy issue for WS8.

---

## 2. Answers to the ten design questions

### Q1. What should the first screen look like?
One centred input with a short invitation and nothing else competing for attention.
- **Placeholder:** "What do you want an AI to help you with?"
- **Below the input:** three or four rotating **example requests** written in plain language, such as "Write a cold email to a potential investor" or "Plan a 4-week study schedule for ML". HIG says to offer "curated suggestions" for open-ended inputs, and NN/g found new users have a hard time knowing what a GenAI tool can do.
- **One quiet line** setting the mental model (HAX G1/G2, PAIR "onboard in stages"): *"I'll ask a few quick questions, then write a prompt you can paste into ChatGPT, Claude, or Gemini."*
- **Target-model selector:** a small, secondary selector that defaults to "Any model".
- **Recent briefs:** a recents list below the fold for returning users.
- **No onboarding carousel and no sign-up wall before first value.**

Evidence: NN/g progressive disclosure, HIG Inputs, NN/g prompt controls.

### Q2. How should a user begin?
The user types or pastes a request of any length and presses Enter. Two further entry points:
- **Paste a draft prompt** ("Improve this prompt"). This is detected automatically when the input is long or structured.
- **Pick a template** for a saved recurring task.

**Shift+Enter means "Just write it"**, the skip-everything fast path. Voice dictation is optional on mobile.

The system must acknowledge within about 100 ms (echo the request into a header) and show its first output within about 1 s (Nielsen limits).

### Q3. How should the product introduce its questioning behaviour?
The product introduces it by doing it, with a one-line rationale. It does not explain it in a tutorial.
- **First run:** the first round of questions appears under a header such as *"A few details will make this much better. Skip any of them."* A small, dismissible "Why these questions?" link explains that answers change the prompt and that skipping is fine (HAX G11).
- **Brief panel:** shows its first inferred fields straight away, such as "Goal: cold email to investor" and "Tone: professional (assumed)". The user sees that SubText has already understood something before it asks. That earns the right to ask.
- **Honest scope (HAX G2):** in settings, and on first completion, say that SubText improves the instructions, not the model's knowledge, and that results still need review.

### Q4. How should questions appear?
Questions appear as **inline cards in rounds of 1–3**, never as a numbered text list (NN/g 2026). Claude's cap of 4 per call is a sensible ceiling, and 3 is better for consumers (Hypothesis).

Each card has:
- **A short header tag** (≤12 characters, borrowing AskUserQuestion's convention), for example "Audience".
- **The question in plain language,** with no prompt-engineering terms.
- **A one-line "why this matters"**, shown on hover or focus, or under the question for first-time users.
- **2–4 answer chips** with optional one-line descriptions, plus "You decide", "Not sure", and a free-text field ("Something else…").
- **A pre-selected recommended default when the engine has one.** It is visually marked "suggested" and confirmed with Enter. This follows HIG's "Seek clarity before making assumptions" for sensitive attributes. For non-sensitive attributes, a default is quicker than a blank.

Order questions by expected impact, which WS5 decides. Later rounds appear only if they are worth it. The user never sees an empty queue or a count that grows.

### Q5. How should users skip questions?
Skipping is available at three levels, and none of them carries a penalty:
1. **Per question:** "You decide" chip, or press `S`/`Tab` past the question. The question is then filled with the system's default and becomes an **assumption chip** in the Brief.
2. **Per round:** a "Skip these" button, or Esc. All answers in the round become assumptions.
3. **Everything:** a persistent **"Write prompt now"** button (⌘Enter), visible from the moment questions appear. Shift+Enter on the first screen skips questioning altogether.

After a skip, never ask the same question again in that session. HAX G8 calls for efficient dismissal, and Zou et al. show that bad questions harm the experience.

### Q6. How should the system handle uncertain answers?
- **"Not sure"** is a first-class answer. The system then does one of three things:
  - picks a robust default and marks it as an assumption;
  - writes the prompt so the downstream LLM offers options or asks the user (for example, "Propose 3 tone options before drafting"); or
  - asks a simpler, more concrete follow-up, but only if the expected value is high (WS5).
- **Vague free text** such as "something modern I guess" is parsed into a *tentative* chip shown with a dotted outline and the label "interpreted as: Modern, minimal". One click corrects it.
- **Contradictions** with earlier answers (for example "formal" and then "fun and casual") show inline: *"Earlier you chose Formal. Use Fun & casual instead?"* with [Keep formal] [Switch] [Mix].
- Never show numeric confidence such as "72%". Use plain-language markers: "assumed", "interpreted", "you said". (Hypothesis: numeric confidence implies precision the system does not have.)

### Q7. How should users correct assumptions?
In the **Brief**. Every inferred or defaulted field is an **assumption chip**: "Tone: Professional · assumed".
- Clicking a chip opens an inline popover with the alternatives, free text, and "Remove".
- After a correction, the affected prompt sections re-generate. The changed text is highlighted briefly and a small "Updated" acknowledgement appears (HIG: acknowledge when corrections take effect, HAX G16).
- The user can also correct by typing into a **refine bar** ("make it shorter, and it's for my manager, not investors"). The system maps this onto Brief fields and shows the mapping.
- Corrections that look durable, such as "I'm a nurse" or "always British English", offer a **"Remember this"** toggle that saves to About me. It is off by default and never silent (HAX G13/G17, HIG explicit-consent guidance).

### Q8. How should the final prompt be displayed?
A **document view with labelled sections**, not a raw blob. Example sections: Role · Goal · Context · Constraints · Output format · Examples. The prompt is styled lightly for scanning and copies as plain text or markdown.
- **Additions are highlighted** relative to the user's own words, as Shape of AI's "preserve intent" recommends. A toggle "Show what I added" switches the highlight on or off.
- **Each section can be edited directly** and has a hover menu: Regenerate · Shorter · Remove. This avoids accordion editing of the whole prompt (NN/g).
- **A "Raw" toggle** shows the exact text, with a token or character count and a warning when it exceeds the deep-link limit (about 14k characters for Claude).
- **Version history** with a simple diff between versions.
- **Primary action: Copy** (⌘C when the prompt is focused, plus a large button). It shows a clear "Copied" confirmation.
- **Secondary actions:** "Open in Claude", "Open in ChatGPT", Download .md, Save as template.

### Q9. How much control should users have?
Control should be layered (PAIR "Balance control & automation"; Linear "Simple first, then powerful"):
- **Default (everyone):** answer, skip, correct chips, edit the prompt text, copy.
- **One level down ("Options"):** target model, output length, prompt style (structured vs conversational), language, whether to include examples or reasoning instructions. These are named in plain terms, so "Ask the AI to think step by step" rather than "CoT" (NN/g: name features clearly).
- **Global (settings):** question depth, an always-on fast path, About me and project context, data retention.

Do not expose temperature or model parameters. SubText produces prompts and does not run them.

### Q10. How should the product feel intelligent without overwhelming?
It should be brief and specific, and visibly listen. Concretely:
1. **Reflect understanding before asking.** The Brief fills from the request alone, before any question.
2. **Ask fewer, sharper questions** with good defaults. A question whose answer would not change the prompt should never be shown (WS5).
3. **Give specific status text** ("Working out who this email is for…") instead of a spinner (HIG 2026).
4. **Show the consequence of answers.** Selecting a chip updates a Brief line instantly. The link between answer and effect is the "intelligence" the user perceives.
5. **No anthropomorphic chatter**: no "Great question!" and no personality filler. PAIR warns that human-like framing raises expectations.
6. **Quiet visual language:** one accent colour, generous whitespace, motion only to show causality (chip → Brief → prompt).

---

## 3. UX principles for SubText (10)

Each principle is a design rule backed by evidence. Its use for this product is labelled Hypothesis.

| # | Principle | What it means in practice | Evidence |
|---|---|---|---|
| P1 | **Understand before asking** | Show the inferred Brief from the request alone, then ask only about the gaps. | HAX G10 (disambiguate *when in doubt*, not always). Zou et al.: low-quality questions harm. |
| P2 | **Every question must earn its place** | Cap a round at 3 questions. No question whose answer wouldn't change the prompt. Stop early. | NN/g 2026 (cap questions). Claude caps at 4 per call. Zou et al. 2023. |
| P3 | **Skipping is free and visible** | "You decide" on every card, "Skip these" per round, "Write prompt now" always visible. Never penalise skipping. | HAX G8. PAIR (people cede control on unfamiliar tasks). NN/g Wizards (repeat users). |
| P4 | **Assumptions are objects, not hidden guesses** | Every default or inference becomes an editable chip labelled "assumed". | HAX G9/G11. HIG "Seek clarity before making assumptions". Shape of AI "highlight added content". |
| P5 | **Select, don't type** | Chips and keyboard shortcuts first, free text always available. | Smashing 2025 (typing 30–60 s). NN/g 2026. Claude's "Other" option. |
| P6 | **Show cause and effect** | Each answer visibly changes the Brief, and each Brief change visibly changes the prompt. Acknowledge corrections. | HIG Outputs (acknowledge corrections). HAX G16. |
| P7 | **Edit parts, not wholes** | Section-level edit, regenerate, and remove on the prompt. Inline chip edits on the Brief. | NN/g accordion editing and apple-picking. |
| P8 | **Fast by default, honest when slow** | <100 ms local feedback. First question in about 1 s. Stream output. Specific status text. Stop control. No fake percentages. | Nielsen limits. NN/g progress indicators. HIG specific status. Superhuman 100 ms. |
| P9 | **Remember with consent** | Reuse About me, project context, and past answers as defaults, so users never re-enter information. Saving is explicit and reversible. | HAX G12/G13/G17. WCAG 3.3.7 Redundant Entry. HIG privacy. |
| P10 | **Plain words, no jargon, no persona** | No "CoT", "few-shot", or "system prompt" in the default UI. Neutral, concise tone. | NN/g prompt controls (clear names). PAIR (avoid human-like over-expectation). Linear "Aim for clarity". |

---

## 4. Information architecture

```
SubText
├── New (home)                  ← one input, examples, recents
│   └── Session  (one request → brief → prompt)
│       ├── Request            (user's original words, editable)
│       ├── Questions          (rounds of cards; transient)
│       ├── Brief              (persistent intent model: fields + assumption chips)
│       └── Prompt             (sections, versions, target model, export)
├── Library
│   ├── History                (all sessions; search; filters by task type/target model)
│   └── Templates              (saved briefs with variable slots)
├── Context
│   ├── About me               (role, expertise, writing preferences, language)
│   └── Projects               (named context packs: product, audience, style guide)
└── Settings
    ├── Questioning            (Ask more / Balanced / Ask less / Never ask)
    ├── Defaults               (target model, prompt style, language)
    ├── Data & privacy         (retention, delete, export)  ← WS8
    └── Shortcuts
```

**Core objects and relationships (Hypothesis):**
- A **Session** has one Request, one Brief, and N Prompt versions.
- A **Brief** is the source of truth. Prompts are *renderings* of a Brief for a target model, so switching target model re-renders without asking questions again.
- A **Template** is a Brief with some fields turned into variables.
- **Context** (About me and Projects) pre-fills Brief fields and appears in the Brief as "from About me" chips, so its provenance is visible.

Navigation is two levels at most (NN/g progressive disclosure). On desktop it is a collapsible left rail with New, Library, Context, and Settings. On mobile it is a bottom sheet or menu.

---

## 5. User flows

### 5.1 First-run (new user, no account)
1. The user lands on New and sees the input, 3–4 examples, and the one-line promise.
2. They type "Write a professional email" and press Enter.
3. **≤100 ms:** the request echoes into the session header and the Brief panel slides in with skeleton rows.
4. **≤1 s:** the Brief shows "Task: Email · Tone: Professional (you said)". The first question card streams in under the header "A few details will make this much better. Skip any."
5. **Round 1** (≤3 cards): Who is it to? · What outcome do you want? · Anything they must know? Each card offers chips, "You decide", "Not sure", and free text.
6. The user answers 2 and skips 1. The skipped question becomes an assumption chip.
7. **The engine decides** whether a second round is worth it (WS5). If not, it goes straight to generation with status "Writing your prompt… adding the recipient's context".
8. **The prompt streams in** section by section, with additions highlighted.
9. The user presses Copy. A toast confirms "Copied. Paste into ChatGPT, Claude, or Gemini", with secondary "Open in…" links.
10. **Soft account prompt after first value:** "Save this and reuse your answers next time?" Sign-in is optional.

### 5.2 Core loop (returning user)
Request → Brief pre-filled from context → 0–2 short rounds → prompt → copy → (optional) come back with the result and refine.

### 5.3 Refine and iterate
- **From the prompt:**
  - Edit a section directly, or use its hover menu (Regenerate, Shorter, Remove).
  - Type into the refine bar ("more casual; mention the deadline is Friday"). The system maps this onto Brief fields, shows the diff, and the user accepts.
  - Switch target model: the prompt re-renders and the Brief is unchanged.
- **From the Brief:** click any chip and change it. Affected sections regenerate with a highlight.
- **"The output wasn't right"** (Hypothesis, needs validation): the user pastes what the LLM produced and what was wrong. SubText proposes Brief changes, such as "Add: avoid jargon; Length: shorter". This closes the loop without SubText running the model.
- **Version history:** every regeneration creates a version. The user can compare any two and restore one.

### 5.4 Return user with saved context
1. The user selects Project "Acme launch" from a chip in the input row, or SubText suggests it when the request mentions "Acme".
2. The Brief pre-fills audience, product facts, and tone from the project. These chips are labelled "from Acme launch".
3. The questioning engine skips anything already known, so typically 0–1 rounds.
4. When finishing, SubText offers "Save as template?" if this is the third similar request (Hypothesis: a frequency trigger).

### 5.5 Skip-everything fast path
- **Shift+Enter** on New, or **settings → Questioning: Never ask.**
- SubText generates immediately from the request and context, with every inference shown as an assumption chip in the Brief.
- A non-blocking banner reads "I made 4 assumptions. Review", and links to the chips.
- This is the "advisory" mode of Shape of AI's Action plan pattern, versus the default "contractual-lite" mode.

### 5.6 Improve an existing prompt
Paste a long prompt → SubText detects "This looks like a prompt" → Brief extracted from it → questions only about gaps → improved prompt shown **as a diff against the original** (Shape of AI: changes explicit and reviewable).

---

## 6. Screen inventory (MVP)

| # | Screen / state | Purpose | MVP? |
|---|---|---|---|
| S1 | **New (home)** | Input, examples, recents, target-model selector | Yes |
| S2 | **Session: questioning** | Request header, question round, live Brief, "Write prompt now" | Yes |
| S3 | **Session: generating** | Streaming prompt with specific status, Stop | Yes |
| S4 | **Session: prompt ready** | Sectioned prompt, Brief, copy/export, refine bar, versions | Yes |
| S5 | **Assumption popover** | Edit, replace, or remove a Brief field, "Remember this" | Yes |
| S6 | **Version compare** | Side-by-side or inline diff between prompt versions | Yes (simple) |
| S7 | **History** | Search and list past sessions, reopen, duplicate | Yes |
| S8 | **About me** | Personal context fields, free text, toggles | Yes (minimal) |
| S9 | **Projects** | Named context packs | v1.1 |
| S10 | **Templates** | Saved briefs with variables, a run form | v1.1 |
| S11 | **Settings** | Questioning depth, defaults, data and privacy, shortcuts | Yes |
| S12 | **Command palette (⌘K)** | Jump to actions, sessions, templates | Yes (lightweight) |
| S13 | **Error and empty states** | Offline, model failure, rate limit, unsafe request, empty history | Yes |
| S14 | **Sign-in / save prompt** | Optional, after first value | Yes |

---

## 7. Interaction specifications

### 7.1 Question card

**Anatomy:** header tag · question · why (optional) · answer area · footer hints.

**Answer types:**

| Type | When to use | Behaviour |
|---|---|---|
| **Single-select chips** | Mutually exclusive choices (audience, tone) | Click or press a number key to select. Selecting auto-advances focus to the next card after 150 ms, with no auto-submit of the round. |
| **Multi-select chips** | Additive options (sections to include) | Toggle with number keys or Space. Enter confirms. A check icon marks selection, so it is not shown by colour alone. |
| **Free text ("Something else…")** | Always present as the last option | Inline single-line field that expands to multi-line. Enter confirms, Shift+Enter adds a newline. Free text is parsed into a tentative chip ("interpreted as…"). |
| **Short value** | Numbers or lengths (word count, deadline) | Inline field with suggested values as chips ("~150 words", "1 page"). |
| **"You decide"** | Always present | Fills with the system default and marks it "assumed". |
| **"Not sure"** | Always present | Records uncertainty. The engine decides whether to hedge in the prompt or ask a simpler follow-up. |
| **Recommended default** | When the engine is confident | Chip pre-highlighted and labelled "suggested". Enter accepts. Not used for sensitive personal attributes (HIG). |

Option text follows AskUserQuestion's structure: a short **label** plus an optional one-line **description** that states the consequence, such as "Investor: emphasise traction and ask". This applies Apple HIG's "describe options by consequence".

**States:** pending (skeleton) → active (focused) → answered (collapsed to a one-line summary, e.g. "Audience · Investor", click to reopen) → skipped (collapsed to "Audience · You decide → Investor (assumed)").

**Rules:**
- Rounds hold ≤3 cards. Never show a running total that grows. Show "A few more details" only when there is a next round.
- Answered cards collapse, so the round stays compact. All answers remain editable from the Brief.
- Questions never repeat within a session, and skipped topics are not re-asked.
- Card order follows engine priority. The user can answer in any order (NN/g: staged disclosure fails when steps depend on each other).

### 7.2 Keyboard shortcuts (desktop)

| Key | Action |
|---|---|
| Enter | Submit request · confirm current card |
| Shift+Enter (on New) | Just write it: skip questions |
| 1–4 | Select option N on focused card |
| Space | Toggle option (multi-select) |
| O, or typing any letter in the free-text area | Focus "Something else…" |
| D | You decide |
| N | Not sure |
| Tab / Shift+Tab | Next / previous card or control |
| Esc | Skip this round (with undo toast) |
| ⌘Enter | Write prompt now (from anywhere in session) |
| ⌘C (prompt focused) / ⌘⇧C | Copy prompt (global in session) |
| ⌘K | Command palette |
| ⌘Z | Undo last answer, skip, or edit |
| ? | Shortcut sheet |

Single-key shortcuts are active only when focus is on a card, not in a text field. WCAG 2.1.4 Character Key Shortcuts requires that they can be turned off or remapped, so Settings → Shortcuts has a toggle.

### 7.3 Assumption chips (Brief)

- **Visual states:**
  - **you said:** solid
  - **assumed:** outline plus the "assumed" label
  - **interpreted:** dotted outline plus "interpreted as"
  - **from context:** a small source tag, e.g. "About me"
- **Interaction:** click or Enter opens a popover (alternatives · free text · remove · "Remember this"). Changes apply immediately, the affected prompt sections re-render, and an "Updated" pulse runs for 1.5 s. There is no hidden state.
- **Brief header summary:** "6 details · 2 assumed". Clicking it filters to the assumptions.
- **Group order:** Goal · Audience · Content/Context · Constraints · Format · Style.

### 7.4 Progress indication without fake precision

- **No percent bar during questioning.** The number of rounds is adaptive and unknown, and a stalling bar frustrates users (NN/g).
- **Show progress in absolute terms** (Nielsen: "running progress in absolute terms"). The Brief's group headers fill in as they become known, for example Goal ✓ Audience ✓ Constraints ○. That shows coverage, not a percentage.
- **Show the escape route instead of a meter:** "Write prompt now" is always visible.
- **During generation:** stream the sections and show specific status ("Adding constraints from your answers…"). Prompt generation should finish in under 10 s. If it takes longer, show a section checklist (Role ✓ Goal ✓ Format …) plus a Stop control.

### 7.5 Latency handling and streaming

| Moment | Budget (target) | Technique |
|---|---|---|
| Keystroke, chip toggle | <100 ms | Local state, optimistic UI |
| Submit request → visible acknowledgement | <100 ms | Echo request, show skeleton Brief |
| Submit → first Brief field or question | ≤1 s target, ≤2 s max | Stream structured output. Render the first question card as soon as its tokens complete. Consider a small fast model for the first pass (WS6). |
| Answer → next round | ≤1 s | Pre-compute likely next questions while the user answers (Hypothesis, WS6) |
| Generate prompt | First section ≤1.5 s. Total <10 s | Stream by section, with specific status text |
| Chip correction → updated prompt | ≤2 s | Regenerate only affected sections |

If any step exceeds its budget, swap the skeleton for specific status text after 1 s. After 10 s, show a section checklist and Stop. Never block typing or editing while generating.

### 7.6 Error states

Error copy follows PAIR's "Provide paths forward" and HIG's plain-language guidance.

| Situation | Behaviour |
|---|---|
| Model or API failure while questioning | "Couldn't load questions." [Try again] [Write prompt without questions]. The Brief is retained. |
| Failure mid-generation | Keep the partial sections and mark the incomplete one. [Retry section] [Retry all]. |
| Offline | The input still works and the draft is saved locally. "You're offline. We'll continue when you're back." |
| Rate or usage limit | State the limit and when it resets. Offer copy of what exists. |
| Request out of scope or unsafe | Brief, non-judgmental explanation plus suggestions for a better request (HIG: help people improve requests). |
| Request too vague to infer anything ("help") | Ask one broad question with example chips ("Writing · Research · Learning · Coding · Something else"). |
| Deep link too long or blocked | Fall back to "Copied. Paste into Claude" and open a blank chat. |
| Paste contains possible secrets (API keys) | Inline warning before sending (WS8). |

---

## 8. MVP wireframe descriptions

### 8.1 S1, New (desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ≡                                                     ⌘K   ◯ Sign in │
│                                                                      │
│                                                                      │
│              What do you want an AI to help you with?                │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │ Describe it in your own words…                               │   │
│   │                                                              │   │
│   │ [Project ▾]  [For: Any model ▾]          ⇧↵ Just write it  ↵ │   │
│   └──────────────────────────────────────────────────────────────┘   │
│     I'll ask a few quick questions, then write a prompt you can      │
│     paste into ChatGPT, Claude or Gemini.                            │
│                                                                      │
│     Try: · Cold email to an investor  · 4-week ML study plan         │
│          · Market research for my startup  · Improve a prompt I have │
│                                                                      │
│   Recent ─────────────────────────────────────────────────────────   │
│   Investor email · 2d       Landing page copy · 5d      …            │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 S2, Session: questioning (desktop, two-pane)

```
┌───────────────────────────────────────────┬──────────────────────────┐
│ ← New   "Write a professional email"  ✎   │ BRIEF        5 details·2 assumed
│                                           │ Goal ✓                    │
│ A few details will make this much better. │  [Email]  [Request a meeting]│
│ Skip any.                         Why? ⓘ  │ Audience ○                │
│                                           │  …                        │
│ ┌ AUDIENCE ───────────────────────────┐   │ Style ✓                   │
│ │ Who is this email to?               │   │  [Professional · you said]│
│ │ (1) A potential investor            │   │  [Concise ⋯ assumed]      │
│ │ (2) My manager                      │   │ Constraints ○             │
│ │ (3) A client                        │   │                           │
│ │ (4) Someone I haven't met           │   │                           │
│ │ ( ) Something else… _____________   │   │                           │
│ │ [D] You decide   [N] Not sure       │   │                           │
│ └─────────────────────────────────────┘   │                           │
│ ┌ OUTCOME ─ collapsed ─ "Book a 20-min call"┐                         │
│ ┌ MUST-KNOW ──────────────────────────┐   │                           │
│ │ Anything they need to know? (optional) │                            │
│ └─────────────────────────────────────┘   │                           │
│                                           │                           │
│  Esc Skip these          ⌘↵ Write prompt now                          │
└───────────────────────────────────────────┴──────────────────────────┘
```

### 8.3 S4, Prompt ready (desktop)

```
┌───────────────────────────────────────────┬──────────────────────────┐
│ ← New  Investor email   v3 ▾   For: Claude ▾│ BRIEF  (editable chips) │
│ ┌───────────────────────────────────────┐ │ Goal: [Book 20-min call]  │
│ │ ROLE                              ⋯   │ │ Audience: [Seed investor] │
│ │ You are an experienced founder…       │ │ Tone: [Warm-professional] │
│ │ GOAL                              ⋯   │ │ Length: [~150 words ⋯]    │
│ │ Draft a cold email that…▒added▒       │ │ Context: [from About me]  │
│ │ CONTEXT                           ⋯   │ │                           │
│ │ CONSTRAINTS                       ⋯   │ │ ☐ Show what I added       │
│ │ OUTPUT FORMAT                     ⋯   │ │                           │
│ └───────────────────────────────────────┘ │                           │
│ [ Copy prompt ⌘⇧C ]  Open in Claude ↗  ChatGPT ↗  ⋯ (.md, template)   │
│ ┌ Refine: "make it shorter, mention Friday deadline" ──────────── ↵ ┐ │
└───────────────────────────────────────────┴──────────────────────────┘
```
Section menu (⋯): Edit · Regenerate · Shorter · Longer · Remove. Raw toggle in the version menu.

### 8.4 Mobile considerations (375 px)

```
┌─────────────────────────┐   ┌─────────────────────────┐
│ ← Investor email   ⓘ    │   │ ← Investor email  Brief▴│
│ Brief: 5 details·2 assumed  │ ROLE                 ⋯  │
│ ─────────────────────── │   │ You are an experienced… │
│ AUDIENCE                │   │ GOAL                 ⋯  │
│ Who is this email to?   │   │ …                       │
│ ┌─────────────────────┐ │   │                         │
│ │ A potential investor│ │   │                         │
│ └─────────────────────┘ │   │                         │
│ ┌─────────────────────┐ │   │                         │
│ │ My manager          │ │   │                         │
│ └─────────────────────┘ │   │                         │
│  …  Something else…     │   │                         │
│ You decide · Not sure   │   │                         │
│ ─────────────────────── │   │ ┌─────────────────────┐ │
│ [Skip these] [Write now]│   │ │   Copy prompt       │ │
└─────────────────────────┘   └─┴─────────────────────┴─┘
```
- **Layout:** single column. The Brief collapses into a summary bar ("5 details · 2 assumed") that opens a bottom sheet.
- **Answers:** stacked full-width buttons with targets ≥44 pt (Apple HIG), well above WCAG 2.5.8's 24 px minimum.
- **Card flow:** cards stack vertically and scroll. Do not force one card per screen, since the mobile survey evidence favours scrolling.
- **Primary actions:** sticky bottom bar with "Skip these" and "Write now". After generation, Copy sits in a thumb-reach sticky bar.
- **Sharing:** the native share sheet sends the prompt into the ChatGPT, Claude, or Gemini apps. On mobile this is more reliable than URL deep links (Hypothesis, needs testing).
- **Input:** voice dictation for the initial request.

---

## 9. Onboarding, history, preferences, saved context, templates

**Onboarding (PAIR "onboard in stages"):**
- **Stage 0:** no tutorial. Value comes first.
- **Stage 1:** after the first prompt, a single tip: "Tip: next time press ⇧↵ to skip questions".
- **Stage 2:** after 3 sessions, suggest "Tell SubText about you" (About me) with the rationale "so it can skip questions you've already answered".
- **Stage 3:** after repeated similar requests, suggest a template.

Each tip appears once and can be dismissed.

**History:** a chronological list with search (full text across request, brief, and prompt) and filters (task type, target model, project). Each row shows the title (auto-generated and editable), date, and target model. Actions: reopen (full session state), duplicate as new, delete (soft-delete with undo, then permanent delete per the retention settings in WS8).

**Preferences:**
- **Questioning depth:** Ask more / Balanced (default) / Ask less / Never ask.
- **Defaults:** target model, prompt style (structured sections vs conversational paragraph), language and locale spelling.
- **Shortcuts:** on/off.
- **Theme:** follows system.

**Saved context:**
- **About me:** a short form plus free text. Fields: role, expertise level, typical audiences, writing preferences, language. Every field is optional. Each shows where it was used ("used in 12 prompts").
- **Projects:** named packs (product description, audience, voice, links or pasted docs). They are selected per session or suggested automatically when the request matches.
- **Transparency:** context always appears in the Brief as chips with a source tag. It is never applied invisibly (HAX G11/G17). Context can be removed for a single session without deleting it.

**Templates:**
- Created from any Brief ("Save as template"). Fields chosen as variables become slots ({recipient}, {product}).
- Running a template opens a compact form with only the variable slots. Questioning is skipped unless a slot is empty.
- Import and export as JSON (Raycast does the same for AI Commands, [Raycast manual](https://manual.raycast.com/ai/ai-commands) [snippet only]).
- Shared team templates are post-MVP.

---

## 10. Accessibility (WCAG 2.2 AA target)

| Area | Requirement | Applied to SubText |
|---|---|---|
| Keyboard | 2.1.1 Keyboard, 2.1.2 No trap, **2.1.4 Character Key Shortcuts** | Everything operable by keyboard. Single-key shortcuts can be turned off. Popovers trap focus only while open and return focus on close. |
| Focus | 2.4.7 Focus Visible, **2.4.11 Focus Not Obscured (Min, new in 2.2)** | Sticky bottom bars and toasts must not cover the focused card or chip. Add scroll padding. |
| Targets | **2.5.8 Target Size (Min) 24×24 px (new)** | Chips ≥32 px tall on desktop, ≥44 px on mobile. |
| Dragging | **2.5.7 Dragging Movements (new)** | If templates or sections can be reordered by drag, provide move up/down buttons. |
| Redundant entry | **3.3.7 Redundant Entry (new)** | About me and project context pre-fill answers. Never re-ask within a session. |
| Consistent help | **3.2.6 Consistent Help (new)** | The "Why these questions?" and Help entry sits in the same place on every screen. |
| Auth | **3.3.8 Accessible Authentication (new)** | Passkeys, magic links, or OAuth. No cognitive puzzles. |
| Status messages | 4.1.3 Status Messages | Streaming status, "Copied", "Updated", and new question rounds are announced through polite `aria-live` regions. Do not announce every streamed token. Announce section completion. |
| Semantics | 1.3.1, 4.1.2 | Single-select chips are a `radiogroup`. Multi-select chips are a group of `checkbox`es. Cards are `fieldset` with a `legend` (the question). Assumption chips are buttons whose accessible name includes their state ("Tone: Professional, assumed, edit"). |
| Colour | 1.4.3 contrast, 1.4.11 non-text contrast, 1.4.1 use of colour | Assumed, interpreted, and you-said states are differentiated by text label and border style, not colour alone. Highlighted additions use a pattern or underline as well as tint. |
| Motion | 2.3.3 (AAA) / `prefers-reduced-motion` | Cause-and-effect animations are reduced to instant state changes. |
| Timing | 2.2.1 Timing Adjustable | No auto-advancing rounds or timeouts. Auto-advance moves focus only and never submits. |
| Language and reading | 3.1.5 (AAA) | Plain-language questions, roughly a reading age of 12. This also reduces cognitive load for everyone. |

New 2.2 criteria are from [W3C "What's new in WCAG 2.2"](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) (Verified).

---

## 11. Surface options: UX trade-offs

WS7 owns the business case. This section covers UX only.

| Dimension | **Web app** | **Browser extension inside ChatGPT/Claude** | **Desktop hotkey (Raycast-like)** |
|---|---|---|---|
| Context switch | High: user leaves the chat app, then copies back | **Lowest**: works where the prompt is used | Low: summoned over any app |
| Room for the Brief and questions | **Full canvas, two panes** | Cramped: a side panel or overlay competing with the host UI | Small window. Fine for 1–3 cards, poor for a Brief plus a long prompt |
| Handoff of the final prompt | Copy or deep link (fragile, see §1.5) | **Insert directly into the host input.** Hosts with ProseMirror-style editors can reject external edits ([dev.to](https://dev.to/thealexrider/how-i-built-real-time-pii-detection-inside-chatgpts-hostile-text-editor-without-breaking-it-4a68) [snippet only]) | Paste into the focused app (Raycast AI Commands run on selected text, [manual](https://manual.raycast.com/ai/ai-commands) [snippet only]) |
| Reliability and maintenance | **Stable**: you own the UI | **Fragile**: class selectors broke "silently within two weeks" in one developer's report ([dev.to, 2026](https://dev.to/juliedechili/5-things-i-learned-building-a-chrome-extension-that-watches-chatgpt-claude-gemini-4a4i), Verified) | Stable. OS permission prompts add friction |
| Platform risk | Low for the UI | **High**: hosts ship native versions. One rich-text extension became redundant when OpenAI shipped its own ([OpenAI community, Aug 2026](https://community.openai.com/t/i-built-a-rich-text-editor-for-chatgpts-native-web-input-box-sat-on-it-for-a-year-until-last-week-they-shipped-their-own/1390998), Verified). Hosts already ask clarifying questions natively (§1.3) | Medium |
| Mobile | Works (responsive) | None on iOS Safari for most users. Desktop only | None |
| Trust and privacy perception | Clear: user pastes deliberately | An extension that reads AI chat pages needs broad permissions, which raises a trust hurdle (WS8) | Needs accessibility or clipboard permissions |
| Repeat-use speed | Medium (tab plus shortcuts) | High | **Highest for power users** |
| Iteration speed for us | **Highest** | Low (store review, DOM breakage) | Medium |

**Recommendation (Hypothesis):**
1. **MVP: web app.** It is the only surface with room for the Brief, which is the main differentiator. It is stable, works on mobile, and is fastest to learn from.
2. Include a **"quick mode"** inside the web app: a ⌘K-style compact window that runs a template or the fast path. This tests Raycast-like demand cheaply.
3. Treat an **extension as a later distribution experiment**, limited to a thin "Refine with SubText" button that opens a side panel and inserts the result. Expect ongoing breakage, and expect the hosts to compete with it directly.
4. A **desktop hotkey app** fits only if research (WS3) shows a heavy-repeat power-user segment.

---

## 12. Design recommendations and anti-patterns

### Do
- Lead with **one input** and a visible promise of what happens next.
- **Reflect the Brief before asking.** Questions are shown as filling gaps, not as an interrogation.
- **Cap rounds at 3 questions.** End questioning as soon as the remaining gaps would not materially change the prompt.
- **Make "You decide", "Not sure", and "Write prompt now" always available.**
- **Turn every skipped or inferred value into an editable assumption chip.**
- **Render the prompt in sections** with additions highlighted, section-level edit and regenerate, raw view, and version diff.
- **Copy is the primary action.** Deep links are secondary, with clipboard fallback and a length guard.
- **Use specific status text and streaming.** Stop is always available for long operations.
- **Reuse context with visible provenance**, and save only with explicit consent.
- Use **plain words** and keep prompt-engineering vocabulary under "Options".

### Avoid
| Anti-pattern | Why | Evidence |
|---|---|---|
| **Bureaucratic intake form** (10+ fields up front) | Front-loads friction before value. Many fields will not matter for a given request | NN/g Wizards (wrong for repeat tasks). Zou et al. (bad questions harm) |
| **Numbered questions in a chat bubble** | Users must retype answers and track numbers | NN/g 2026 critique of Perplexity |
| **Fake progress bars** ("Step 2 of 5" when rounds are adaptive, or percent meters) | False precision. A stalling bar frustrates | NN/g progress indicators |
| **Over-asking / interrogation loops** | Each extra question costs time and trust. Users react against follow-up "teasers" ([PCWorld](https://pcworld.com/article/3221302/i-got-chatgpt-to-stop-its-annoying-follow-up-questions-with-one-prompt.html) [snippet only]) | Zou et al. HAX G10 ("when in doubt" only) |
| **Silent rewriting** (Magic-Prompt-style changes the user can't see) | Intent drift and loss of agency. Not reproducible | Shape of AI (prompt enhancer). Ideogram API docs on reproducibility [snippet only] |
| **Re-asking known information** | Violates WCAG 3.3.7 and HAX G12 | W3C. MSR |
| **Anthropomorphic filler** ("Great question! 😊") | Raises expectations and wastes attention | PAIR Mental Models |
| **Jargon labels** ("Enable CoT", "Few-shot") or icon-only controls | Users misunderstand vague names and icons | NN/g prompt controls |
| **Sign-up wall before first prompt** | Blocks first value | Hypothesis. Test with WS7 |
| **Numeric confidence scores** on assumptions | Implies precision the system does not have | Hypothesis |
| **Prompt in URL for long or sensitive content** | Truncation (~14k for Claude) and leakage into history and logs | Claude Help. Tenable |
| **One-question-per-screen pagination on mobile** | Slower, with no breakoff benefit in survey research | HSE / Mavletova & Couper [snippet only] |

### Visual direction (principles, not visuals)
- **Typography carries hierarchy.** Use one typeface family and two or three sizes.
- **One accent colour,** reserved for the primary action and the "you said" and "updated" states.
- **Neutral surfaces, generous spacing.** Cards have no heavy borders.
- **Motion only for causality,** for example a chip pulse when its prompt section changes. Respect reduced motion.
- **Density:** comfortable by default, with a compact option for power users. This mirrors Linear's "simple first, then powerful".

---

## 13. Verified vs. claimed vs. hypothesis: summary

| Claim | Status |
|---|---|
| ChatGPT deep research may ask clarifying questions and shows an editable plan | **Verified** (Help Center, read in browser) |
| Claude AskUserQuestion: 1–4 questions, 2–4 options, header ≤12 chars, free-text "Other", optional previews | **Verified** (SDK docs) |
| Gemini Deep Research: Edit plan → Start research, about 5–10 min | **Verified** (Gemini Help) |
| Cursor plan mode asks clarifying questions and produces an editable plan | **Verified** (docs). "Interactive UI" changelog wording [snippet only] |
| Bolt Enhance prompt asks guided questions, then gives an editable prompt | **Verified** (Bolt support) |
| Claude desktop deep link `claude://claude.ai/new?q=` prefills only, truncates ~14k | **Verified** |
| `claude.ai/new?q=` (web) works | **Unverified** (third-party reports) |
| `chatgpt.com/?q=` prefills, and OpenAI added auto-submit protections after Tenable's report | Protections **Verified** (Tenable). Current prefill behaviour **unverified** |
| High-quality clarifying questions help, low-quality ones harm | Paper abstract [snippet only]. Academic, credible |
| Typeform's one-at-a-time format doubles completion | **Claimed** (vendor) |
| Paging vs scrolling has little effect on breakoff, and scrolling is faster on mobile | [snippet only] secondary summary of peer-reviewed studies |
| Widgets beat numbered text questions | **Expert opinion** (NN/g), no controlled data |
| A visible, editable Brief is the main differentiator | **Hypothesis** |
| Web app first, extension later | **Hypothesis** |

---

## 14. Unresolved questions

1. **Does a visible Brief add value, or is it clutter?** Users might want only the prompt. Is the Brief understood without explanation?
2. **What is the right default round size (1 vs 3), and how many rounds** before satisfaction drops? This needs measurement in this specific context, not survey analogies.
3. **Do users read or edit the generated prompt, or copy it blindly?** If they copy blindly, section editing and diffs are over-investment.
4. **"You decide" vs "Not sure":** do users understand the difference, or should there be one combined "Skip / you decide"?
5. **Exactly how do the native host flows look** (ChatGPT deep research question UI, Perplexity's current behaviour, v0 enhance)? I did not inspect them logged in. WS1 should screenshot them.
6. **Current deep-link behaviour** of `chatgpt.com/?q=` and `claude.ai/new?q=` from a third-party origin. I did not test this live, to avoid sending messages from the user's accounts.
7. **Would users accept SubText as a separate step** at all, given native clarification in the hosts? This is the existential UX question, shared with WS3 and WS7.
8. **Mobile share-sheet handoff:** does it reliably prefill the ChatGPT, Claude, and Gemini apps?
9. **The "paste back the bad output" refine loop:** is it valuable enough to justify the friction?

## 15. Validation experiments

| # | Experiment | Method | Success signal |
|---|---|---|---|
| E1 | **Native vs SubText head-to-head** | 12–16 moderated sessions with WS3 personas. Same 4 tasks done (a) directly in ChatGPT/Claude, including native clarification, and (b) via a SubText prototype. Blind-rate the outputs. | SubText outputs preferred in ≥65% of pairs, and total time not worse by more than about 60 s. If not, the standalone UX thesis fails. |
| E2 | **Brief visible vs hidden** | A/B in prototype (n≈200 unmoderated) | Higher correction rate, higher output rating, and no completion drop with the Brief visible |
| E3 | **Round size 1 vs 3, and pagination vs stack** | A/B, measuring skip rate, time to prompt, and satisfaction (SEQ) | Choose the variant with lower abandonment at equal quality |
| E4 | **Skip affordance comprehension** | 5-second tests and first-click tests on question cards | ≥80% correctly predict what "You decide" and "Not sure" do |
| E5 | **Fast path adoption** | Telemetry: % sessions using Shift+Enter or "Write now" by session 5 | Healthy if 20–50%. If >70%, questioning is not valued. If <5%, discoverability is a problem |
| E6 | **Prompt engagement** | Track edits, section regenerates, raw toggle, and dwell time before copy | Informs whether to invest in editing and diffs |
| E7 | **Deep-link reliability matrix** | Test `claude://`, `claude.ai/new?q=`, `chatgpt.com/?q=`, Gemini, and mobile share across browsers and apps, with lengths of 1k/5k/15k characters | Document which to ship. Default to copy |
| E8 | **Latency tolerance** | Prototype with injected delays (0.5/1.5/3/6 s to first question) | Find the knee where abandonment rises. Set the engineering budget (WS6) |
| E9 | **Surface preference** | Fake-door test: "Get the Chrome extension" and "Get the Mac app" buttons in the web app | Click-through rate informs WS7 |
