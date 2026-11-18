# 04 — Prompt Engineering Knowledge Base (WS2)

**Workstream:** WS2 (Applied AI research and prompt engineering)
**Date:** 2026-11-13 (all sources accessed on this date)
**Sources file:** [`sources/WS2_sources.md`](sources/WS2_sources.md). Sources are cited inline by URL and, where useful, by `[WS2-#]`.
**Scope:** This file covers prompting techniques, the evidence behind them, how current models differ, and a task taxonomy that can be built as a knowledge base. It does not cover competitor facts (WS1), question-selection algorithms (WS5), or the evaluation harness design (WS6). It only touches those where needed.

---

## 0. Summary of key findings

Each finding is labelled **Verified** (I read the primary source), **Claimed** (vendor self-report or secondary coverage), or **Hypothesis** (my inference).

1. **Missing information is the main lever. Prompt "technique" is now secondary.** All three frontier vendors' current docs say the same things: say what you want, give the context the model cannot see, define what "done" looks like, and keep prompts lean. Claude Code's docs say a specific prompt helps because "it gives Claude information it doesn't already have" ([code.claude.com best practices](https://code.claude.com/docs/en/best-practices)). OpenAI's GPT-6 docs focus on initiative, scope, and effort rather than prompt tricks ([OpenAI latest-model guide](https://developers.openai.com/api/docs/guides/latest-model)). **Verified.** This supports SubText's thesis of asking for missing context. It weakens any value claim built on "applying advanced techniques."

2. **Underspecification is measurable, common and fragile.** Yang et al. found that LLMs guess unspecified requirements correctly only **41.1%** of the time. Underspecified prompts were about **2× as likely to regress** when the model or prompt changed, with drops sometimes above 20%. Specifying everything did not reliably help either, and standard prompt optimisers gave little benefit ([arXiv 2505.13360](https://arxiv.org/abs/2505.13360)). Pecher et al. (2026) attribute "a significant portion" of prompt sensitivity to underspecification ([arXiv 2602.04297](https://arxiv.org/abs/2602.04297)). **Verified (abstracts).** This is the strongest direct evidence for SubText's core idea. It also shows that adding more requirements has diminishing and sometimes negative returns.

3. **Rewriting user prompts can measurably help, with caveats.** Sarkar et al. (Microsoft, 2025) rewrote prompts from real conversations where users were dissatisfied. With gpt-4o as both rewriter and responder, the rewritten version won **68.6%**, lost **8.0%** and tied **23.4%** (gpt-4o as judge). Gains were larger for information-seeking tasks (about 72–77%) than for creative writing (59.7%). Weak models rewriting for themselves made things worse: llama-3-8B won 23.8% and lost 40.5%. Intent was fully preserved in only about **74%** of rewrites ([arXiv 2503.16789](https://arxiv.org/html/2503.16789v2)). BPO reported win-rate gains of **+22%** for ChatGPT and **+10%** for GPT-4 ([arXiv 2311.04155](https://arxiv.org/abs/2311.04155)). **Verified**, but the evidence uses LLM judges and simulation, not in-product A/B tests. The gain shrinks as the target model gets stronger.

4. **Reasoning models made several classic techniques unnecessary or harmful.** OpenAI says reasoning models do not need "think step by step" style prompts and that these can sometimes hurt; it advises starting zero-shot ([OpenAI reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)). Few-shot examples lowered o1-preview's performance ([arXiv 2411.03590](https://arxiv.org/abs/2411.03590)). DeepSeek-R1's authors say few-shot "consistently degrades" performance ([arXiv 2501.12948](https://arxiv.org/html/2501.12948v2)). Chain-of-thought (CoT) gives marginal gains at most on reasoning models, at a large cost in time and tokens ([arXiv 2506.07142](https://arxiv.org/abs/2506.07142)). Anthropic's newest models refuse requests that ask them to write their reasoning into the response ([Fable 5.2 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)). **Verified.** A prompt generator that adds "Let's think step by step" or forced CoT sections by default is now a defect.

5. **Longer is not better.** Performance falls by **13.9–85%** as input length grows, even when retrieval is perfect ([arXiv 2510.05381](https://arxiv.org/abs/2510.05381)). The best frontier models reach only **68%** accuracy at 500 simultaneous instructions, and they favour earlier instructions ([arXiv 2507.11538](https://arxiv.org/abs/2507.11538)). Chroma found that all 18 models tested did better on focused ~300-token prompts than on full ~113k-token prompts ([Chroma](https://www.trychroma.com/research/context-rot)). Anthropic's principle is "the smallest set of high-signal tokens" ([Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). **Verified.** Secondary coverage says OpenAI's GPT-5.6 guidance (July 2026) reported **10–15%** higher eval scores and **41–66%** fewer tokens from lean prompts compared with prescriptive ones ([cryptobriefing](https://cryptobriefing.com/openai-gpt-56-prompting-guide-outcome-first/)). **Claimed**; I could not reach OpenAI's primary page.

6. **Personas do not improve accuracy.** Across 162 roles, 4 model families and 2,410 questions, adding a persona did not improve performance compared with no persona ([arXiv 2311.10054](https://arxiv.org/abs/2311.10054), EMNLP Findings 2024). Expert personas showed "no consistent benefit," and low-knowledge personas hurt accuracy ([arXiv 2512.05858](https://arxiv.org/abs/2512.05858)). Anthropic and Google still recommend roles for tone and focus. **Verified.** Use a role for register, audience and scope, never as an accuracy booster.

7. **Emphatic and manipulative prompting is now counterproductive.** Anthropic says "CRITICAL: You MUST" language causes current models to overtrigger, and that piling on emphasis "mostly makes Claude over-apply the rule" ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices), [Claude Code docs](https://code.claude.com/docs/en/best-practices)). Cursor's "Be THOROUGH" caused excess tool calls on GPT-5 ([OpenAI GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). Tipping and threatening had no significant effect on GPQA or MMLU-Pro ([arXiv 2508.00614](https://arxiv.org/abs/2508.00614)). **Verified.**

8. **Model-specific differences are real but narrowing, and they change quickly.** Anthropic has removed assistant prefill: it returns a 400 error from Claude 4.6 onward. Effort replaces thinking budgets, and `budget_tokens` errors from 4.7 onward. Anthropic maintains per-model prompting pages for nine current model families. OpenAI uses `reasoning.effort` and `verbosity` and is now on `gpt-6-astra`. Gemini 4 ignores custom temperature, top_p and top_k. **Verified.** A model-conventions layer must be data-driven and updated at least quarterly. Hard-coded templates will rot within months.

**Biggest disconfirming evidence for the product thesis:**
- (a) Vendors increasingly do the rewriting themselves. Google's Imagen prompt rewriter is **on by default** ([Vertex docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/use-prompt-rewriter)). Claude Code includes an "interview me until you could write the spec" workflow ([Claude Code docs](https://code.claude.com/docs/en/best-practices)). GPT-5.2 guidance tells the model to ask 1–3 clarifying questions when a request is ambiguous ([GPT-5.2 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5-2_prompting_guide)).
- (b) The benefit of rewriting shrinks as target models get stronger. BPO gave +22% for ChatGPT but only +10% for GPT-4.
- (c) Prompt-engineering "techniques" no longer differentiate. The remaining value lies in eliciting the user's private context (goals, audience, constraints, success criteria), which a model with a clarifying-question habit can also do.

---

## 1. Evidence discipline used in this document

- I read **arXiv abstracts** for most papers. Where I give a number, it came from the abstract or, where stated, from the HTML full text I read (Sarkar et al., Prompt Expansion, DeepSeek-R1). I did not read full papers for the others, so per-task numbers are not reported.
- **Vendor documentation** is primary for "what the vendor recommends," and I label it Verified for that purpose. Vendor claims about their own internal tests (for example, "up to 30% better with query at end") are labelled **Claimed (vendor-internal test)**.
- **Not accessible:** OpenAI's primary GPT-5.6 prompting page (only secondary coverage found; decrypt.co returned 403). The DALL·E 3 paper PDF exceeded the fetch size limit, so I make no claims about its prompt-upsampling results. I could not locate an official "Gemini 3 prompting guide" page separate from the general strategies page.
- **Model generations in this document.** Anthropic docs list Claude Fable 5.2 / Mythos 5.2 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5 as current. OpenAI docs centre on `gpt-6-astra` and the gpt-6.1 family. Google docs reference Gemini 4 and 3.6+. All were Verified from the official pages on 2026-11-13.

---

## 2. From prompt engineering to context engineering to harness engineering

| Era | Core question | Representative guidance | What changed |
|---|---|---|---|
| **2020–2022: prompt crafting** (GPT-3, early instruction-tuned models) | "What words make the model do the task?" | Few-shot demos ([Liu et al. 2021](https://arxiv.org/abs/2101.06804)); "Let's think step by step" lifted InstructGPT on MultiArith from 17.7% to 78.7% ([Kojima et al.](https://arxiv.org/abs/2205.11916)); CoT exemplars ([Wei et al.](https://arxiv.org/abs/2201.11903)) | Models were brittle. Wording, order and format swung accuracy wildly ([Lu et al.](https://arxiv.org/abs/2104.08786); [Sclar et al.](https://arxiv.org/abs/2310.11324)) |
| **2023–2024: structured prompting and pipelines** (GPT-4, Claude 2/3) | "How do I structure instructions, examples and data?" | XML tags, role, CoT, chaining, ReAct ([Yao et al.](https://arxiv.org/abs/2210.03629)), self-consistency ([Wang et al.](https://arxiv.org/abs/2203.11171)), optimisers (APE, OPRO, DSPy); [The Prompt Report](https://arxiv.org/abs/2406.06608) catalogues 58 text techniques | Techniques became systematised. Automatic optimisation started to beat hand-written prompts on benchmarks |
| **2024–2025: reasoning models** (o1/o3, Claude extended thinking, Gemini 2.5 thinking, DeepSeek-R1) | "How much should I tell a model that already reasons?" | "Keep prompts simple"; skip CoT; zero-shot first ([OpenAI](https://developers.openai.com/api/docs/guides/reasoning-best-practices)) | Explicit reasoning scaffolds became redundant, and sometimes harmful |
| **2025–2026: context engineering** | "What configuration of context is most likely to generate our model's desired behavior?" ([Anthropic, Sept 2025](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)) | Smallest high-signal token set; just-in-time retrieval; compaction; notes; sub-agents; system prompts at the "right altitude" | Context, not phrasing, became the bottleneck. Context rot became a known failure ([Chroma](https://www.trychroma.com/research/context-rot)) |
| **2026: harness and outcome engineering** | "What does success look like, when should the model stop, and what can it check?" | Effort parameters; "give Claude a check to run"; "What you can stop doing" tables ([Claude Code](https://code.claude.com/docs/en/best-practices)); outcome-first prompting for GPT-5.6 (**Claimed**, [secondary](https://cryptobriefing.com/openai-gpt-56-prompting-guide-outcome-first/)) | Vendors now tell developers to **delete** legacy prompt scaffolding. Controls have moved from prose into API parameters (effort, verbosity, structured outputs) |

**Implication for SubText (Hypothesis):** The prompt artefact that matters in 2026 is a well-specified brief: goal, context, constraints, success criteria and output shape. Clever wording no longer matters much. SubText is closer to a requirements-elicitation tool than a prompt-engineering tool, and it should position and build itself that way.

---
## 3. Technique catalogue

Each technique uses the same nine fields: **What**, **How**, **Why it may help**, **Use when**, **Avoid when**, **Limitations**, **Task categories**, **SubText implementation**, **Measure**. The evidence strength line gives the best evidence I actually read.

### T1. Clear, explicit instructions with context and motivation

| Field | Content |
|---|---|
| What | State the task, desired output and quality bar explicitly. Explain *why* a constraint exists. |
| How | Write direct imperative sentences. Use sequential steps when order matters. Give the reason behind each rule, e.g. "read aloud by TTS, so no ellipses." |
| Why it may help | Current models follow instructions precisely and literally. They also generalise from the stated reason to cases the rule did not list. Anthropic: "Claude can generalize from the explanation" ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). GPT-4.1 and later follow instructions "more literally," so implicit rules are no longer inferred ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)). |
| Use when | Always. This is the baseline. |
| Avoid when | Never avoid it, but avoid **over**-specifying. Too many rules degrade adherence ([IFScale](https://arxiv.org/abs/2507.11538)), and contradictions cost GPT-5 extra reasoning ([GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). |
| Limitations | Literal models do *only* what is asked. Anthropic notes Claude builds the smallest thing that satisfies the request unless told to "be ambitious" ([Claude Code](https://code.claude.com/docs/en/best-practices)). |
| Task categories | All |
| SubText implementation | Turn every answered slot into a plain sentence with its reason attached. Run a **contradiction check** before output. Ask an explicit **ambition/scope** question ("minimal vs. fully featured") for build tasks. |
| Measure | Rate of instruction violations in outputs (LLM-judge checklist); contradiction count in generated prompts; A/B with and without reasons attached. |

Evidence strength: vendor guidance (Verified, consistent across Anthropic, OpenAI, Google and Microsoft). Few controlled studies exist on "adding reasons."

### T2. Task decomposition and prompt chaining

| Field | Content |
|---|---|
| What | Split a complex task into sequential (chain), parallel (sectioning or voting) or routed sub-tasks, each with its own prompt. |
| How | Prompt 1's output feeds prompt 2, with optional programmatic checks between steps ([Anthropic, Building effective agents](https://www.anthropic.com/research/building-effective-agents)). Variants include least-to-most prompting (solve easier sub-problems first) and Gemini's "split / chain / aggregate" ([Gemini strategies](https://aistudio.google.com/docs/prompting-strategies)). |
| Why it may help | Each call has a narrower focus. Intermediate outputs can be inspected and logged. Least-to-most reached ≥99% on SCAN compared with 16% for CoT on code-davinci-002 ([Zhou et al.](https://arxiv.org/abs/2205.10625)). |
| Use when | You need to inspect or validate intermediate output, enforce a pipeline, mix models, or run the same check repeatedly. Typical cases are research → outline → draft → review, and spec → plan → build. |
| Avoid when | The model is a reasoning or adaptive-thinking model and the task is a single coherent reasoning problem. Anthropic: Claude "handles most multistep reasoning internally"; chaining is for inspection or pipeline control ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). |
| Limitations | Adds latency and cost. Errors compound across steps. Context is lost between calls unless passed on explicitly. |
| Task categories | Long-form writing, research, software builds, data pipelines, marketing campaigns |
| SubText implementation | For large tasks, output a **staged prompt pack** (e.g. "Prompt 1: produce a spec; Prompt 2: build from the spec") instead of one mega-prompt. This matches Claude Code's "write SPEC.md, then start a fresh session" pattern ([Claude Code](https://code.claude.com/docs/en/best-practices)). |
| Measure | Final-output quality versus a single-prompt baseline; user completion rate per stage; tokens and time. |

### T3. Role / persona specification

| Field | Content |
|---|---|
| What | "You are a [role]..." in the system prompt or at the start of the prompt. |
| How | One sentence naming the role, audience and register. |
| Why it may help | It sets tone, vocabulary, scope and audience. Anthropic says "even a single sentence makes a difference" for behaviour and tone ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). Gemini recommends personas in the system instruction ([Gemini](https://aistudio.google.com/docs/prompting-strategies)). OpenAI's structure starts with "Identity" ([OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)). |
| Use when | Setting register (formal or casual), audience ("explain to a first-year student"), perspective (reviewer, critic), or domain conventions. |
| Avoid when | You expect it to raise **factual accuracy**. It does not: there is no improvement across 162 personas ([Zheng et al., EMNLP Findings 2024](https://arxiv.org/abs/2311.10054)), and expert personas show "no consistent benefit" on GPQA and MMLU-Pro ([Basil et al. 2025](https://arxiv.org/abs/2512.05858)). |
| Limitations | Low-knowledge personas *harm* accuracy. Mismatched expert personas sometimes degrade it, and Gemini 2.5 Flash sometimes refused under mismatched personas (per [Wharton GAIL summary](https://gail.wharton.upenn.edu/research-and-insights/playing-pretend-expert-personas/), [snippet only]). |
| Task categories | Writing, tutoring, feedback and review, creative work, customer-facing copy |
| SubText implementation | Generate a role line only when it encodes **audience, register or perspective** the user specified, e.g. "You are reviewing this as a skeptical investor." Do not generate grandiose personas ("world-class expert with 30 years..."). Put audience in an explicit "Audience" field rather than hiding it in a persona. |
| Measure | Tone-match ratings; A/B persona versus "audience + register" field; accuracy unchanged (control). |

### T4. Context engineering and context selection (including long-context placement)

| Field | Content |
|---|---|
| What | Choose *which* information enters the context and *where* it goes. |
| How | Include only high-signal material. Put long documents **first** and the query and instructions **last**. Wrap documents in tagged metadata. Ask the model to quote relevant passages before answering. Use references (file paths, links) and just-in-time loading instead of pasting everything ([Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). |
| Why it may help | Attention is a finite budget ("context rot"). Relevant information in the middle of a long context is used worst ([Liu et al., TACL](https://arxiv.org/abs/2307.03172)). Length alone hurts, by 13.9–85% ([Du et al. 2025](https://arxiv.org/abs/2510.05381)). Anthropic says queries at the end improve quality "by up to 30 percent in tests" (**Claimed, vendor-internal**). Gemini also says to put instructions "at the very end" after large context ([Gemini](https://aistudio.google.com/docs/prompting-strategies)). |
| Use when | Any prompt with pasted material over ~a few thousand tokens. Multi-document tasks. RAG. Agent memory. |
| Avoid when | Placement rules are not universal. GPT-4.1 found instructions at **both** start and end best, and if only one position is used, *above* the context did better than below ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)). Microsoft found no ordering effect on GPT-4 in its example ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering)). |
| Limitations | Placement effects are model-specific. Even perfect placement does not remove the length penalty: Du et al. saw a "similar drop" with evidence placed right before the question. Their mitigation, having the model recite evidence first, gave up to +4% on RULER for GPT-4o. |
| Task categories | Research, data analysis, code review, document Q&A, legal and financial analysis |
| SubText implementation | Ask users for **pointers** (links, filenames, "paste only the relevant section") rather than everything. Order generated prompts as [context/documents] → [task] → [constraints] → [output format] for Claude and Gemini. For OpenAI non-reasoning models, add a short restatement of the instructions after long context. Add "quote the relevant passages first" for long-document tasks. |
| Measure | Accuracy on long-document QA with fixed vs. alternative placement; prompt token count vs. quality curve. |

### T5. Constraint specification (scope, negative constraints, stop conditions)

| Field | Content |
|---|---|
| What | Explicit boundaries: what to include or exclude, length, scope, what must not change, when to stop. |
| How | Phrase constraints positively where possible ("write flowing prose" rather than "no markdown") ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). Give scope rules ("implement only what was requested"; [GPT-5.2 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5-2_prompting_guide)) and preserve-lists for edits ("keep the existing styling"; [Lovable](https://docs.lovable.dev/prompting/prompting-one); [OpenAI image guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)). Add stop and escape-hatch conditions for agents ([GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). Give the model an "out" ("say 'not found' if absent"; [Microsoft](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering)). |
| Why it may help | Literal models over-build without scope limits. GPT-5.2 "tends to produce more code than minimal specs call for." Giving an out reduces fabrication. |
| Use when | Edits to existing work, agentic coding, regulated content, length-sensitive outputs. |
| Avoid when | Constraints are absolute but the user did not mean them that way. Anthropic: the model "treats an instruction that contains 'never' as absolute"; prefer scoped rules with reasons ([Fable 5.2 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)). |
| Limitations | Many constraints compete. Accuracy degrades with instruction density and models favour earlier instructions ([IFScale](https://arxiv.org/abs/2507.11538)). Hard limits on writing style ("20 words or fewer") make prose choppy on current Claude. |
| Task categories | All, especially code changes, edits, design and image edits |
| SubText implementation | Ask "What must **not** change?" for any edit task. Convert user "never/always" statements into scoped rules with reasons. Cap generated constraints at a small number, prioritised by impact. |
| Measure | Constraint-violation rate; unrequested-change rate (diff size) in coding tasks. |

### T6. Output formatting and structured outputs (XML tags, Markdown, JSON Schema)

| Field | Content |
|---|---|
| What | Delimit prompt sections, and specify or enforce output structure. |
| How | **Input:** XML tags (`<context>`, `<instructions>`, `<example>`) or Markdown headers, used consistently ([Claude](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); [Gemini](https://aistudio.google.com/docs/prompting-strategies); [OpenAI](https://developers.openai.com/api/docs/guides/prompt-engineering)). **Output:** use API-level Structured Outputs with JSON Schema for machine-readable output. OpenAI: Structured Outputs enforces schema adherence and JSON mode does not ([OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)). Anthropic recommends structured outputs or tool enums now that prefill is removed. |
| Why it may help | Delimiters reduce misinterpretation between instructions and data. Schema enforcement removes parse failures. For long document sets on GPT-4.1, XML and pipe-delimited formats did well and **JSON did particularly poorly** as an *input* delimiter ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)). |
| Use when | Prompts that mix instructions, data and examples. Any output a program will parse. Classification. |
| Avoid when | The task needs reasoning and you would force the reasoning itself into a rigid format. Format restrictions caused "a significant decline" in reasoning, and stricter formats did worse ([Tam et al.](https://arxiv.org/abs/2408.02442)). Let reasoning happen in thinking (reasoning models) or free text, then format. |
| Limitations | Prompt *format* (plain, Markdown, JSON, YAML) changed GPT-3.5 results by up to 40%, while GPT-4 was more robust ([He et al.](https://arxiv.org/abs/2411.10541)). The prompt's style leaks into the output style (Markdown in, Markdown out; [Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). |
| Task categories | Data extraction, analysis, API and agent prompts, classification, any downstream automation |
| SubText implementation | Emit **XML-sectioned** prompts for Claude, **Markdown-sectioned** prompts for OpenAI and Gemini (both accept XML too). Match the prompt's formatting to the desired output style. Offer a JSON Schema block only when the user says the output feeds software. |
| Measure | Parse success rate; format-compliance rate; quality with vs. without strict output schema on reasoning-heavy tasks. |

### T7. Few-shot prompting and example selection

| Field | Content |
|---|---|
| What | Include input→output demonstrations. |
| How | 3–5 relevant, diverse examples wrapped in `<example>` tags ([Claude](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). Keep formatting consistent and use a moderate number ([Gemini](https://aistudio.google.com/docs/prompting-strategies)). Retrieve examples semantically similar to the input ([Liu et al. 2021](https://arxiv.org/abs/2101.06804): about +41.9% on ToTTo and +45.5% on NQ for GPT-3). |
| Why it may help | Examples show format, label space and style more reliably than description. Min et al. found demonstrations work mainly by showing **label space, input distribution and format**. Correct labels mattered little ([Min et al., EMNLP 2022](https://arxiv.org/abs/2202.12837)). |
| Use when | Tone or style matching (e.g. "write like these 3 emails"), strict formats, classification label sets. Non-reasoning models. |
| Avoid when | **Reasoning models.** Few-shot hurt o1 ([Nori et al.](https://arxiv.org/abs/2411.03590)). DeepSeek-R1 is "consistently" degraded ([R1 paper](https://arxiv.org/html/2501.12948v2)). OpenAI: "start zero-shot," add examples only for complex output requirements ([OpenAI](https://developers.openai.com/api/docs/guides/reasoning-best-practices)). Also avoid when examples could be copied verbatim: GPT-4.1 repeats sample phrases ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)). |
| Limitations | Order sensitivity can mean the difference between "near state-of-the-art and random guess performance," and good orders do not transfer across models ([Lu et al., ACL 2022](https://arxiv.org/abs/2104.08786)). This evidence comes mostly from older models. Format sensitivity reached up to 76 points on LLaMA-2-13B ([Sclar et al., ICLR 2024](https://arxiv.org/abs/2310.11324)). Over-prompting: accuracy rises and then falls as examples are added ([Tang et al. 2025](https://arxiv.org/abs/2509.13196), [snippet only]). Gemini and Anthropic recommend examples, while OpenAI and DeepSeek warn against them for reasoning models. These positions conflict and must be resolved per model. |
| Task categories | Writing style matching, classification, extraction, brand voice, data transformation |
| SubText implementation | Ask "Do you have an example of what good looks like?" for style-heavy tasks. This is often the single highest-value question for writing. Insert user examples as **style references**, labelled "match tone and structure, not content." Do not auto-generate synthetic few-shot examples for reasoning-model targets. |
| Measure | Style-similarity rating with vs. without examples; verbatim-copy rate; reasoning-model accuracy with vs. without examples. |

### T8. Chain-of-thought (CoT), its descendants, and reasoning models

| Field | Content |
|---|---|
| What | Elicit intermediate reasoning: few-shot CoT ([Wei et al.](https://arxiv.org/abs/2201.11903)), zero-shot "Let's think step by step" ([Kojima et al.](https://arxiv.org/abs/2205.11916)), self-consistency (sample many, vote; [Wang et al.](https://arxiv.org/abs/2203.11171): GSM8K +17.9 points), Tree of Thoughts (search over thoughts; Game of 24: 74% vs CoT 4% on GPT-4; [Yao et al.](https://arxiv.org/abs/2305.10601)), least-to-most. |
| How | Instruction or exemplars that show reasoning, or sampling and search scaffolds. On reasoning models, use **API controls** instead: Anthropic `effort` and adaptive thinking ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)), OpenAI `reasoning.effort` ([OpenAI GPT-6 guide](https://developers.openai.com/api/docs/guides/latest-model)), and Gemini's built-in thinking ([Gemini](https://aistudio.google.com/docs/prompting-strategies)). |
| Why it may help | On non-reasoning models, CoT gives extra computation for math and symbolic tasks. A meta-analysis of 100+ papers found gains concentrated on **math and symbolic logic**. On MMLU, CoT ≈ direct answering unless the problem contains an "=" sign ([Sprague et al., ICLR 2025](https://arxiv.org/abs/2409.12183)). |
| Use when | **Non-reasoning / fast models** (e.g. OpenAI minimal-reasoning or no-reasoning modes; GPT-5 guide recommends explicit planning prompts at minimal reasoning, [GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)) on math, logic or multi-step tasks. Use "think hard before answering" only to nudge Gemini on very hard tasks (Gemini docs). |
| Avoid when | (1) **Reasoning models**: marginal gains at best and much higher latency ([Meincke et al. 2025](https://arxiv.org/abs/2506.07142)). OpenAI says it can "sometimes hurt." (2) Tasks where deliberation hurts humans (implicit statistical learning, some perceptual tasks): up to −36.3 points for o1-preview vs GPT-4o ([Liu et al. 2024](https://arxiv.org/abs/2410.21333)). (3) **Requests to write reasoning into the visible response on Claude Fable 5.2**, which can trigger the `reasoning_extraction` refusal ([Fable 5.2 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)). Microsoft warns that extracting reasoning by means other than the summary parameter may violate policy ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering)). |
| Limitations | CoT adds variability and sometimes breaks questions the model would get right ([Meincke et al.](https://arxiv.org/abs/2506.07142)). Claude Code: "think step by step" is "ordinary prompt text" and does not raise effort ([Claude Code](https://code.claude.com/docs/en/best-practices)). Fable 5.2 ignores "answer directly without deliberating" at medium effort and above. |
| Task categories | Math, logic, planning, debugging (non-reasoning models only) |
| SubText implementation | **Default: do not insert CoT phrases.** For reasoning-model targets, output an *effort recommendation* (e.g. "Use high effort / thinking on for this") as a setting note, not as prompt text. For explicitly non-reasoning targets, a single "reason before answering" line is acceptable for math or logic tasks. |
| Measure | Accuracy, latency and tokens with vs. without CoT text per target model; refusal rate on Claude. |

### T9. Tool-use and agentic prompting

| Field | Content |
|---|---|
| What | Instructions for when and how a model calls tools, persists, plans, reports progress and stops. |
| How | Give clear tool names and descriptions, with tools passed via the API `tools` field. GPT-4.1 got +2% from this vs. injecting schemas into the prompt ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)). Use explicit action verbs ("Change this function" rather than "Can you suggest changes"; [Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). Set eagerness controls and tool-call budgets ([GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). Give a verifiable check ("tests pass") ([Claude Code](https://code.claude.com/docs/en/best-practices)). Apply poka-yoke tool design, e.g. absolute paths ([Building effective agents](https://www.anthropic.com/research/building-effective-agents)). |
| Why it may help | GPT-4.1's three reminders (persistence, tool use, planning) raised its internal SWE-bench Verified score by close to 20% (**Claimed, vendor-internal**). Passing reasoning back via the Responses API raised Tau-Bench Retail from 73.9% to 78.2% (**Claimed**, [GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). |
| Use when | Agentic coding tools, automation, research agents. |
| Avoid when | Do not carry over anti-laziness boosters. Current Claude models "might overtrigger" on instructions that older models needed ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). "Keep going, don't be lazy" is "more likely to cause over-work" ([Claude Code](https://code.claude.com/docs/en/best-practices)). |
| Limitations | Behaviour shifts per model version: Fable 5.2 stops early at low effort, GPT-6 over-tests, Opus 4.6 over-delegates. Vendor test numbers are internal. |
| Task categories | Vibe coding, agentic coding, automation, research agents |
| SubText implementation | For agentic tool targets (Claude Code, Cursor, Lovable, Codex), generate: goal, context the agent can't see, files and patterns to follow, what must not change, definition of done **as a runnable check**, and approval boundaries. Omit motivational filler. |
| Measure | Task success on held-out coding tasks; number of correction turns; unrequested-change rate. |

### T10. Retrieval-augmented generation (RAG) and grounding

| Field | Content |
|---|---|
| What | Retrieve external documents into context and ground answers in them. |
| How | Rewrite queries before retrieval ([Ma et al., EMNLP 2023](https://arxiv.org/abs/2305.14283)). Add chunk-level context (Contextual Retrieval: top-20 retrieval failures cut by 35% with contextual embeddings, 49% with contextual BM25 added, and 67% with reranking; [Anthropic](https://www.anthropic.com/news/contextual-retrieval), **Claimed, vendor test**). Ask for inline citations ([Microsoft](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering)). Add a grounding clause limiting answers to supplied context ([Gemini](https://aistudio.google.com/docs/prompting-strategies)). |
| Why it may help | Up-to-date, verifiable information; fewer fabrications; citations make errors checkable. |
| Use when | Factual questions about specific or recent data; company knowledge; research. |
| Avoid when | The knowledge base is small. Anthropic: under ~200k tokens, "just include the entire knowledge base" with caching. Avoid too when retrieval adds distractors: even one distractor lowers accuracy ([Chroma](https://www.trychroma.com/research/context-rot)). |
| Limitations | Retrieved content is an **indirect prompt-injection** vector ([Greshake et al.](https://arxiv.org/abs/2302.12173)). |
| Task categories | Research, market research, academic study, business analysis |
| SubText implementation | SubText mostly produces prompts, not RAG systems. It should prompt users to attach or point to sources, add "cite sources inline; say if not found," and recommend web-search-enabled modes for time-sensitive tasks. |
| Measure | Citation accuracy (claims supported by cited source); unsupported-claim rate. |

### T11. Multimodal prompting (image/video understanding and generation)

| Field | Content |
|---|---|
| What | Prompts that include images, or that target image and video generators. |
| How | **Understanding:** give images with clear references. Claude improves when allowed to crop/zoom regions ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). **Image generation** (OpenAI `gpt-image-2`): order prompts as scene → subject → key details → constraints; state the intended use; put exact text in quotes; iterate with single changes; repeat preserve-lists on edits ([OpenAI image guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)). **Video** (Veo): subject, action, scene, camera angle and movement, lens, visual style (lighting, mood, art style), temporal pacing, audio in separate sentences; negative prompts as noun lists ("wall, frame"), not "no walls" ([Google Veo guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide)). |
| Why it may help | Generators respond to concrete visual vocabulary. Underspecified prompts produce generic results. |
| Use when | Any image or video generation request. |
| Avoid when | The user wants to explore. Over-specification reduces diversity, and Prompt Expansion research targeted **diversity** for underspecified queries ([Datta et al.](https://arxiv.org/abs/2312.16720)). |
| Limitations | Vendors already auto-expand: Imagen's LLM rewriter is on by default ([Vertex](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/use-prompt-rewriter)). Double-expansion risk is untested. |
| Task categories | Image generation, video generation, design/UI mockups |
| SubText implementation | Slot-fill visual dimensions (subject, style, composition, lighting, text, aspect ratio, use), then offer **2–4 divergent variants** rather than one "perfect" prompt. Model-specific syntax for Midjourney-style parameters should come from a separately maintained table (not researched here). |
| Measure | User selection rate among variants; human preference vs. raw prompt; intent alignment. |

### T12. Iterative refinement, self-critique and verification

| Field | Content |
|---|---|
| What | The model critiques and revises its own output (Self-Refine), or generates verification questions and answers them independently (Chain-of-Verification, CoVe). |
| How | Draft → critique against criteria → revise, ideally as separate calls ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). CoVe: draft, plan verification questions, answer them *independently* of the draft, revise ([Dhuliawala et al.](https://arxiv.org/abs/2309.11495)). |
| Why it may help | Self-Refine reported about +20 points absolute on average across 7 tasks with GPT-3.5/4 ([Madaan et al.](https://arxiv.org/abs/2303.17651)). CoVe "decreases hallucinations" on list QA and long-form generation. |
| Use when | There are **external** criteria or feedback: a rubric, tests, a checklist, retrieved facts, execution results. Writing quality and style tasks. |
| Avoid when | Pure reasoning self-correction without external feedback. Huang et al. found LLMs "struggle to self-correct" reasoning intrinsically and sometimes get worse ([ICLR 2024](https://arxiv.org/abs/2310.01798)). |
| Limitations | Self-Refine's gains came on 2023 models and may overlap with what reasoning models now do internally (**Hypothesis**). A fresh-context reviewer beats self-review: Claude Code notes "a fresh reviewer does help, because it hasn't seen your reasoning." |
| Task categories | Writing, code (with tests), fact-heavy long-form, research |
| SubText implementation | Append a **success-criteria checklist** to generated prompts so the target model (or user) can verify against it. For coding, include runnable checks. Do not add "double-check your reasoning" boilerplate for math and logic tasks. |
| Measure | Checklist pass rate; hallucination rate with vs. without verification step. |

### T13. Automatic prompt optimisation (APE, OPRO, Promptbreeder, EvoPrompt, ProTeGi/APO, DSPy/MIPRO, GEPA, TextGrad, vendor optimisers)

| Method | Mechanism | Reported result (abstract) | Source |
|---|---|---|---|
| APE | LLM proposes instructions; select best by score | ≥ human on 19/24 tasks | [Zhou et al.](https://arxiv.org/abs/2211.01910) |
| OPRO | LLM sees past prompts and scores, proposes better ones | Up to +8% GSM8K, up to +50% BBH vs human prompts | [Yang et al., ICLR 2024](https://arxiv.org/abs/2309.03409) |
| ProTeGi / APO | Natural-language "gradients" from errors + beam search | Up to +31% over initial prompt | [Pryzant et al., EMNLP 2023](https://arxiv.org/abs/2305.03495) |
| EvoPrompt | Evolutionary operators via LLM | Up to +25% on BBH vs prior automatic methods | [Guo et al., ICLR 2024](https://arxiv.org/abs/2309.08532) |
| Promptbreeder | Self-referential evolution of task prompts and mutation prompts | Beats CoT and Plan-and-Solve on arithmetic and commonsense | [Fernando et al.](https://arxiv.org/abs/2309.16797) |
| DSPy | Declarative modules compiled into prompts and demos | >25% over few-shot (GPT-3.5); >65% (llama2-13b) | [Khattab et al.](https://arxiv.org/abs/2310.03714) |
| MIPRO | Joint instruction and demo optimisation for multi-stage programs | Beats baselines on 5/7 programs, up to +13% | [Opsahl-Ong et al., EMNLP 2024](https://arxiv.org/abs/2406.11695) |
| GEPA | Reflective prompt evolution with Pareto selection | +6% avg vs GRPO with up to 35× fewer rollouts; >10% vs MIPROv2 | [Agrawal et al., ICLR 2026](https://arxiv.org/abs/2507.19457) |
| TextGrad | Textual feedback "backprop" through a system | GPQA 51%→55% (GPT-4o); LeetCode-Hard +20% relative | [Yuksekgonul et al.](https://arxiv.org/abs/2406.07496) |
| OpenAI Prompt Optimizer | Fixes contradictions, format gaps, example mismatch | FailSafeQA robustness 0.320→0.540 (**Claimed**) | [OpenAI cookbook](https://developers.openai.com/cookbook/examples/gpt-5/prompt-optimization-cookbook) |

| Field | Content |
|---|---|
| What / How | Search over prompt text using a **scored dataset** as the objective. |
| Why it may help | It finds non-obvious phrasings and demos and beats hand-written prompts on benchmarks. |
| Use when | A repeated task (a production prompt) with a labelled dev set or reliable judge. |
| Avoid when | One-off end-user requests with **no dataset and no score**. That is SubText's main use case. Yang et al. found that standard optimisers give little benefit against underspecification ([arXiv 2505.13360](https://arxiv.org/abs/2505.13360)). |
| Limitations | Optimised prompts overfit to model and dataset, and orderings and phrasings do not transfer across models ([Lu et al.](https://arxiv.org/abs/2104.08786); [Sclar et al.](https://arxiv.org/abs/2310.11324)). Compute cost is high. Most results are on 2023–2024 models and benchmarks. |
| Task categories | Production prompts, classification, extraction pipelines, agent system prompts |
| SubText implementation | **Not in the end-user flow.** Use offline to optimise SubText's *own internal prompts* (slot extraction, question generation, prompt assembly) with DSPy/GEPA against a SubText eval set. A possible "pro" feature: optimise a user's recurring prompt against their examples. |
| Measure | Held-out eval score of internal prompts; cross-model transfer. |

### T14. Prompt rewriting / query rewriting for end users (central to SubText's value claim)

**Evidence table**

| Work | Setting | What was rewritten | Result I read | Label |
|---|---|---|---|---|
| Sarkar et al. 2025 (Microsoft) [arXiv 2503.16789](https://arxiv.org/html/2503.16789v2) | Real chatbot conversations where users were dissatisfied; retroactive simulation | User's ineffective turn, rewritten with conversation context | gpt-4o rewriting for gpt-4o: 68.6% win / 8.0% loss / 23.4% tie (gpt-4o judge). Seek-info domains ~72–77% win; Writing/Create 59.7%. o3-mini: 57.0%→66.1%. Longer conversations gave bigger gains. Small rewriters for themselves were *net negative* (llama-3-8B 23.8% win / 40.5% loss), but small rewriters feeding gpt-4o reached 45–52% win. Intent fully preserved in ~74% of rewrites. About 19% of rewrites gave worse responses. Some rewriters answered instead of rewriting. | Verified (full HTML) |
| BPO (Cheng et al., ACL 2024) [arXiv 2311.04155](https://arxiv.org/abs/2311.04155) | Trained prompt optimiser from human preference data | User prompt → better prompt, model-agnostic | Win rate +22% ChatGPT, +10% GPT-4. Beat PPO/DPO alignment; complementary to them | Verified (abstract) |
| Rephrase-and-Respond (Deng et al.) [arXiv 2311.04205](https://arxiv.org/abs/2311.04205) | LLM rephrases and expands the question before answering (1-step or 2-step) | The user's question | "Significant" gains across models; complementary to CoT (no numbers in abstract) | Verified (abstract) |
| PRewrite (Kong et al., Google) [arXiv 2401.08189](https://arxiv.org/abs/2401.08189) | RL-trained rewriter optimising downstream task performance | Under-optimised task prompts | Effective on benchmarks (no numbers in abstract) | Verified (abstract) |
| Prompt Expansion (Datta et al., Google) [arXiv 2312.16720](https://arxiv.org/html/2312.16720v1) | Text-to-image | Query → set of expanded prompts | Re-fine-tuned PE: MUSIQ aesthetics 6.185 vs 5.121 for straight query; diversity up; alignment **slightly lower** (0.113 vs 0.125), within confidence intervals. Explicit aesthetics/diversity-vs-alignment trade-off | Verified (HTML) |
| Promptist (Hao et al., NeurIPS 2023) [arXiv 2212.09611](https://arxiv.org/abs/2212.09611) | Text-to-image (Stable Diffusion) | User input → model-preferred prompt (SFT + RL) | Beat manual prompt engineering on automatic and human preference | Verified (abstract) |
| Query rewriting for RAG (Ma et al., EMNLP 2023) [arXiv 2305.14283](https://arxiv.org/abs/2305.14283) | Retrieval | Search query | Consistent improvements in open-domain and multiple-choice QA | Verified (abstract) |
| Google Imagen prompt rewriter [Vertex docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/use-prompt-rewriter) | Production image API | User prompt (<30 words returned) | **On by default.** Google warns that disabling it may reduce quality and prompt resemblance | Verified (vendor doc); quality effect Claimed |
| Underspecification (Yang et al.) [arXiv 2505.13360](https://arxiv.org/abs/2505.13360) | Prompts for LLM tasks | Requirements discovery | Models guess unspecified requirements correctly 41.1% of the time. Requirements-aware optimisation +4.8% avg; generic optimisers little benefit | Verified (abstract) |

**Synthesis (Verified facts → Hypotheses)**
- **Rewriting helps most when** (a) the original prompt is genuinely underspecified or ineffective, (b) context exists to infer the intent (longer conversations helped), (c) the task is information-seeking, and (d) the rewriter is at least as capable as the target. *Verified across Sarkar, BPO and Yang.*
- **Rewriting is risky when** it silently adds assumptions. About a quarter of Sarkar's rewrites did not fully preserve intent, and Prompt Expansion traded alignment for aesthetics. *Verified.* This supports SubText's **ask-before-rewrite** design: assumptions should be surfaced to the user, not inserted silently. *Hypothesis, to be tested by WS5/WS6.*
- **Gains shrink as models improve** (BPO: +22% → +10% from ChatGPT to GPT-4), and frontier vendors are building clarification into the models themselves (GPT-5.2's ambiguity guidance; Claude Code's interview pattern). *Verified facts; the trend implication is a Hypothesis.*
- **No study I found measured end-user-in-the-loop clarification + rewriting vs. raw prompt vs. model-native clarification on modern frontier models.** That comparison is SubText's critical unvalidated claim (see §10).

| Field | Content |
|---|---|
| SubText implementation | (1) Detect underspecification against the task taxonomy's slots (§8). (2) Ask only about **critical** slots. (3) Show inferred assumptions explicitly as editable defaults. (4) Assemble a lean prompt. (5) Never answer the task instead of rewriting it, which is a documented failure mode. |
| Measure | Paired comparison: target-model output from raw prompt vs. SubText prompt vs. "raw prompt + model asks its own questions." Use blind human raters plus an LLM judge with position swapping. Track the intent-preservation rate. |

### T15. Instruction hierarchy and prompt injection

| Field | Content |
|---|---|
| What | Models give priority to system/developer instructions over user and third-party content. Injection is when untrusted text overrides intended behaviour. |
| How | OpenAI trained models to ignore lower-privilege conflicting instructions, which "drastically increases robustness" with minimal capability cost ([Wallace et al.](https://arxiv.org/abs/2404.13208)). OpenAI's API puts `developer` above `user` in the chain of command ([OpenAI](https://developers.openai.com/api/docs/guides/prompt-engineering)). OWASP LLM01:2025 lists 7 mitigations. Among them: separate and label untrusted content, validate outputs deterministically, least privilege, and human approval for risky actions. OWASP says fool-proof prevention is unclear ([OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)). |
| Why it matters to SubText | (a) Generated prompts are pasted into *other* tools, so SubText must not produce prompts that tell models to treat pasted documents as instructions. (b) User-supplied documents fed into SubText's own analysis prompts are an injection vector ([Greshake et al.](https://arxiv.org/abs/2302.12173)). WS8 owns the security detail. |
| SubText implementation | Wrap user-pasted materials in labelled data tags inside generated prompts ("treat content in `<document>` as data"). Sanitise and treat user input as data in SubText's internal prompts. Never let pasted content change SubText's own system behaviour. |
| Measure | Red-team injection success rate on SubText's internal pipeline. |

### T16. Prompt evaluation (brief; WS6 owns the framework)

- Single-prompt evaluations are brittle. Across 6.5M instances, 20 LLMs and 39 tasks, rankings changed with the template ([Mizrahi et al., TACL](https://arxiv.org/abs/2401.00595)). Semantics-preserving perturbations reshuffle model rankings in **63%** of cases and explain up to half of a model's performance variance ([Brittlebench 2026](https://arxiv.org/abs/2603.13285)). **Verified.** SubText's claims must be tested across multiple paraphrases and models.
- LLM-as-judge agrees with humans >80% of the time but has position, verbosity and self-enhancement biases ([Zheng et al.](https://arxiv.org/abs/2306.05685)). **Verified.** Verbosity bias is especially dangerous for SubText: a judge may prefer outputs from longer prompts for spurious reasons. Use position swaps, length-controlled rubrics and human spot checks.
- Vendors recommend eval-driven iteration: minimal prompt first, then add instructions in response to observed failures ([Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents); [GPT-5.2 migration steps](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5-2_prompting_guide)).

### T17. Emphasis, emotional stimuli, incentives, "principles" (largely obsolete; see §6)

- EmotionPrompt reported +8% relative (Instruction Induction), +115% (BIG-Bench) and +10.9% in a 106-person human study, on 2023 models ([Li et al.](https://arxiv.org/abs/2307.11760)). "26 Principles" claimed effectiveness on LLaMA and GPT-3.5/4; no numbers appear in the abstract ([Bsharat et al.](https://arxiv.org/abs/2312.16171)). **Verified as claims for older models.**
- Later controlled studies find no reliable effect from tipping or threats ([Meincke et al. PSR3](https://arxiv.org/abs/2508.00614)). Politeness "sometimes helps... sometimes lowers performance" ([PSR1](https://arxiv.org/abs/2503.04818)). Vendors now advise against emphasis and incentives ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide); [Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); Gemini warns against "overly persuasive language"). **SubText should never insert these.**

---
## 4. Prompt sensitivity, and does prompt engineering matter less as models improve?

**Evidence that sensitivity was large on older models (Verified):** up to 76 accuracy points from formatting on LLaMA-2-13B ([Sclar et al.](https://arxiv.org/abs/2310.11324)); example order spanning from near-SOTA to random ([Lu et al.](https://arxiv.org/abs/2104.08786)); up to 40% from template format on GPT-3.5, with GPT-4 more robust ([He et al.](https://arxiv.org/abs/2411.10541)).

**Evidence that sensitivity persists on frontier models (Verified):** perturbations cost up to 12% and reorder model rankings 63% of the time, "across tasks, model scales, and reasoning settings" (per [Brittlebench](https://arxiv.org/abs/2603.13285), Feb–Oct 2026). Format perturbations were also evaluated on GPT-4.1 and DeepSeek V3 ([Seleznyov et al.](https://arxiv.org/abs/2508.11383); I could not read their numbers).

**Evidence that "technique" matters less (Verified):**
- Microsoft found the instruction-placement technique made no difference on GPT-4 in its example. Its docs also say these techniques "aren't recommended for reasoning models like gpt-5 and o-series" ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering)).
- o1-preview beat GPT-4 + Medprompt "even without prompting techniques" ([Nori et al.](https://arxiv.org/abs/2411.03590)).
- CoT value is decreasing ([PSR2](https://arxiv.org/abs/2506.07142)). Personas, tips and threats have no reliable effect ([PSR3](https://arxiv.org/abs/2508.00614), [PSR4](https://arxiv.org/abs/2512.05858)).
- Wharton's conclusion: whether a prompting approach helps is hard to predict in advance ([PSR1](https://arxiv.org/abs/2503.04818)).
- Claude Code's docs say a plain first prompt "already does the right thing" in most cases ([Claude Code](https://code.claude.com/docs/en/best-practices)).

**Evidence that *specification* still matters (Verified):** underspecification drives much of the remaining sensitivity ([Pecher et al. 2026](https://arxiv.org/abs/2602.04297)). Unspecified requirements are guessed correctly only 41.1% of the time ([Yang et al.](https://arxiv.org/abs/2505.13360)). Vendors uniformly ask for goals, context, constraints and success criteria.

**Synthesis (Hypothesis, well-supported):** The returns to prompt *engineering* (wording tricks, scaffolds, personas, CoT phrases) are falling fast. The returns to prompt *specification* (supplying information the model cannot know) are stable or rising, because more capable and more literal models execute a mis-specified request more faithfully. SubText's defensible value is in the second category only. A product that sells itself as "applying expert prompt techniques" is selling a declining asset.

---

## 5. Model-specific prompting conventions (current official docs, accessed 2026-11-13)

| Dimension | Anthropic Claude (Fable 5.2 / Opus 5.5 / Sonnet 5.5 / Haiku 5.5) | OpenAI (gpt-6-astra, gpt-6.1 family; GPT-5.x guides) | Google Gemini (4 / 3.6+) | Open models (DeepSeek-R1, Llama, Qwen) |
|---|---|---|---|---|
| **Section delimiters** | XML tags strongly recommended (`<instructions>`, `<context>`, `<example>`, `<document index>`). Prompt style influences output style ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)) | Markdown headers as starting point; XML also performs well; avoid JSON as a delimiter for long document sets ([GPT-4.1 guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)); Cursor found XML-style specs improved adherence ([GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)) | XML or Markdown; pick one and stay consistent ([Gemini](https://aistudio.google.com/docs/prompting-strategies)) | Markdown is safe. Format sensitivity is higher in smaller open models ([Sclar](https://arxiv.org/abs/2310.11324); [Seleznyov](https://arxiv.org/abs/2508.11383)) |
| **System prompt** | Role and behavioural rules in `system`. Instructions changed mid-conversation should go in the newest turn or mid-conversation system messages, because editing earlier turns breaks preserved thinking ([Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)) | `developer` messages / `instructions` rank above `user` ([OpenAI](https://developers.openai.com/api/docs/guides/prompt-engineering)). Structure: Identity → Instructions → Examples → Context | System instruction for persona, essential constraints and output format | Varies. R1 authors advise zero-shot, problem stated directly, output format specified ([R1](https://arxiv.org/html/2501.12948v2)) |
| **Long-context placement** | Documents at top, query and instructions at end ("up to 30%" in vendor tests). Quote relevant passages first | Instructions at both start and end are best. If only one, put them above the context (GPT-4.1). For >10k tokens, outline relevant sections and restate constraints (GPT-5.2) | Context first, instructions "at the very end," with a bridging phrase ("Based on the information above...") | Expect lost-in-the-middle effects ([Liu et al.](https://arxiv.org/abs/2307.03172)) |
| **Prefill** | **Removed.** Prefilled last assistant turn returns a 400 error from Claude 4.6 / Mythos onward. Use structured outputs, tool enums or direct instructions | Not a documented technique for chat models | Partial-output prefixes ("Output:", starting the list) are still recommended | Often supported via raw completion templates |
| **Structured outputs** | Structured outputs feature; tools with enum for classification | Structured Outputs (`json_schema`) enforces schema; JSON mode does not. Handle refusals and incomplete responses ([OpenAI SO](https://developers.openai.com/api/docs/guides/structured-outputs)) | Use structured-output features for complex JSON rather than prompt wording | Grammar-constrained decoding via inference servers (not researched in depth) |
| **Reasoning control** | `effort` (low/medium/high/xhigh/max); adaptive thinking is the only mode on newest models; `budget_tokens` errors from 4.7. Prompt text like "think hard" only nudges within effort ([Claude Code](https://code.claude.com/docs/en/best-practices)). Don't ask for reasoning in the response on Fable 5.2 (refusal category) | `reasoning.effort`. gpt-6-astra does not support `none` (use `low`). GPT-5.1/5.2 defaulted to `none`. Change effort mid-conversation with `configuration_update` ([OpenAI GPT-6](https://developers.openai.com/api/docs/guides/latest-model)) | Thinking is automatic. "Think very hard before answering" can help on hard tasks at a token cost. Gemini 4 ignores temperature, top_p and top_k (will error later) | Reasoning models (R1, Qwen thinking) reason natively. Do not add CoT |
| **Verbosity** | Prompt for it. Effort barely changes response length on Fable 5.2. Opus 5 runs long, so ask for concision. Style rules are followed very literally | `verbosity` API parameter controls final answer length; prompts can override per context ([GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)). GPT-6 tends toward lists, tables and Markdown, so specify prose if wanted | Gemini 3 defaults to concise; ask for detail explicitly | Prompt-based |
| **Examples** | 3–5 diverse examples in `<example>` tags recommended | Zero-shot first for reasoning models; few-shot for GPT (non-reasoning) models | "Always include few-shot examples" (Gemini docs), moderate count | Few-shot **degrades** R1 |
| **Emphasis / caps** | Avoid; causes overtriggering | Avoid all-caps and incentives (GPT-4.1); "Be THOROUGH" caused over-tooling (Cursor/GPT-5) | Avoid "overly persuasive language" | Untested |
| **Agentic defaults** | Newest models are proactive. Remove anti-laziness prompts. Name steps needing no approval; scope "never" rules | Bias to action and completion; models may over-test; audit AGENTS.md / skills | Not researched in depth | — |

**Cross-vendor constants (Verified):** be explicit; give context and reasons; delimit sections; specify output format; put long material and the query in deliberate positions; state success criteria; prefer API controls (effort, verbosity, schemas) over prompt text for things the API controls.

**Where vendors conflict (Verified):** few-shot (Gemini: always; OpenAI: zero-shot first for reasoning models; DeepSeek: avoid), prefill (Gemini prefixes vs. Anthropic removal), and instruction position for long context (OpenAI: top and bottom vs. Anthropic and Gemini: end). **SubText must render prompts per target model.** A single universal template will be wrong for at least one vendor.

**Volatility (Verified):** Anthropic currently maintains nine separate per-model prompting pages, each listing behaviour changes from the previous version (e.g. Fable 5.2 vs 5.1: "instructions to think less" no longer work; "treat that answer as done" lines suppress self-correction). The convention layer must be **versioned data with an owner**, re-checked on every major model release.

---

## 6. What is becoming obsolete (with evidence)

| Technique | Status | Evidence |
|---|---|---|
| "Let's think step by step" / forced visible CoT | **Unnecessary or harmful on reasoning models; can trigger refusal on Claude Fable 5.2** | [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning-best-practices); [PSR2](https://arxiv.org/abs/2506.07142); [Liu et al. 2024](https://arxiv.org/abs/2410.21333); [Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2); [Microsoft](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/concepts/prompt-engineering) |
| "Think hard / harder / be thorough" as a reasoning dial | Replaced by `effort` / `reasoning.effort` parameters | [Claude Code "What you can stop doing"](https://code.claude.com/docs/en/best-practices) |
| Few-shot examples by default | Harmful on reasoning models (o1, R1). Still useful for style and format on non-reasoning models | [Nori et al.](https://arxiv.org/abs/2411.03590); [R1](https://arxiv.org/html/2501.12948v2) |
| Expert personas for accuracy | No accuracy benefit; low-knowledge personas harmful | [Zheng et al.](https://arxiv.org/abs/2311.10054); [PSR4](https://arxiv.org/abs/2512.05858) |
| ALL CAPS / "CRITICAL" / "You MUST" | Causes overtriggering and over-application | [Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); [Claude Code](https://code.claude.com/docs/en/best-practices); [GPT-4.1](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide) |
| Tipping, threats, emotional stimuli | No significant effect on modern benchmarks | [PSR3](https://arxiv.org/abs/2508.00614) (vs. 2023 claims in [EmotionPrompt](https://arxiv.org/abs/2307.11760)) |
| Anti-laziness / "keep going, don't stop" | Causes over-work on current Claude. Still needed at low effort on Fable 5.2 and at GPT-5 minimal reasoning, so it is model- and effort-dependent | [Claude Code](https://code.claude.com/docs/en/best-practices); [Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2); [GPT-5](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide) |
| Assistant prefill for format or preamble control (Claude) | Removed (400 error) from Claude 4.6 | [Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) |
| Manual thinking budgets (`budget_tokens`) | Deprecated / errors from Claude 4.7 | Same |
| Temperature / top_p tuning (Gemini) | Ignored on Gemini 4 / 3.6+, errors planned | [Gemini](https://aistudio.google.com/docs/prompting-strategies) |
| Describing architecture and file layout in agent memory files | Agent reads the repo itself; only write what isn't there | [Claude Code](https://code.claude.com/docs/en/best-practices); [Cursor rules](https://cursor.com/docs/context/rules) |
| Aggressive context-window management / subagents "for a better answer" | 1M windows + auto-compaction; delegation doesn't improve answers (a fresh reviewer does) | [Claude Code](https://code.claude.com/docs/en/best-practices) |
| Long prescriptive system prompts | Outcome-first, lean prompts reported better and cheaper | **Claimed:** OpenAI GPT-5.6 via [secondary coverage](https://cryptobriefing.com/openai-gpt-56-prompting-guide-outcome-first/); Verified principle: [Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) |

**Still valuable (Verified):** clear goal and context; reasons behind rules; delimiters; output format specification and schemas; user-provided examples for style; long-context ordering; scope and preserve constraints; success criteria and runnable checks; decomposition for inspectable pipelines; grounding with citations; fresh-context review.

---

## 7. What a prompt-generation product should and should not put in generated prompts

### Should include (in rough priority order)

1. **The goal and the "why"**: what the output is for, who will use it, and what decision or action it supports. Verified basis: context and motivation guidance across all vendors.
2. **Context the model cannot see**: the user's situation, existing materials, prior attempts, constraints from their environment. Claude Code's core principle: "Tell Claude what it can't see" ([Claude Code](https://code.claude.com/docs/en/best-practices)).
3. **Audience and register** as an explicit field (not a persona).
4. **Scope and ambition**: minimal vs. comprehensive; what is in and out of scope; what must not change.
5. **Output specification**: format, length, structure, and whether software will parse it.
6. **Success criteria / definition of done**: checkable criteria; for code, a runnable check.
7. **User-supplied examples or references** labelled as style references (non-reasoning targets, or for tone).
8. **Surfaced assumptions**: defaults chosen for unanswered slots, stated so the target model and the user can see them.
9. **Clarification permission**: when material ambiguity remains, the generated prompt may say "If X is unclear, ask before proceeding." This aligns with GPT-5.2's 1–3 clarifying questions pattern.
10. **A separate settings note** (not prompt text) recommending model, effort or reasoning level, and tools such as web search.

### Should not include

| Anti-pattern | Why (evidence) |
|---|---|
| Overlong prompts and boilerplate | Length alone hurts by 13.9–85% ([Du et al.](https://arxiv.org/abs/2510.05381)); context rot ([Chroma](https://www.trychroma.com/research/context-rot)); lean prompts reported better (Claimed, GPT-5.6) |
| Long lists of rules | Adherence degrades with instruction count, with a bias toward early instructions ([IFScale](https://arxiv.org/abs/2507.11538)) |
| Contradictory or redundant instructions | GPT-5 spends reasoning resolving conflicts; removing them gave "large gains" for early users (Claimed, [GPT-5 guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)) |
| Grandiose personas | No accuracy gain ([Zheng](https://arxiv.org/abs/2311.10054); [PSR4](https://arxiv.org/abs/2512.05858)) |
| CoT incantations / requests to show reasoning | Unneeded on reasoning models; refusal risk on Claude Fable 5.2 |
| Emphasis, caps, threats, tips | Overtriggering; no benefit |
| Synthetic few-shot examples for reasoning targets | Degrade o1 and R1 |
| Silent assumptions | ~26% of rewrites did not fully preserve intent ([Sarkar](https://arxiv.org/html/2503.16789v2)) |
| Key instructions buried mid-prompt | Lost in the middle ([Liu et al.](https://arxiv.org/abs/2307.03172)) |
| Absolute "never" rules where the user meant a preference | Treated as absolute by current Claude ([Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)) |
| Strict output formats for reasoning-heavy tasks | Format restrictions reduce reasoning ([Tam et al.](https://arxiv.org/abs/2408.02442)) |
| Instructions to treat pasted documents as commands | Injection risk ([OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)) |

**Length heuristic (Hypothesis):** For a typical one-off request, target roughly 80–400 words of instruction text plus user-supplied material. Every sentence should encode information the target model could not infer. Test it with Anthropic's "colleague test": would a smart, low-context colleague be confused? ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)). Validate the band empirically (§10).

---
## 8. Task taxonomy of prompting requirements

**Design principles**
- There is no universal template. Each category defines its own **slots**, the information units that change the output.
- **Impact** ratings are **Hypotheses**: C = critical (missing it likely produces a wrong or unusable output), I = important (missing it noticeably degrades quality), N = nice-to-have. They come from vendor guidance, documented failure modes and the underspecification research. They must be validated per category (§10).
- **Defaults** are what SubText assumes when the user skips a slot. They are always surfaced to the user as editable assumptions.
- **Cross-cutting slots** apply to every category and are not repeated below: *goal/purpose*, *audience*, *output format/length*, *target model/tool*, *existing materials*, *success criteria*.
- **Model notes** refer to §5.

### 8.1 Software development: new build (feature or app from scratch)

| Slot | Impact | Default if unanswered |
|---|---|---|
| What it does: core user stories / features | C | Ask; never default |
| Target users and usage context | I | "Single user, small scale" |
| Tech stack / language / framework | C (if existing ecosystem) / I (greenfield) | Mainstream stack for platform; state the assumption |
| Existing codebase and patterns to follow | C when one exists | "Greenfield" |
| Scope and ambition (MVP vs. full) | C | MVP, but list deferred items |
| Constraints: no new deps, performance, security, budget | I | "Minimise dependencies" |
| Definition of done / tests | I | "Include basic tests and run instructions" |
| Data and integrations (auth, DB, APIs) | I | Ask if it involves accounts or payments |
| Deployment target | N | "Local run instructions" |

- **Failure modes when slots are missing:** wrong stack; over-built or under-built scope (GPT-5.2 over-produces code; Claude builds minimal unless told "be ambitious"); invented requirements; no way to verify.
- **Structure:** goal → users → features (prioritised) → stack and constraints → out of scope → definition of done → output (files, run instructions). Consider a two-stage pack: spec, then build (T2).
- **Techniques:** T1, T2, T5, T9 (runnable checks). No CoT phrases.
- **Model notes:** Claude: "be ambitious" if full-featured is wanted; ownership sentence changes refactoring behaviour (Fable 5.2). OpenAI: add scope discipline ("implement only what was requested").

### 8.2 Software: debugging

| Slot | Impact | Default |
|---|---|---|
| Symptom: actual vs. expected behaviour | C | Ask |
| Error messages / logs / stack trace (verbatim) | C | Ask user to paste |
| Reproduction steps | I | "Ask model to propose a repro" |
| Relevant code / file locations | C | Ask for file paths or snippet |
| Environment (versions, OS, runtime) | I | Ask only if error suggests env issue |
| What has been tried | I | "Nothing yet" |
| Fix constraints (minimal change, no refactor) | I | "Minimal fix; explain root cause" |

- **Failure modes:** model guesses at cause; fixes symptom not root cause; large unrequested rewrites; hallucinated APIs.
- **Structure:** symptom → evidence (logs in tags) → code → tried → constraints → "write a failing test that reproduces it, then fix" (Claude Code pattern).
- **Techniques:** T4 (paste only relevant code), T5, T9, T12 with external feedback (tests).
- **Model notes:** Effort high for bugs in unfamiliar code (Claude Code effort guidance).

### 8.3 Software: refactor

| Slot | Impact | Default |
|---|---|---|
| Refactor goal (readability, performance, modularity, migrate) | C | Ask |
| Code in scope / boundaries | C | Ask |
| Behaviour must not change? Test coverage? | C | "Preserve behaviour exactly; add tests first if missing" |
| Style conventions / target patterns | I | "Follow existing repo conventions" |
| Allowed breaking changes (API, schema) | I | "None" |
| Ownership/latitude | I | "Minimal, scoped changes" |

- **Failure modes:** behaviour changes; drive-by edits; inconsistent patterns.
- **Model notes:** On Claude Fable 5.2 an ownership sentence makes consolidation much more likely (about 75% vs. under 10% in Anthropic tests). It also adds unrequested changes. Omit it when the user wants minimal change ([Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2)).

### 8.4 Software: code review

| Slot | Impact | Default |
|---|---|---|
| Code / diff | C | — |
| Review focus (correctness, security, performance, style) | I | Correctness + security first |
| Context: purpose of change, spec | I | Ask for PR description |
| Standards / conventions | N | Language-community defaults |
| Output format (severity-ranked findings, line refs) | I | Severity-ranked list with file:line and suggested fix |
| Strictness / number of findings | N | "High-confidence findings only" |

- **Failure modes:** nitpick floods; false positives; missing the actual intent of the change.
- **Techniques:** role as perspective ("skeptical reviewer"), T6 output format, fresh-context review (T12).

### 8.5 Agentic / "vibe coding" tool prompts (Lovable, Cursor, Claude Code, Codex, Replit)

| Slot | Impact | Default |
|---|---|---|
| Product goal and core flows | C | Ask |
| Current state of the project (new vs. existing; what works) | C | Ask |
| The single change for this prompt (incremental) | C | Split into steps |
| What must not change (preserve-list) | C (existing project) | "Keep existing styling/behaviour" |
| Design direction (style keywords, references) | I | Ask for 2–3 adjectives or a reference |
| Data / auth / backend needs | I | Ask if accounts, payments or data storage |
| Verification (how to tell it worked) | I | "Describe how to test manually" |
| Approval boundaries (destructive ops) | I | "Ask before deleting data or schema changes" |

- **Failure modes:** a giant one-shot prompt builds everything badly; regressions to working parts; generic "AI slop" design ([Claude frontend guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)); agents re-discovering context each session.
- **Structure:** context → this step's goal → specific location/scope ("only the orders page") → preserve-list → design notes → done-check. Lovable recommends component-by-component building and "one meaningful change at a time" ([Lovable](https://docs.lovable.dev/prompting/prompting-one)).
- **Persistent-context artefacts:** SubText could generate project knowledge files (Lovable project instructions, `.cursor/rules`, `CLAUDE.md`, `AGENTS.md`). Keep them short: Cursor says "under 500 lines" ([Cursor](https://cursor.com/docs/context/rules)), and Claude Code says only what the agent can't infer ([Claude Code](https://code.claude.com/docs/en/best-practices)).
- **Model notes:** Tool-specific. Many tools already have plan modes and clarifying-question modes (Lovable Plan mode; Claude Code's "interview me"). **Disconfirming:** SubText overlaps with native features here.

### 8.6 Academic research, study and learning

Two sub-types share slots: **(a) learning/tutoring** ("help me study ML") and **(b) research assistance** (literature review, paper analysis).

| Slot | Impact | Default |
|---|---|---|
| Learning goal / research question | C | Ask |
| Current level / prior knowledge | C (learning) | "Intermediate undergraduate" (surface it) |
| Purpose (exam, project, curiosity, publication) | I | "Conceptual understanding" |
| Time available / deadline / depth | I | "~2 weeks, few hours/week" for plans |
| Preferred learning mode (explanations, exercises, Socratic, flashcards) | I | Mix: explain → example → practice |
| Sources: provided materials, required citation style | C (research) | "Cite verifiable sources; flag uncertainty" |
| Field conventions / academic level | I | Ask |
| Integrity constraints (no ghostwriting graded work) | I | Tutor mode for assignments |

- **Failure modes:** level mismatch (too basic or too advanced); fabricated citations; passive summaries instead of active learning; plans without milestones.
- **Techniques:** T3 as audience ("explain to someone who knows linear algebra but not probability"), T10 grounding and citations, T2 (plan → module), self-check quizzes.
- **Model notes:** recommend web/search-enabled modes for literature; Claude research prompt pattern (hypotheses, confidence tracking).

### 8.7 Writing: professional email

| Slot | Impact | Default |
|---|---|---|
| Recipient and relationship (boss, client, stranger) | C | Ask |
| Purpose / desired action from recipient | C | Ask |
| Key facts to include | C | Ask (cannot be inferred) |
| Tone (formal, warm, firm, apologetic) | I | Professional, warm, concise |
| Length | I | Under 150 words |
| Context / history (thread) | I | Ask to paste prior thread |
| Sender's voice sample | N | Neutral professional |
| Constraints (don't mention X, deadline) | I | — |

- **Failure modes:** generic filler; wrong tone for relationship; missing the ask; invented facts (dates, figures).
- **Structure:** short. Context → purpose → facts → tone → length → "use placeholders for unknown facts."
- **Techniques:** T1, T7 (voice sample if available). Avoid personas. This is often over-served by a heavy flow, so SubText's question budget should be **1–3 questions max** (Hypothesis).

### 8.8 Writing: long-form (reports, articles, essays, documentation)

| Slot | Impact | Default |
|---|---|---|
| Topic and thesis / key message | C | Ask |
| Audience and their knowledge | C | Informed generalist |
| Purpose (inform, persuade, document) | C | — |
| Length and structure | I | ~1,200 words, headed sections |
| Sources / material to draw on | C (factual) | Ask; otherwise flag uncertain claims |
| Voice / style examples | I | Clear, plain, active voice |
| Must-include points / exclusions | I | — |
| Publication venue conventions | N | — |

- **Failure modes:** generic, unfocused pieces; fabricated facts; excessive bullets (Claude/GPT formatting defaults); padded length.
- **Techniques:** T2 (outline → draft → revise against checklist), T4 (sources first, task last), T12 with rubric, prose-format instructions ([Claude formatting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)).

### 8.9 Writing: marketing copy

| Slot | Impact | Default |
|---|---|---|
| Product/offer and key differentiator | C | Ask |
| Target customer and their pain | C | Ask |
| Channel and format (landing page, ad, email, social) with limits | C | Ask |
| Desired action (CTA) | C | — |
| Brand voice (examples) | I | Ask for 1–2 samples |
| Proof points (data, testimonials) | I | Placeholders, never invent |
| Compliance constraints (claims, regulated industry) | I (C in regulated) | "No unverifiable claims" |
| Number of variants | N | 3 variants |

- **Failure modes:** generic hype; fabricated stats and testimonials; wrong length for channel; brand voice mismatch.
- **Techniques:** T7 (voice examples), variants, T5 (channel limits).

### 8.10 Creative work (fiction, poetry, scripts, worldbuilding)

| Slot | Impact | Default |
|---|---|---|
| Form and length | C | Ask |
| Premise / core idea | I | Offer options |
| Genre, tone, mood | I | Ask |
| Audience / age rating | I | General adult |
| Style references (authors, works, user samples) | I | — |
| Constraints (POV, tense, must-include elements) | N | — |
| Degree of creative latitude | I | "Take creative risks within constraints" |

- **Failure modes:** clichéd, "on-distribution" output; over-constrained prompts kill originality; tone mismatch.
- **Notes:** This category benefits **least** from rewriting (Sarkar: Writing/Create 59.7% win vs. ~75% for info-seeking). Over-specification may reduce diversity (Prompt Expansion trade-off). SubText should ask fewer questions and offer divergent directions (Hypothesis).

### 8.11 Business strategy and market research

| Slot | Impact | Default |
|---|---|---|
| Business/product description and stage | C | Ask |
| Decision the research informs | C | Ask |
| Market/geography/segment | C | Ask |
| Known competitors / current knowledge | I | — |
| Time horizon and budget/resources | I | — |
| Required evidence standard (cite sources, data recency) | C | "Cite sources; flag estimates; note data dates" |
| Output (memo, SWOT, sizing, slide outline) | I | Decision memo with recommendations and risks |
| Biases to avoid (seek disconfirming evidence) | I | "Include counter-evidence" |

- **Failure modes:** fabricated market sizes and statistics; generic frameworks with no specificity; stale data; confirmation bias.
- **Techniques:** T10 (search-enabled, citations), T2, research prompt with competing hypotheses ([Claude docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)), T12 CoVe-style verification of figures.
- **Model notes:** recommend research or deep-research modes; GPT-5.2 web-research guidance (set research bar, stop when marginal value is low).

### 8.12 Data analysis

| Slot | Impact | Default |
|---|---|---|
| The question / hypothesis | C | Ask |
| Data description (schema, size, format, sample rows) | C | Ask for header + few rows |
| Tooling (Python/pandas, SQL dialect, Excel, BI) | C | Python + pandas |
| Definitions (metrics, time windows, filters) | C | Ask for ambiguous metrics |
| Data quality issues known | I | "Check and report nulls/outliers" |
| Output (code, chart, table, narrative) | I | Code + brief interpretation |
| Statistical rigour expected | I | Note assumptions and limitations |

- **Failure modes:** wrong metric definitions; hallucinated columns; invalid statistics; analysis that answers a different question.
- **Techniques:** T6 (schemas, tables), T4, T9 (code execution tool), T12 with execution feedback.

### 8.13 Design / UI generation

| Slot | Impact | Default |
|---|---|---|
| Screen/component and its purpose | C | Ask |
| Users and primary task | I | — |
| Platform and constraints (web/mobile, framework, design system) | C | Responsive web, existing design system if any |
| Visual direction (adjectives, references, brand colours, typography) | I | Ask for 2–3 adjectives |
| Content (real copy vs. placeholder) | I | Realistic copy, not lorem ipsum ([Lovable](https://docs.lovable.dev/prompting/prompting-one)) |
| States (empty, error, loading) and accessibility | I | Include states; WCAG AA |
| Interactions/animation | N | Subtle |

- **Failure modes:** generic "AI slop" aesthetics (Inter, purple gradients) per [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); invented tokens and colours (GPT-5.2 frontend scope warning); missing states.
- **Model notes:** Claude frontend aesthetic guidance; OpenAI: forbid invented colours and tokens when a design system exists.

### 8.14 Image generation prompts

| Slot | Impact | Default |
|---|---|---|
| Subject | C | Ask |
| Intended use (ad, icon, UI mock, illustration, photo) | I | — |
| Style / medium (photo, illustration, 3D, painting) | I | Ask or offer variants |
| Composition / framing / viewpoint | I | Default to model |
| Lighting / mood / palette | N | — |
| Exact text in image (quoted) | C if any | — |
| Aspect ratio / size / transparency | I | 1:1 |
| Exclusions / preserve-list (for edits) | I | "No watermark/extra text" |

- **Structure:** scene/background → subject → details → constraints; text in quotes ([OpenAI image guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)).
- **Notes:** offer multiple variants. Be aware that platforms auto-rewrite (Imagen rewriter on by default).

### 8.15 Video generation prompts

| Slot | Impact | Default |
|---|---|---|
| Subject and action | C | Ask |
| Scene / setting / time | I | — |
| Camera angle and movement | I | Static or slow dolly |
| Visual style, lighting, mood | I | — |
| Duration / pacing | I | Model default |
| Audio (dialogue, SFX, ambience) in separate sentences | I (if audio model) | "No dialogue" |
| Negative elements as noun list | N | — |

- Source: [Veo guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide).

### 8.16 Personal / life advice (career, relationships, health-adjacent, finance-adjacent)

| Slot | Impact | Default |
|---|---|---|
| Situation and what has happened | C | Ask |
| What the user wants (decision, perspective, plan, emotional support) | C | Ask; this changes the response type |
| Constraints and values | I | — |
| Prior attempts | N | — |
| Risk flags (safety, medical, legal, financial) | C | Recommend professional help where appropriate |

- **Failure modes:** generic platitudes; advice when the user wanted support (or the reverse); missing safety escalation.
- **Notes:** high privacy sensitivity (WS8). Questions should be gentle and few. This is the category where an interrogation-style flow is most likely to feel intrusive (Hypothesis; WS4/WS5).

### 8.17 Other important categories (brief)

| Category | Critical slots | Key technique notes |
|---|---|---|
| **Summarisation / document Q&A** | Source document; purpose of summary; audience; length | Document first, query last; quote-then-answer; "say not found" out |
| **Decision support / comparisons** (products, options) | Options; criteria and weights; constraints (budget); must-haves | Table output; ask for criteria the user cares about; disclose recency limits |
| **Job applications** (CV, cover letter) | Target role/JD; user's real experience; tone | Never fabricate experience; JD + CV as tagged inputs |
| **High-stakes info** (medical, legal, financial) | Jurisdiction; specifics; purpose (understand vs. act) | Grounding, citations, uncertainty flags, professional referral; self-check for unstated assumptions (GPT-5.2) |
| **Building system prompts / custom assistants** (meta) | Assistant's job; users; tools; boundaries; examples of good and bad responses | Lean "right altitude" prompts; test with evals; this is SubText's most expert-user category |
| **Translation / localisation** | Source/target language and locale; register; domain glossary; what not to translate | Glossary as structured input; examples of preferred terminology |

### 8.18 Knowledge-base schema (implementable example for two categories)

```yaml
# Schema notes:
#   impact: critical | important | nice_to_have   (hypothesised; to be calibrated)
#   ask_policy: always | if_missing | infer_then_confirm | never_ask (use default silently but surface it)
#   question: user-facing wording (no prompt-engineering jargon)
#   default: value used if skipped; always shown as an editable assumption
#   render: how the slot appears in the generated prompt (per-vendor overrides allowed)

category: professional_email
version: 0.1
detect_signals: ["email", "reply to", "write to my boss", "follow up with"]
question_budget: { max: 3, stop_when: "all critical slots filled or user skips" }
slots:
  - id: recipient_relationship
    impact: critical
    ask_policy: if_missing
    question: "Who is this going to, and what's your relationship? (e.g., your manager, a new client)"
    default: null            # no safe default -> must ask or leave placeholder
    failure_if_missing: "Wrong formality and tone"
  - id: desired_action
    impact: critical
    ask_policy: if_missing
    question: "What do you want them to do after reading it?"
    default: null
  - id: key_facts
    impact: critical
    ask_policy: infer_then_confirm
    question: "Any specific details it must include (dates, numbers, names)?"
    default: "Use [PLACEHOLDER] for any unknown facts; do not invent"
  - id: tone
    impact: important
    ask_policy: infer_then_confirm
    options: [warm_professional, formal, firm, apologetic, friendly]
    default: warm_professional
  - id: length
    impact: important
    ask_policy: never_ask
    default: "under 150 words"
  - id: thread_context
    impact: important
    ask_policy: if_missing
    question: "Is this a reply? If so, paste the message you're replying to."
    default: "New email (no prior thread)"
  - id: voice_sample
    impact: nice_to_have
    ask_policy: never_ask     # offered as optional field in UI
techniques: [explicit_instructions, placeholders_for_unknowns, style_reference_if_given]
exclude_techniques: [persona, chain_of_thought, few_shot_synthetic]
structure:
  claude: |
    <context>{thread_context}</context>
    Write an email to {recipient_relationship}. Goal: {desired_action}.
    Include: {key_facts}. Tone: {tone}. Length: {length}.
    {voice_sample ? "<style_reference>...</style_reference> Match its tone, not its content." }
  openai: "Markdown sections: # Context / # Task / # Requirements"
eval:
  rubric: [action_clear, tone_matches_relationship, no_invented_facts, length_ok]

---
category: software_debugging
version: 0.1
detect_signals: ["bug", "error", "not working", "crash", "exception", "fails"]
question_budget: { max: 4 }
slots:
  - id: symptom
    impact: critical
    ask_policy: if_missing
    question: "What happens, and what did you expect to happen?"
  - id: error_output
    impact: critical
    ask_policy: if_missing
    question: "Paste the exact error message or log output, if any."
    render: { claude: "<error_log>{value}</error_log>", openai: "```\n{value}\n```" }
  - id: code_location
    impact: critical
    ask_policy: if_missing
    question: "Which file(s) or code is involved? Paste the relevant part or give paths."
  - id: environment
    impact: important
    ask_policy: infer_then_confirm
    default: "Not specified; ask model to note version-dependent assumptions"
  - id: attempts
    impact: important
    ask_policy: if_missing
    question: "What have you already tried?"
    default: "Nothing yet"
  - id: change_scope
    impact: important
    ask_policy: never_ask
    default: "Minimal fix; explain root cause; no unrelated refactors"
  - id: target_tool
    impact: important
    ask_policy: infer_then_confirm
    options: [chat_assistant, claude_code, cursor, codex, other]
techniques: [context_selection, scope_constraints, runnable_check]
conditional:
  - if: "target_tool in [claude_code, cursor, codex]"
    add: "Write a failing test that reproduces the bug, then fix it and run the tests."
  - if: "target_model.reasoning == false"
    add: "Before proposing a fix, list the most likely causes and how to confirm each."
exclude_techniques: [persona_expert, emphatic_language, think_step_by_step_on_reasoning_models]
settings_note:
  claude: "effort: high for unfamiliar code"
  openai: "reasoning.effort: medium-high"
eval:
  rubric: [root_cause_identified, fix_minimal, test_added, no_hallucinated_api]
```

---
## 9. Implications for SubText's prompting engine (Hypotheses grounded in §§3–8)

1. **Position as a specification and elicitation engine, not a technique engine.** The evidence that technique matters is weakening (§4). The evidence that specification matters is strong (Yang; Pecher; all vendors).
2. **Render per target model from a versioned conventions table** (§5). Minimum targets: Claude (XML), OpenAI (Markdown/developer message), Gemini, plus agentic tools (Claude Code, Cursor, Lovable) and image/video generators. Assign an owner and re-verify on every major model release. Anthropic shipped nine model-specific guides in about a year.
3. **Default technique policy:** include goal, context, audience, constraints, output format, success criteria and surfaced assumptions. Exclude personas, CoT phrases, emphasis and synthetic few-shot unless a rule fires (e.g. a non-reasoning target on a math task).
4. **Lean output with a length budget** and a "does every sentence add information?" pass (§7).
5. **Surface assumptions; never silently expand.** Rewriters lose intent in about a quarter of cases (Sarkar).
6. **Prefer staged prompt packs for big tasks** (spec, then build), matching how agentic tools are now used.
7. **Settings notes outside the prompt** (effort, reasoning, search, model) because these controls have moved into APIs.
8. **Use automatic prompt optimisation (DSPy/GEPA) internally** on SubText's own pipeline prompts, not on end-user one-offs.
9. **Calibrate question budgets per category.** High for builds, research and strategy. Low for email, creative work and personal advice. Rewriting gains are smallest for creative tasks.

---

## 10. Unresolved questions and validation experiments

### Unresolved questions (could not be established with evidence)

1. **Does user-in-the-loop clarification + structured prompt generation beat (a) the raw prompt and (b) the frontier model's own clarifying questions on 2026 models?** No study found. This is the critical claim.
2. **How large is the gain on the strongest current models** (Claude Fable 5.2, gpt-6-astra, Gemini 4)? Evidence shows the gain shrinking with model strength (BPO; Sarkar's o3-mini +9 points). No 2026 measurement found.
3. **Optimal prompt length band per category** for current models. The 80–400 word heuristic is untested.
4. **Primary OpenAI GPT-5.6 / GPT-6 prompting guidance numbers** (the 10–15% eval gain and 41–66% token reduction from lean prompts) come from secondary coverage only.
5. **Double-rewriting risk:** what happens when a SubText-expanded prompt is fed into a platform that auto-rewrites (Imagen rewriter, possibly others)?
6. **Slot-impact calibration:** the C/I/N ratings in §8 are hypotheses. Which slots actually move output quality per category?
7. **Whether few-shot style references help or hurt on current reasoning models for *writing* tasks**, as opposed to the accuracy tasks studied by Nori and DeepSeek.
8. **DALL·E 3's caption-upsampling evidence** (not readable: PDF too large) and Midjourney/Flux-specific conventions (not researched).

### Validation experiments (handoff to WS6 for harness design)

| # | Experiment | Design | Success threshold (proposal) |
|---|---|---|---|
| E1 | **Core value test** | 150 real vague requests across 10 taxonomy categories. Arms: raw prompt; raw + "ask me clarifying questions first" (model-native); SubText flow (simulated user answering from a hidden persona brief, plus a real-user subset); one-shot silent rewrite (BPO-style). Target models: one current flagship per vendor. Blind pairwise human rating plus LLM judge with position swap and length control. | SubText beats model-native clarification by ≥10 pp win rate in ≥6/10 categories, with intent preservation ≥90% |
| E2 | **Technique ablation** | Same SubText prompts with and without persona, CoT line, emphasis, and few-shot style refs, per target model | Confirms §6 exclusions. Any technique that does not improve the score is removed |
| E3 | **Length curve** | Generate prompts at 3 length budgets (short, medium, long) holding information constant | Identify the knee per category; verify that longer is not better |
| E4 | **Slot-impact calibration** | For each category, drop one slot at a time from a fully specified prompt; measure the quality delta | Re-rank slots C/I/N empirically; prune low-impact questions |
| E5 | **Cross-model rendering** | Same brief rendered in Claude-XML vs. Markdown vs. vendor-native style for each vendor | Measures whether per-vendor rendering is worth maintaining |
| E6 | **Assumption surfacing** | Silent defaults vs. surfaced editable defaults; measure user edits and intent preservation | Surfaced defaults reduce intent violations without raising abandonment |
| E7 | **Robustness** | Paraphrase each user request 3× and check output-quality variance with vs. without SubText ([Brittlebench](https://arxiv.org/abs/2603.13285) method) | SubText reduces variance (expected from the underspecification literature) |
| E8 | **Creative-category check** | Diversity and preference for creative and image tasks: single optimised prompt vs. 3 divergent variants | Validates the "variants over one perfect prompt" design |

---

*End of report. Full source list with reliability ratings: [`sources/WS2_sources.md`](sources/WS2_sources.md).*
