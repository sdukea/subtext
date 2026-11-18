# 05 — User Research (WS3: Behavioural + Conversational UX Research, user side)

**Workstream:** WS3 · **Date:** 2026-11-13 · **Sources file:** [`sources/WS3_sources.md`](sources/WS3_sources.md)

> **Method disclosure.** No interviews, surveys, diary studies or usability tests were conducted for this report. Everything here comes from published research, platform usage reports, surveys and public user discussions. Where evidence is missing I state a **hypothesis** and a **validation experiment**. Labels: **Verified** = I read the primary source (or the relevant part of it); **Claimed** = vendor or self-reported data I read but cannot check independently; **Hypothesis** = my inference; `[snippet only]` = I only saw a search snippet or secondary summary, not the source. WebSearch ran out of budget late in the work (200-call per-turn cap shared across agents). Some sources (HEPI full report, Figma AI report, Springer/PMC automation-bias reviews, ACM DL pages) returned 403/blocked responses and are marked accordingly.

---

## 0. Summary of key findings

1. **The core hypothesis ("users know what they want but can't articulate it") is partly true, and it is not the main story.** The evidence fits a **mixed model**. (a) A large minority of real prompts are underspecified, and when users do clarify, it works. (b) For many tasks, intent *forms through* iteration on outputs, and the most experienced users iterate *more*, not less. (c) Most everyday usage is low-stakes asking, where a vague prompt is good enough. The product thesis covers (a) well, fights (b), and is unnecessary for (c).
   - Underspecification is common. >23% of OpenAssistant queries were judged "severely under-specified" ([Herlihy et al., Microsoft Research](https://microsoft.com/en-us/research/uploads/prodnew/2024/06/Overcoming_RLHF.pdf), **Verified**). About 1 in 6 advice-seeking first turns in WildChat/LMSYS/ShareChat are "long-form but information-poor", and another ~14% are "vague + situated" ([Baek et al., Findings of EMNLP 2026](https://aclanthology.org/2026.findings-emnlp.933.pdf), **Verified**).
   - Intent misunderstanding is the **most frequent** cause of dissatisfaction with ChatGPT replies (32% of dissatisfying responses). "Intent concretization" is the **most effective** user fix (~67% resolved when used). Yet 34% of dissatisfactions get no fix attempt and 72% stay unresolved ([Kim et al., IUI 2024](https://arxiv.org/html/2311.07434v3), **Verified**). This is the strongest single piece of evidence *for* the thesis.
   - High-tenure Claude users iterate more and are "much less likely" to use directive (one-shot delegation) patterns, and they have ~3–5 pp higher task success ([Anthropic Economic Index, Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report), **Verified**). In NN/g's study, multistep iteration was "nearly universal" ([NN/g, 2023](https://www.nngroup.com/articles/accordion-editing-apple-picking/), **Verified**). This is the strongest evidence *against* an upfront-specification-only product.
2. **Most AI usage is in categories where prompt quality hurts least.** In ChatGPT, 49% of messages are *Asking* and 40% *Doing*. Practical Guidance, Seeking Information and Writing make up ~77–80% of usage, and **about two-thirds of Writing requests modify text the user supplied**, so the context is already present ([Chatterji et al., NBER w34255](https://www.nber.org/papers/w34255), **Verified**). 73% of messages are non-work. 77% of users say they get a satisfying answer in under two minutes ([Rev/Centiment survey, 2025](https://www.rev.com/blog/ai-results), **Claimed**). The pain is concentrated in **long-running, high-stakes, hard-to-reverse "Doing" tasks**: deep research, agentic coding, multi-page documents, strategy and plans.
3. **Clarifying questions help only when they are good, and bad ones do measurable harm.** In web search, high-quality clarifying questions raise satisfaction and low-quality ones "do disturb users" ([Zou et al., 89 participants](https://irlab.science.uva.nl/wp-content/papercite-data/pdf/zou2022asking.pdf), **Verified**). In a product-search study, users answered roughly 11–21 relevant questions before stopping, and 12–17% of answers were wrong ([Zou, Kanoulas & Liu 2020](https://arxiv.org/abs/2008.00279), **Verified**). In a 30-person study, clarification raised trust but also cognitive overhead, and its benefit grew with task uncertainty and output irreversibility ([UC Berkeley MIMS 2026](https://www.ischool.berkeley.edu/projects/2025/ask-or-after-clarification-timing-and-user-experience-generative-ai), **Verified**, student project). Users preferred open-ended, "thought-provoking" questions to plain information-gathering ([Tix 2024](https://arxiv.org/abs/2407.12017), **Verified**).
4. **Conversational elicitation buys data quality at a time cost.** Chatbot surveys produce less satisficing and richer open-ended answers ([Kim, Lee & Gweon CHI 2019](https://soominkim.github.io/project/CHI2019_KIM_Comparing.pdf); [Xiao et al. TOCHI 2020](https://arxiv.org/abs/1905.10700), both **Verified**). But the chatbot took **~53% longer** (26m44s vs 17m30s). On mobile, one-question-per-page (paging) designs took **twice as long** as scrolling designs and were rated slightly lower ([Mavletova & Couper 2014](https://publications.hse.ru/mirror/pubs/share/folder/nssh3n1258/direct/164995078), **Verified**). For a tool whose value is saving time, this argues for **batched, skippable questions with defaults**, not a one-at-a-time interview.
5. **Automated prompt rewriting is not a free lunch.** In a 3,750-participant preregistered experiment, users' own prompt adaptation produced about half the gains from a model upgrade on a fixed-goal task. Misaligned automated rewriting "can actively undermine" those gains ([Jahani et al. 2024](https://arxiv.org/abs/2407.14333), **Verified**). This supports *eliciting* intent over *guessing* it. It is also a warning that a generated prompt which drifts from intent destroys value.
6. **User habits are sticky and skill improves slowly.** Individual Copilot users change their behaviour far less than population averages suggest: "user habits are sticky and resistant to change" ([Hicke & Tomlinson 2026](https://arxiv.org/html/2605.29018v1), **Verified**). Only 39% of AI-using knowledge workers had received training, and 78% bring their own AI to work ([Microsoft WTI 2024](https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part), **Claimed**). Adobe's rubric scored the average prompt 57/100, and 54% of Gen Z rated themselves 4–5/5 but scored 56 ([Adobe via PPC Land, 2026](https://ppc.land/adobe-study-91-of-marketers-abandon-ai-tasks-due-to-bad-prompts/), **Claimed**, secondary). The prompt-quality gap is durable, but the same stickiness makes **switching to a separate tool the biggest adoption barrier**.
7. **Willingness to pay is structurally weak.** Only ~3% of consumer AI users pay for premium services ([Menlo Ventures 2025](https://menlovc.com/perspective/2025-the-state-of-consumer-ai/), **Claimed**). Prompt help is also being absorbed into the assistants themselves: Deep Research asks clarifying questions by default, and Anthropic ships a prompt improver (WS1 owns the detail). **Hypothesis:** WTP exists, if at all, among power users and professionals who run repeatable or high-stakes workflows, not among students or general consumers.

**Bottom line for the product thesis (Hypothesis, medium confidence):** the evidence does not support a general consumer "prompt improver that interviews you first". It weakly-to-moderately supports a **narrow, in-context clarification layer** for high-stakes, long-running tasks, where (i) a misread intent is costly, (ii) questions are few, batched, skippable and high-quality, and (iii) the user sees a draft early so they can *recognise* rather than *describe* what they want. Whether that is a standalone product or a feature that platforms will absorb is the key strategic question (see WS1/WS7).

---

## 1. Competing hypotheses: what is actually going on when users write vague prompts?

| # | Hypothesis | Evidence for | Evidence against | Verdict (confidence) |
|---|---|---|---|---|
| H0 | **Users know what they want but can't articulate it** (core thesis) | Intent misunderstanding is the top dissatisfaction type (32%), and *concretizing* intent is the most effective fix ([Kim et al. 2024](https://arxiv.org/html/2311.07434v3)). Nielsen's "articulation barrier": roughly half of adults in rich countries are low-literacy (PIAAC), and he *estimates* (opinion, not measured) that <20% can write prompts well enough for advanced use ([Nielsen 2023](https://jakobnielsenphd.substack.com/p/prompt-driven-ai-ux-hurts-usability)). The "vague + situated" and "long but information-poor" styles exist in ~30% of advice prompts ([Baek et al. 2026](https://aclanthology.org/2026.findings-emnlp.933.pdf)). In the Rev survey, 34% name "phrasing requests" and 32% "knowing how much detail" as their top challenge ([Rev 2025](https://www.rev.com/blog/ai-results)). | Users can often state intent when pushed ("intent concretization" works), so the capacity is there and the trigger is missing. Power users report *more* phrasing struggle than casual users (42% vs 33%), so difficulty tracks task ambition more than articulation skill ([Rev 2025](https://www.rev.com/blog/ai-results)). | **Partly true** for a minority of tasks and users (medium). |
| H1 | **Users don't yet know what they want; intent forms through iteration** | Experienced users iterate more and delegate one-shot less ([Anthropic EI Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)). Iteration is near-universal ([NN/g 2023](https://www.nngroup.com/articles/accordion-editing-apple-picking/)). The Subramonyam et al. "intentionality gap": users who skip planning lack internal benchmarks for judging output ([CHI 2024](https://arxiv.org/html/2309.14459v2)). Nielsen: "humans are better at recognizing a solution than describing it" ([Nielsen 2026](https://jakobnielsenphd.substack.com/p/intent-ux), opinion). Developer conversations run long because developers "repeatedly shift use cases" ([Zhong et al. 2025](https://arxiv.org/abs/2509.10402)). | Directive use rose from 27% to 39% on Claude.ai between Dec 2024 and Aug 2025 ([Anthropic EI Sep 2025](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report)), so many users *do* hand over complete tasks. Augmentation recovered slightly by Feb 2026. | **Substantially true**, especially for creative and open-ended work (medium-high). |
| H2 | **Users are satisficing; vague prompts are good enough** | 77% get a satisfying answer in <2 min ([Rev](https://www.rev.com/blog/ai-results), Claimed). Asking messages, the plurality, get the best quality ratings ([NBER](https://www.nber.org/papers/w34255)). Seeking Information grew from 14% to 24% of ChatGPT usage, and it works much like web search, where queries are short by habit ([NBER](https://www.nber.org/papers/w34255)). Low-knowledge users invest minimal effort ([Kim et al. 2024](https://arxiv.org/html/2311.07434v3)). | Adobe reports 91% have abandoned a GenAI task for manual work (Claimed, secondary). 72% of dissatisfactions go unresolved ([Kim et al.](https://arxiv.org/html/2311.07434v3)). | **True for most everyday volume** (high). |
| H3 | **Users prefer iterating on outputs over specifying upfront** | Accordion editing and apple picking ([NN/g](https://www.nngroup.com/articles/accordion-editing-apple-picking/)). Human trial-and-error prompt adaptation captured ~half the model-upgrade gains, and automated rewriting sometimes hurt ([Jahani et al.](https://arxiv.org/abs/2407.14333)). Commentary that "just talk to it" is enough for simple tasks ([Applied AI blog](https://appliedai.pages.dev/blog/prompt-engineering-is-not-dead) `[snippet only]`). | NN/g also found that a well-specified first prompt reduced back-and-forth, and participants still edited the final output outside the chatbot. For long-running jobs (Deep Research), upfront clarification is "proactive error management" ([Benson 2025](https://edwardbenson.com/2025/04/deep-research-ux)). | **True for short, cheap, reversible tasks. False for long, expensive, irreversible ones** (medium). |
| H4 | **Gulf of envisioning: the gap is capability + instruction + evaluation, not articulation alone** | Subramonyam et al. split the gulf into a *capability gap* (what can the LLM do), an *instruction gap* (how to say it) and an *intentionality gap* (how to judge it) ([CHI 2024](https://arxiv.org/html/2309.14459v2)). In Rev, 23% say they are unclear what AI can do. Non-experts' prompting is "opportunistic, not systematic", shaped by expectations from instructing humans and by overgeneralising from single examples ([Zamfirescu-Pereira et al., CHI 2023](https://people.eecs.berkeley.edu/~bjoern/papers/zamfirescu-johnny-chi2023.pdf), N=10, chatbot-design task). | The framework is conceptual. Subramonyam et al. ran no user study, only analyses of 3 interfaces and 12 systems. | **Best overall framing** (medium). A product that fixes only the instruction gap leaves the other two open. |

**Synthesis (Hypothesis):** Prompt quality is a real problem, but it is **conditional**. It bites when (1) the task is a *Doing* task whose output is costly to regenerate or verify, (2) the user holds private context the model cannot infer (audience, constraints, quality bar, prior attempts), and (3) the user's intent is formed enough to answer questions about it. Where intent is unformed (H1), questions should be **generative** ("which of these directions?"), not **extractive** ("what is your audience?"). That is consistent with Tix's finding that users valued thought-provoking questions most.

---

## 2. Why users submit vague prompts, and whether they notice what's missing

**What the evidence shows (Verified unless noted):**
- **Search-query habits carry over.** In NN/g's 9-person AI-literacy study, low-fluency users wrote prompts that "looked like search queries", leaving out context and constraints. High-fluency users wrote longer prompts, asked for formats and followed up ([NN/g, Rosala 2026](https://www.nngroup.com/articles/ai-literacy/)).
- **Human-to-human instruction habits mislead.** Non-experts expect the model to behave like a human listener and overgeneralise from one success or failure ([Zamfirescu-Pereira et al.](https://people.eecs.berkeley.edu/~bjoern/papers/zamfirescu-johnny-chi2023.pdf)). Limitation: the study had 10 participants designing a chatbot prompt, not making everyday requests.
- **Models rarely ask, so users rarely learn what was missing.** LLM output "appears to simply presume common ground", and preference training *reduces* grounding acts ([Shaikh et al., NAACL 2024](https://arxiv.org/abs/2311.09144)). The long, information-poor prompt style gets shorter, vaguer answers and **no clarifying question**, while a different, equally underspecified style does draw clarification ([Baek et al. 2026](https://aclanthology.org/2026.findings-emnlp.933.pdf)). Chatbots answer underspecified requests by making wrong assumptions, hedging at length or refusing ([Herlihy et al.](https://microsoft.com/en-us/research/uploads/prodnew/2024/06/Overcoming_RLHF.pdf)).
- **Omissions are the typical error.** Adobe's rubric found missing tone, examples and persona to be the most common prompt errors ([PPC Land summary](https://ppc.land/adobe-study-91-of-marketers-abandon-ai-tasks-due-to-bad-prompts/), Claimed, secondary).
- **Users add context only after failure, and rarely.** Among dissatisfaction-resolving tactics, specific instructions made up 38.4% of instances and *additional context or explanation* only 5.2% ([Kim et al.](https://arxiv.org/html/2311.07434v3)).
- **Self-assessment is miscalibrated.** 54% of Gen Z rated their own prompting 4–5/5 yet averaged 56/100 (Adobe, Claimed). Lower AI conceptual knowledge predicts *higher* receptivity to AI, reported in the NN/g article citing [Tully, Longoni & Appel 2025](https://www.nngroup.com/articles/ai-literacy/) (secondary).

**Do users recognise what's missing?** No study I found directly measures whether users can identify, unprompted, which context they left out. Indirect evidence suggests they **recognise it once shown** (intent concretization works) but **don't anticipate it** (context is rarely added proactively, and self-ratings are inflated). **Hypothesis H-REC:** shown a list of candidate missing dimensions, users will reliably pick the relevant ones (recognition > recall). Asked "what else should the AI know?", they will mostly answer "nothing". Validation: Experiment E2 (§13).

---

## 3. What people actually do with AI (usage data relevant to the thesis)

| Source | Finding | Implication for SubText | Label |
|---|---|---|---|
| [NBER w34255 (OpenAI, ~1.1M sampled conversations)](https://www.nber.org/papers/w34255) | Asking 49% / Doing 40% / Expressing 11%. Among work messages, Doing ~56%. Writing is 40% of work messages, and ~2/3 of Writing modifies user-supplied text. Tutoring/teaching is 10.2% of all messages. Programming is 4.2%. Non-work rose from 53% to 73%. Users aged 18–25 send ~46% of messages. Asking is rated higher quality than Doing. | The addressable "Doing + generate-from-scratch" slice is much smaller than "all ChatGPT usage". | Verified (OpenAI-employed co-authors) |
| [Anthropic EI Sep 2025](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report) | Directive conversations rose from 27% to 39%. Automation reached 49% (vs 45% in a re-run) on Claude.ai, and 77% automation on the API. Computer/math tasks are 36% of Claude.ai usage. The report argues complex deployments are limited more by *access to context* than by model capability. | "Context is the bottleneck" supports the thesis for professional, complex tasks. | Verified |
| [Anthropic EI Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report) | High-tenure users (6+ months) iterate more, are much less directive, do more work tasks, and have +3–5 pp success. Their inputs require ~1 more year of schooling per year of tenure. | Skilled users see *iteration* as the skill, so an upfront interview may feel like a regression to them. | Verified |
| [Microsoft Copilot Usage Report 2025 (37.5M conversations)](https://microsoft.ai/news/its-about-time-the-copilot-usage-report-2025/) | Searching for information is the top intent. Advice-seeking is rising, and health dominates on mobile. | Mobile and consumer use is advice/search-heavy, where clarification is cheap but standalone tools are unlikely. | Claimed (vendor) |
| [Tomlinson et al. 2025 (200k Bing Copilot conversations)](https://arxiv.org/html/2507.07935v5) | The top user goals are information gathering, writing and communicating. In 40% of conversations the AI's action and the user's goal are disjoint. | — | `[snippet only]` |
| [Anthropic Education Report 2025 (574,740 student conversations)](https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude) | Direct vs collaborative split roughly evenly (~47% direct). CS is overrepresented (~37–39%). | Students split between "just give me the answer" and tutoring-style use. | Verified |
| [Pew, Feb 2026 (N=5,119)](https://www.pewresearch.org/internet/2026/06/17/how-opinions-and-use-of-ai-differ-by-age/) | 49% of US adults have used a chatbot (66% of 18–29). 24% use one daily. Only 18% are "extremely/very confident" using chatbots (31% of 18–29, 6% of 65+). | A large low-confidence majority exists, but they mostly search and ask. | Verified |
| [Menlo Ventures 2025 (Morning Consult, N=5,031)](https://menlovc.com/perspective/2025-the-state-of-consumer-ai/) | 61% used AI in the past 6 months, 19% daily, ~3% pay. | Consumer WTP is very low. | Claimed |

---

## 4. How users react to follow-up and clarifying questions

**Evidence (Verified unless noted):**
- **Quality determines whether questions help or hurt.** Low-quality CQs reduce search performance and satisfaction. A later high-quality CQ partly repairs the damage. Showing *only* high-quality CQs gave the best results with the least effort ([Zou et al., 89 participants](https://irlab.science.uva.nl/wp-content/papercite-data/pdf/zou2022asking.pdf)). The larger TOIS 2023 study reached the same conclusion: good CQs help, low- and mid-quality CQs harm ([Zou et al. TOIS 2023](https://research.tudelft.nl/en/publications/users-meet-clarifying-questions-toward-a-better-understanding-of-) `[snippet only]`).
- **Tolerance is higher than designers fear when questions are relevant.** In product search, users answered ~11–21 questions on average, "but not many more". They stopped from fatigue or irrelevance, and 12–17% of their answers contradicted the target ([Zou, Kanoulas & Liu 2020](https://arxiv.org/abs/2008.00279)). *Caveat:* each question was a cheap yes/no item about a product, not an open-ended question about the user's goals.
- **In LLM generation, questions improve output preference.** Users preferred documents generated after follow-up Q&A over documents from the bare request, and valued open-ended and thought-provoking questions most ([Tix 2024](https://arxiv.org/abs/2407.12017); N not reported). In a coding assistant study, participants rated the clarifying assistant above baseline ([Darji & Lutellier 2025](https://arxiv.org/abs/2507.21285)). The per-dimension preference figures (82%/78%/80%/66%) are `[snippet only]`.
- **Timing matters less than whether to ask.** Asking first vs asking after generation made no significant overall UX difference. Clarification overall raised trust and cognitive overhead, and its value rose with task uncertainty and irreversibility ([Berkeley MIMS 2026, N=30](https://www.ischool.berkeley.edu/projects/2025/ask-or-after-clarification-timing-and-user-experience-generative-ai); student project, not peer-reviewed).
- **Search engines have long asked.** Bing's clarification pane was studied over millions of queries, with position and presentation biases in engagement ([Zamani et al. SIGIR 2020](https://arxiv.org/abs/2006.00166) `[snippet only]`). Kiesel et al. (SIGIR 2018) are summarised secondhand as finding users "like to be prompted for clarification" in voice search `[snippet only; secondhand]`.
- **Public reception of Deep Research's clarification step is mixed** (anecdote, not data):
  - Positive: a HN commenter cites Deep Research's clarifying questions as evidence that LLMs *can* turn vague desires into specifications ([HN 43689311](https://news.ycombinator.com/item?id=43689311)).
  - Mixed: another finds the questions useful but wants a separate answer box per question, because free-form answers are error-prone ([HN 44004489](https://news.ycombinator.com/item?id=44004489)). This is a direct UX signal for SubText.
  - Negative: some users want to skip the questions and report no way to bypass them (Reddit, `[snippet only]`). Tech press ran "how to stop ChatGPT's annoying follow-up questions" pieces, though these concern *end-of-answer engagement prompts*, not clarification ([PCWorld](https://www.pcworld.com/article/3221302/i-got-chatgpt-stop-its-annoying-follow-up-questions-with-one-prompt.html), [TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/i-got-tired-of-chatgpt-trying-to-bait-me-with-follow-up-questions-after-every-answer-so-i-made-this-one-easy-change) `[snippet only]`). **Hypothesis:** users conflate "questions that help me" with "questions that keep me engaged". Any question that doesn't visibly change the output will be read as the latter.

**Implications (Hypothesis; hand-off to WS5 and WS4):** (1) Ask only when expected value is high. The literature's consistent result is that *not asking* beats asking badly. (2) Prefer questions with **concrete options plus a free-text escape** (recognition, plus fewer of the 12–17% "wrong answers"). (3) Show what each answer changed. (4) Always offer "skip and generate now".

---

## 5. Cognitive load, question fatigue and survey length

- **Length lowers participation and late-question quality.** Announcing a longer survey lowered starts, reportedly 75% for 10 minutes vs 65% for 20 minutes. Later questions got faster, shorter and more uniform answers ([Galesic & Bosnjak 2009, POQ](https://bibbase.org/network/publication/galesic-bosnjak-effectsofquestionnairelengthonparticipationandindicatorsofresponsequalityinawebsurvey-2009) `[snippet only]`). Other studies find no length effect when length isn't announced (Sandelin 2022, `[snippet only]`). **Implication:** the *perceived* number of questions up front matters, so show "3 quick questions", not an open-ended interview.
- **Paging vs scrolling.** On PC, paging and scrolling did not differ in breakoff. Scrolling produced slightly more item non-response (missed items). Paging is faster when skip logic is complex. On mobile, scrolling was **twice as fast** (4.5 vs 9.1 min) with higher satisfaction (70% vs 64% top rating) and fewer technical problems. Item non-response did not differ ([Mavletova & Couper 2014](https://publications.hse.ru/mirror/pubs/share/folder/nssh3n1258/direct/164995078), which also reviews Peytchev et al. 2006). **Implication:** one-question-at-a-time costs time with no completion benefit, unless questions depend on each other (adaptive skip logic). Adaptive questioning *is* complex skip logic, which is the one case where paging helps.
- **Decision fatigue: treat with caution.** The ego-depletion account behind "decision fatigue" has failed large preregistered replications. A 36-lab, N=3,531 test found d≈0.06, and Bayesian analyses favoured the null about 4:1 ([Vohs et al. 2021, Psych Sci](https://discovery.dundee.ac.uk/en/publications/a-multisite-preregistered-paradigmatic-test-of-the-ego-depletion-/) `[snippet only]`). Hagger et al.'s 2016 registered replication also did not replicate the original findings ([APS](https://psychologicalscience.org/?p=124940) `[snippet only]`). **Do not justify question limits with "decision fatigue".** Justify them with time cost, perceived burden and the survey-quality data above, which are better supported.
- **Progressive disclosure** is a well-established HCI principle, not re-researched here (WS4 owns it). The relevant behavioural finding is that recognition beats recall, which supports defaults and options over blank fields.

---

## 6. Forms vs conversational interfaces vs hybrids: preference analysis

**Evidence base:**
- Conversational surveys beat web forms on response quality: less satisficing and more differentiated answers (Kim et al. 2019, 117 Korean adolescents, casual tone best). For open-ended questions they produce better informativeness, relevance, specificity and clarity (Xiao et al. 2020, ~600 participants, 5,200+ responses). **Cost:** ~53% longer completion (Kim et al.). Xiao's survey was mostly open-ended, so it may not generalise to closed items.
- Survey methodology favours grouping and scrolling for speed and satisfaction on mobile, and paging only when logic branches (Mavletova & Couper).
- NN/g recommends hybrid GUI + prompt patterns: prompt controls, direct editing, point-to-select ([NN/g 2023](https://www.nngroup.com/articles/accordion-editing-apple-picking/); [NN/g prompt controls](https://www.nngroup.com/articles/prompt-controls-genai/) `[snippet only]`). Nielsen proposes "prompt augmentation" patterns (style galleries, prompt rewrite, prompt builders) ([Nielsen](https://jakobnielsenphd.substack.com/p/prompt-augmentation) `[snippet only]`).
- One user explicitly asked for per-question answer fields rather than one free-form reply ([HN 44004489](https://news.ycombinator.com/item?id=44004489)).

| Format | Strengths (evidence) | Weaknesses (evidence) | Best-fit segments (Hypothesis) |
|---|---|---|---|
| **One-at-a-time conversational** | Richer open answers, less satisficing (Kim, Xiao). Supports adaptive branching. | Slowest (+53% in Kim; paging ×2 on mobile). Users can't see the end, which raises perceived burden. | Low-articulation consumers, on emotionally loaded or ill-defined tasks with few questions. |
| **Grouped batch (3–5 questions on one screen)** | Faster. Users see the full scope. Matches the "N quick questions" framing that lowers perceived length. | More item skipping (Peytchev via Mavletova). Less adaptive. | Knowledge workers, developers, power users. |
| **Free-form ("tell me more")** | Captures unanticipated context. | Users rarely add context unprompted (5.2% of tactics, Kim 2024). Formatting burden (HN). | Experts who already know what matters; optional only. |
| **Structured form / chips with defaults** | Recognition over recall. Fast. Fewer wrong answers (Hypothesis). | Feels bureaucratic. Options may anchor or narrow intent. | Repeatable workflows, templates, teams. |
| **Hybrid: draft first, then targeted questions plus direct editing** | Lets users *recognise* intent (Nielsen 2026). Matches iteration-heavy expert behaviour (Anthropic 2026; NN/g). Questions are grounded in a visible artifact. | Costs one generation. May anchor on the first draft. | **Default recommendation for most segments** (medium confidence). |

**Per-segment preference (all Hypothesis; validate with E3):**
- **Students:** low tolerance for upfront questions on homework ("just answer"). Higher tolerance on study-plan or essay-planning tasks. Expect hybrid or chips to work best.
- **Developers and AI power users:** dislike interviews and prefer editable structured specs. They already use plan or spec modes in coding agents (WS1 to verify). Batch questions plus editable prompt.
- **Knowledge workers:** batch of ≤3 with defaults inside existing tools. Templates for repeated tasks.
- **Founders and researchers:** will tolerate deeper elicitation for high-stakes artifacts (market research, literature review, pitch). A conversational interview is acceptable if output quality visibly improves.
- **General consumers:** fewest questions possible. Chips over typing. Voice may reduce the articulation barrier (Nielsen opinion; one Reddit anecdote about dictation, `[snippet only]`).

---

## 7. Lessons from conversational requirements elicitation

- **Interviews work, especially structured ones.** A systematic review found interviews, preferably structured, to be among the most effective elicitation techniques, ahead of card sorting, ranking and think-aloud. Analyst experience did not matter much, and intermediate representations showed no significant benefit. The authors caution that the underlying studies were not replicated ([Davis et al., RE 2006](https://ebse.webspace.durham.ac.uk/ebse-bibliography/effectiveness-of-requirements-elicitation-techniques-empirical-results-derived-from-a-systematic-review/), Verified abstract). **Implication:** a *structured* question set (stable dimensions such as audience, goal, constraints, success criteria, format) is likely more reliable than free-wheeling conversation.
- **LLM-backed interviews feel realistic and engaging but produce inconsistencies.** In a 120-student study, an LLM playing the client was rated more realistic and engaging than transcripts, despite occasional contradictory information ([Lojo et al. 2025](https://arxiv.org/abs/2503.07800) `[snippet only]`). This is the reverse role (LLM as stakeholder), so it is weakly relevant.
- **Tacit knowledge is the classic elicitation failure.** RE practice holds that stakeholders omit what they consider obvious. The Anthropic EI report independently flags tacit, undigitised context as a bottleneck for complex AI tasks ([Sep 2025](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report)). **Hypothesis:** the highest-value questions target *the obvious-to-the-user, invisible-to-the-model* facts: audience, what was already tried, what "good" looks like, and hard constraints.

---

## 8. Trust, automation bias, delegation and ownership

- **Willingness to delegate is rising but contested.** Directive use rose to 39% on Claude.ai by Aug 2025 (Anthropic EI Sep 2025), while expert users iterate more (Mar 2026). Developers' trust in AI accuracy is low: 46% distrust vs 33% trust, only 3% "highly trust", and 66% say AI answers are "almost right, but not quite" ([Stack Overflow 2025](https://survey.stackoverflow.co/2025/ai), Verified).
- **Automation bias is real and hard to cure with explanations.** The healthcare decision-support literature documents automation bias ([Goddard et al. 2012, JAMIA](https://pmc.ncbi.nlm.nih.gov/articles/PMC3240751) — page blocked by a bot check, `[snippet only]`). A 2025 review of 35 studies reports that transparency and explanations frequently fail to reduce it, and that designs which make users actively verify work better ([Romeo & Conti 2025, AI & Society](https://link.springer.com/article/10.1007/s00146-025-02422-7), paywalled, `[snippet only]`). Novices and "naive power users" accept outputs with little scrutiny ([NN/g 2026](https://www.nngroup.com/articles/ai-literacy/)). **Risk for SubText (Hypothesis):** users will accept a polished, structured generated prompt *because it looks expert*, even where it encodes wrong assumptions. The product should surface its assumptions for confirmation rather than bury them in a long prompt.
- **Automated rewriting can silently drift from intent.** Misaligned automated rewriting undermined gains ([Jahani et al. 2024](https://arxiv.org/abs/2407.14333)). Rewriters "over-infer missing details" ([FaithRewriter line of work](https://arxiv.org/abs/2504.20340) `[snippet only]`). A Product Hunt commenter on a prompt tool asked for a diff view to see what changed and why `[snippet only]`.
- **The IKEA effect may favour participation over full automation.** Effort invested in co-creating with GenAI raised perceived value (Mehler et al. ECIS 2024, N=174, images). A ChatGPT text-generation RCT found the IKEA effect *and* higher satisfaction with, and WTP for, the tool ([Nemeth & Czuprak 2025](https://ideas.repec.org/a/cub/journm/v20y2025i3p2-6.html)). Both are Verified at abstract level, with small, non-replicated samples. **Hypothesis:** answering a few good questions may *increase* users' sense of ownership of, and satisfaction with, the final prompt and output compared with one-click rewriting. Questions are then a feature, not only a cost, *if* they are few and meaningful.

---

## 9. Are users getting better at prompting on their own?

| Evidence | Direction | Label |
|---|---|---|
| Individual Bing Copilot users' trajectories change far less than population averages. High- vs low-activity differences appear early, "suggesting they are inherent rather than learned" ([Hicke & Tomlinson 2026](https://arxiv.org/html/2605.29018v1)) | **Slow or no individual learning** | Verified |
| High-tenure Claude users have higher success and more sophisticated inputs, but the authors flag selection and survivorship as alternative explanations ([Anthropic EI Mar 2026](https://www.anthropic.com/research/economic-index-march-2026-report)) | Some learning, or selection | Verified |
| Average required education of Claude.ai inputs *fell* from 12.2 to 11.9 years as the user base broadened (same) | The population gets *less* sophisticated as adoption spreads | Verified |
| Prompting skill can improve quickly while output-evaluation skill lags ([NN/g 2026](https://www.nngroup.com/articles/ai-literacy/)) | Mixed | Verified (qualitative, N=9) |
| Only 39% of AI users at work were trained ([MS WTI 2024](https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part)). 57–63% of researchers cite lack of guidelines and training ([Wiley via NISO](https://www.niso.org/niso-io/2025/02/wiley-explanaitions-ai-study)) | Skill gap persists | Claimed |
| Models are getting better at inferring intent, and model upgrades drive most gains on open-ended creative tasks ([Jahani et al.](https://arxiv.org/abs/2407.14333)) | The **need** for user prompting skill may shrink on some tasks | Verified |

**Assessment (Hypothesis, medium):** users are *not* reliably self-improving. As adoption spreads to later, less sophisticated cohorts, the median prompt may get worse. Two forces erode the opportunity, though: models increasingly infer intent and ask questions themselves, and "context engineering" (memory, files, connectors) supplies context without the user typing it. The window for a prompt-quality product is **real but likely closing for simple tasks**. It is more durable for complex, context-heavy tasks.

---

## 10. Public discussion: anecdote vs data

- **Data-backed frustrations:** "almost right" outputs (SO 2025, 66%). Rewriting the same prompt repeatedly (28% of frustrated users, Rev). Unresolved intent misunderstanding (Kim et al.). Abandonment for manual work (Adobe, 91%, Claimed, secondary).
- **Anecdotal themes** (Reddit and HN; not representative):
  - "Prompt engineering is overrated; just give context or talk to it" (r/PromptEngineering, Jan 2025, `[snippet only]`).
  - Prompt-improver tools seen as useful for model-specific tuning (HN [42727595](https://news.ycombinator.com/item?id=42727595)), but also mocked as loops that "don't really fix anything" (HN [47994871](https://news.ycombinator.com/item?id=47994871)).
  - A meta-agent "improves bad prompts" but doesn't fix capability, so better prompts up front are preferable (HN [48025574](https://news.ycombinator.com/item?id=48025574)).
  - Deep Research questions are useful, but the answer format is clunky (HN [44004489](https://news.ycombinator.com/item?id=44004489)).
- **What is notably absent:** I found no organic groundswell of users *asking* for a tool that interviews them before prompting. Searches mostly surfaced vendor launches and "how to stop follow-up questions" articles. Treat this as weak disconfirming evidence: a latent need may exist without being voiced (Hypothesis).

---

## 11. Personas

*Evidence strength: **H** = multiple large-sample primary sources; **M** = one large source or several small ones; **L** = inference or anecdote. None of these personas were derived from interviews.*

| Persona | Most frequent AI tasks (evidence) | Prompting proficiency | Core frustration | Willingness to use another tool | WTP potential | Retention potential | Evidence strength |
|---|---|---|---|---|---|---|---|
| **Students** | Explaining concepts, summarising, generating text (64%), editing (39%). 92% of UK undergraduates use GenAI ([HEPI 2025 via DJS](https://www.djsresearch.co.uk/EducationMarketResearchInsightsAndFindings/article/92percent-of-undergraduates-now-use-generative-AI-tools-in-some-form-to-support-their-academic-studies-05678)). Tutoring is 10% of ChatGPT messages. 18–25s send ~46% of messages (NBER). ~47% direct use (Anthropic Edu). | Overconfident: Gen Z self-rates high, scores 56/100 (Adobe, Claimed) | Fear of cheating accusations (53%) and hallucinations (50%) (HEPI) | Low for prompting; already in ChatGPT, often free | **Very low** | Low–medium (seasonal) | M–H usage, L for SubText fit |
| **Software developers** | Coding, debugging, agentic coding. 84% use or plan to use AI, 51% of professionals daily ([SO 2025](https://survey.stackoverflow.co/2025/ai)). 36% of Claude.ai usage is computer/math (Anthropic). | High, but spec-writing for agents is a new skill | "Almost right" outputs (66%), debugging AI code (45%) | Low for a separate web tool. Want in-IDE or agent-native (Hypothesis) | Medium (employer-paid tools are the norm) | Medium | H usage, M pain |
| **Founders** | Market research, pitch drafts, strategy, landing pages, code (Hypothesis: no usage dataset found). Anthropic lists "startup fundraising" among the highest-tenure tasks (EI Mar 2026). | Varies; often high-agency generalists | High-stakes, open-ended artifacts where intent is still forming | Medium (tool-hungry) | Medium | Low–medium (episodic) | **L** |
| **Researchers** | Lit search, writing and editing, analysis. AI use rose from 57% to 84% in 2025 (Wiley release, `[snippet only]`). 63% cite lack of guidelines and training ([NISO](https://www.niso.org/niso-io/2025/02/wiley-explanaitions-ai-study)). | Medium; strong domain articulation | Accuracy and hallucination, and the absence of norms | Medium | Low–medium (institutional) | Medium | M |
| **Designers** | Ideation, copy, asset generation, prototyping (Figma AI report 2025, N=2,500; numbers `[snippet only]`: 78% say AI makes them more efficient but only 47% say it makes them better at their role) | Visual intent is hard to verbalise, so they are a strong articulation-barrier case | Generic outputs. Can't describe a style in words | Medium (style galleries and visual references fit better than questions) | Medium | Medium | L–M |
| **Knowledge workers** | Writing (40% of work messages; ~2/3 editing), info gathering, decisions (NBER). 75% use AI at work, 78% BYOAI, 39% trained (MS WTI 2024). | Low–medium | Tone and format misses, rework, time pressure | Low: want it inside Outlook, Docs, Slack (Hypothesis) | Low individually. Possible via employer | Medium if embedded | H usage, M pain |
| **General consumers** | Search, advice, health, planning, images (Pew 2026; Menlo; Copilot). 73% of ChatGPT messages are non-work. | Low; only 18% very confident (Pew) | Mostly satisficed. Occasional misunderstanding | **Very low** | **Very low** (~3% pay for any AI) | Low | H usage, H low-WTP |
| **AI power users** | Complex, multi-step, professional tasks. Iterate heavily (Anthropic). 21% spend >11 min refining (Rev). Experiment with prompts (WTI). | High, yet 42% struggle with phrasing (Rev), because tasks are harder | Repeated rewriting. Long sessions. Model-specific quirks | Medium: already use prompt improvers and templates; skeptical of anything that slows them down | **Highest** | Medium–high if it saves time on repeatable work | M |

**Persona notes (key nuances):**
- **Power-user paradox.** Power users report *more* prompting difficulty than casual users (Rev) and are the most likely to pay, but they are also the most iteration-oriented (Anthropic) and the least tolerant of being slowed down. **Hypothesis:** they want *spec scaffolding and reusable templates* more than an interview.
- **Students are the largest group with the weakest prompts, and the worst business.** Usage is high and skill is low, but WTP is minimal, institutions may see "prompt help" as an integrity risk, and the "Direct" half wants answers, not questions.
- **Developers are a strong pain fit, but the channel is wrong.** Agentic coding is exactly the long-running, costly-to-redo case where upfront specification pays off. The problem is likely solved natively in IDEs and agents (WS1 to confirm).

---

## 12. Jobs-to-be-Done

**Main job (Hypothesis):** *"When I need an AI to produce something that matters, help me get a result I can use with minimal back-and-forth, without having to become a prompt expert."* Note that the job is a **usable output**. A better prompt is only a means. Users hire a prompt tool only if it is the shortest path to a usable output.

| Job type | Job statements (Hypothesis, grounded where cited) |
|---|---|
| **Functional** | Get a usable first draft without 4–7 retries (Adobe patience thresholds: ~4 attempts for text, ~7 for images, Claimed). Make sure the AI knows my audience, constraints and quality bar. Reuse a good setup for recurring tasks. Hand a long-running job (research, agent) a brief it won't misread. |
| **Emotional** | Not feel stupid or "bad at AI" (low confidence: only 18% very confident, Pew). Feel in control of what the AI assumes. Avoid the anxiety of being caught out by a hallucination or a cheating accusation (HEPI). Feel ownership of the result (IKEA effect). |
| **Social** | Look competent to my boss or client when I send AI-assisted work. Be the person on the team who "gets good results from AI". Avoid being seen as outsourcing thinking (students, researchers). |

**Switching forces (Forces of Progress):**

| Force | Evidence | Strength |
|---|---|---|
| **Push** (pain with current way) | Intent misreads (32% of dissatisfactions). 72% unresolved. Repeated rewriting (28% of frustrated users). Abandonment (91%, Claimed). | Medium. Pain is real but intermittent |
| **Pull** (attraction of new way) | Better outputs from follow-up Q&A (Tix). Clarifying assistants preferred (Darji). Chatbot elicitation gives richer input (Xiao, Kim). Ownership gains (Nemeth). | Medium |
| **Anxiety** (about the new way) | Extra time (+53% for conversational elicitation). Bad questions harm (Zou). Generated prompt may drift from intent (Jahani). Privacy of pasting work context (WS8). | **High** |
| **Habit** (inertia of current way) | "User habits are sticky" (Hicke & Tomlinson). Users live inside ChatGPT, Claude, Copilot and IDEs. 78% BYOAI. Iterating in-chat is the learned default (NN/g). Assistants are adding clarification natively. | **Very high** |

**Net (Hypothesis):** Anxiety plus Habit outweigh Push plus Pull for most segments **for a standalone destination tool**. The balance improves for (a) power users with repeatable high-value workflows and (b) in-context delivery (extension, IDE, API, or a feature inside an existing assistant).

---

## 13. Current-state journey maps (where the prompt-quality problem actually bites)

*All journeys are **hypotheses** built from the evidence above. **[BITES]** = where prompt quality materially hurts outcomes; [low] = low impact.*

### J1 — Knowledge worker: "Write a professional email / document"
| Stage | Doing | Thinking / feeling | Prompt-quality impact |
|---|---|---|---|
| Trigger | Needs to reply to a client or draft a memo under time pressure | "AI can do the first draft" | [low] |
| Prompt | Pastes the thread and writes "reply professionally" | Context is mostly in the paste (~2/3 of Writing is modifying user text, NBER) | [low] Context is already supplied |
| First output | Tone or length wrong; generic | Mild annoyance | **[BITES]** Missing *audience, relationship, goal of the email* |
| Iterate | "Shorter", "warmer", "add X" (accordion editing, NN/g) | Fine, it's quick | [low] Cheap iteration |
| Finish | Edits outside the tool (NN/g) and sends | Done in ~2–5 min | — |
**Verdict:** pain is low per instance and high in frequency. The fix is cheap iteration or saved preferences (custom instructions), not an interview. **Weak fit.**

### J2 — Founder: "Research the market for my startup"
| Stage | Doing | Thinking / feeling | Prompt-quality impact |
|---|---|---|---|
| Trigger | Preparing a pitch or deciding on a pivot | High stakes, unclear scope | — |
| Prompt | "Research the market for [idea]" | Doesn't yet know which questions matter (intent forming, H1) | **[BITES]** Missing geography, segment, decision to be made, depth, sources |
| Long run | Launches Deep Research (10–30 min) | Hopeful | **[BITES]** A wrong direction is expensive (Benson: "proactive error management") |
| Output | Generic TAM/SAM boilerplate | Disappointed. Can't tell what's wrong (intentionality gap) | **[BITES]** Evaluation gap |
| Iterate | Re-runs with more detail, or gives up | Frustration, time lost | **[BITES]** |
**Verdict:** high intensity, low–medium frequency. Upfront clarification has high expected value. Platforms already ask (Deep Research). **Moderate fit; the open question is differentiation over the native step.**

### J3 — Developer: "Build feature X with a coding agent"
| Stage | Doing | Thinking / feeling | Prompt-quality impact |
|---|---|---|---|
| Trigger | Ticket or idea | Knows the codebase, assumes the agent does too | — |
| Prompt | One-line instruction to the agent | Tacit constraints unstated (conventions, edge cases, non-goals) | **[BITES]** Tacit knowledge gap |
| Agent run | Many steps, many files | Hands-off | **[BITES]** Costly to redo; "almost right" (66%, SO) |
| Review | Debugs the AI code (45% say it takes longer) | Distrust | **[BITES]** |
| Iterate | Corrects in conversation, or writes a spec or plan | Learns to write specs | [low] Learns through experience |
**Verdict:** high intensity, high frequency for agent users. Strong pain fit, but users expect it solved *inside* their agent or IDE. **Strong pain, weak standalone channel.**

### J4 — Student: "Help me study ML"
| Stage | Doing | Thinking / feeling | Prompt-quality impact |
|---|---|---|---|
| Trigger | Exam or course | Overwhelmed | — |
| Prompt | "Explain neural networks" / "make a study plan" | Doesn't know what they don't know | **[BITES]** Missing level, timeline, goal (for plans); [low] for explanations |
| Output | Reasonable generic explanation | "Good enough" (satisficing) | [low] |
| Follow-up | "Explain simpler", "give an example" | Natural tutoring loop | [low] Iteration *is* the learning |
**Verdict:** low pain. The iterative loop is the value. Questions help only for planning artifacts. **Weak fit.**

**Cross-journey pattern (Hypothesis, medium):** the problem bites where **(cost of a wrong output) × (private context the model lacks) × (time to the next feedback)** is high. That means long-running research, agentic coding and high-stakes documents, not everyday writing or Q&A.

---

## 14. How painful is the problem? Frequency × intensity by segment

Scale 1–5. **Confidence** reflects the strength of evidence for the *rating*, not for the segment's existence.

| Segment | Frequency of prompt-quality failures | Intensity per failure | Pain score (F×I, max 25) | Already solved "well enough"? | Confidence |
|---|---|---|---|---|---|
| AI power users (complex workflows) | 4 (heavy, harder tasks; 21% spend >11 min refining) | 4 | **16** | Partly (templates, prompt improvers, iteration skill) | Medium |
| Developers using agents | 4 | 4 ("almost right", costly debugging) | **16** | Partly (plan modes, spec files; WS1 to verify) | Medium |
| Founders | 2 | 5 (high-stakes, open-ended) | **10** | Partly (Deep Research clarification) | **Low** (no usage data) |
| Researchers | 3 | 4 (accuracy, norms) | **12** | Partly; their bottleneck is accuracy more than prompting | Low–medium |
| Designers | 3 | 3 (style is hard to verbalise) | **9** | Partly (image references, style galleries) | Low |
| Knowledge workers | 4 (daily writing) | 2 (cheap to iterate) | **8** | Mostly (iteration, custom instructions) | Medium |
| Students | 3 | 2 | **6** | Mostly (tutoring loop) | Medium |
| General consumers | 2 | 2 | **4** | Yes (satisficing) | Medium–high |

**Reading (Hypothesis):** no segment scores "hair on fire" (>20). The highest-pain segments (power users, agent developers) are also the most self-sufficient, the most iteration-oriented, and the best served by native features. This is the central tension for the product.

---

## 15. Implications for the product thesis (brief; detailed design is WS4/WS5)

1. **Reframe the job from "better prompt" to "usable output on the first serious attempt"** for high-stakes, long-running tasks.
2. **Ask fewer, better questions.** Default to 0–3, batched, each with options plus free text plus skip. Only ask when expected value is clearly positive. Bad questions are worse than none (Zou).
3. **Show a draft, or the interpreted intent, early.** Support recognition over description (Nielsen 2026; intentionality gap). Use "Here's what I'll assume — fix anything wrong" as an assumptions panel.
4. **Make assumptions and changes visible.** This counters automation bias and the risk of drift from intent (Jahani). Offer a diff between "your words" and "the generated prompt".
5. **Prefer in-context delivery** (extension, IDE, API, integrations) over a destination site, given habit stickiness. Coordinate with WS4/WS7.
6. **Do not build for students or general consumers first**, on WTP and pain evidence.
7. **Don't justify design with "decision fatigue"**. Use time-cost and perceived-burden evidence.

---

## 16. Proposed user interview guide

**Principles:** Mom Test style. Ask about *past specific behaviour*, not hypothetical futures or opinions about our idea. Never pitch before the final 5 minutes. Look for workarounds, money and time already spent. Record verbatim and code against the hypotheses in §1.

### 16.1 Screener (target 8–12 per priority segment: power users, agent developers, founders, researchers; plus 4–6 knowledge workers as a contrast)
1. Which AI tools have you used in the past 7 days? (multi-select; **disqualify** if none)
2. Roughly how many times did you use them in the past 7 days? (0–2 / 3–10 / 11–30 / 30+)
3. Think of the last time you used AI for something *important* to your work or studies. What was it? (open; **qualify** if a concrete, non-trivial task is described)
4. Do you pay for any AI tool personally or through work? Which? (record; don't disqualify)
5. Have you ever saved, reused or shared a prompt or template? (Y/N; segment marker)
6. Role / industry / company size (quotas by segment)
7. Have you used "Deep Research", a coding agent, a prompt improver or custom GPTs/Projects? (quota mix)
8. **Exclude:** people who work in prompt-engineering product companies; UX researchers studying AI prompting.

### 16.2 45-minute discussion guide
| Time | Section | Questions (non-leading) | What we're testing |
|---|---|---|---|
| 0–3 | Intro and consent | Purpose: "understanding how people use AI tools in their work". No mention of prompting products. Recording consent. | — |
| 3–10 | Context | Walk me through your typical week. Where does AI show up? Which tools, for what? What did you use it for yesterday? | Usage mix (Asking vs Doing) |
| 10–22 | **Last important task (critical incident)** | Tell me about the last time you used AI for something that really mattered. What were you trying to get done? What did you type first? (Ask them to open the chat history if they're willing and screen-share.) What happened next? How many tries did it take? What did you change between tries, and why? How did you know when it was good enough? What did you do with the output afterwards? | H0 vs H1 vs H3. Omitted context. Satisficing threshold. Evaluation gap |
| 22–28 | Failure incident | Tell me about a time the AI clearly misunderstood what you wanted. What did it get wrong? Looking back, what did it not know? When did you realise that? What did you do about it? | Recognition vs anticipation of missing context (H-REC). Unresolved rate |
| 28–33 | Questions from AI | Has an AI tool ever asked you questions before doing a task? Tell me about the last time. What did you do? Did you answer, skip or ignore? What happened to the result? | Real reaction to clarification (not hypothetical) |
| 33–38 | Workarounds and spend | Have you done anything to get better results: templates, saved prompts, courses, tools, asking colleagues? How much time or money did that take? What still doesn't work? | Push strength. Existing spend = WTP signal |
| 38–42 | Ownership and trust | When the AI writes something for you, how much do you check it? Tell me about the last time you caught a mistake. | Automation bias. Verification behaviour |
| 42–45 | Wrap-up (optional concept probe) | If something could change about how you work with AI, what would matter most? *Only now* optionally show a neutral concept and ask: "When, if ever, in the last month would this have been useful?" Ask for referrals. | Pull, anchored to a real incident |

**Avoid:** "Would you use…?", "Is it frustrating when…?", "How much would you pay?", and any mention of "prompt engineering" before the participant uses the term.

**Coding frame:** count incidents where (a) intent was clear but under-stated (H0), (b) intent formed during iteration (H1), (c) the first answer was good enough (H2), or (d) iteration was preferred over specification (H3). Also capture: the context type omitted, the stakes, time lost, and existing spend.

---

## 17. Diary study and Wizard-of-Oz plan

### 17.1 Diary study (2 weeks, n=16–20)
- **Sample:** 4–5 each of power users, agent developers, founders and researchers. Plus 4 knowledge workers as a contrast group.
- **Instrument:** for every AI use rated "important" (self-defined), a 2-minute mobile entry:
  - task type and stakes (1–5)
  - number of attempts
  - minutes spent
  - outcome usable? (Y / partly / N)
  - "What did the AI not know that it needed?" (free text)
  - a chat link or screenshot (optional, PII-redacted)
- End-of-day micro-entry: count of all AI uses (important and not).
- **Exit interview** (30 min) on the 2–3 most painful entries.
- **Metrics:** share of uses that are "important" (frequency). Attempts and minutes per important use (intensity). Share failing due to missing context vs model capability vs unclear intent. Share where the user could name the missing context *after* the fact.
- **Decision threshold (proposal):** proceed with the thesis for a segment if ≥30% of important uses fail first-attempt because of missing context *and* that costs ≥10 min per incident, recurring weekly.

### 17.2 Wizard-of-Oz test (n=30–36, within-subjects, own real tasks)
- **Setup:** participants bring 3 real pending tasks. A human "wizard" (expert prompt writer, scripted) plays SubText. The final prompt runs on the participant's usual LLM.
- **Arms (counterbalanced):**
  - **A.** Direct: the participant's own prompt, sent as-is.
  - **B.** One-click rewrite: no questions (wizard infers).
  - **C.** Batched clarification: ≤3 questions with options and skip, then the generated prompt.
  - **D.** Draft-first hybrid: wizard shows a quick draft plus an assumptions list; the participant fixes assumptions; final prompt.
  - Optional **E.** One-at-a-time conversational (up to 6 questions).
- **Measures:**
  - Blind output-quality rating by the participant and by 2 independent raters
  - "Usable as-is?"
  - Total time to usable output
  - Number of follow-up turns needed afterwards
  - NASA-TLX-lite (perceived effort)
  - Perceived control and ownership
  - Preference ranking
  - Skip rate per question
  - Share of wrong or "don't know" answers
- **Key comparisons:** C vs A, and C vs B. Is elicitation better than guessing? D vs C: does recognition beat description? Time-adjusted quality: does the quality gain justify the time?
- **Kill criterion (proposal):** if C and D do not beat B on time-to-usable-output for ≥60% of high-stakes tasks, the questioning approach is not justified and a lighter design (rewrite plus assumptions panel) should be considered.

---

## 18. Verified vs. claimed vs. hypothesis register (important claims)

| Claim | Status |
|---|---|
| ~2/3 of ChatGPT Writing requests modify user-supplied text; Asking 49% / Doing 40% / Expressing 11% | **Verified** (NBER; OpenAI co-authors) |
| High-tenure users iterate more and are less directive; +3–5 pp success | **Verified** (Anthropic; self-assessed success, selection caveats) |
| Intent misunderstanding is the most frequent dissatisfaction (32%); 72% unresolved | **Verified** (Kim et al., N=94 after filtering, Prolific) |
| >23% of OpenAssistant queries severely underspecified | **Verified** (Herlihy et al.) |
| ~1 in 6 advice prompts are long but information-poor, and get no clarification | **Verified** (Baek et al.) |
| Low-quality clarifying questions harm users | **Verified** (Zou et al.) |
| Chatbot surveys: better quality, ~53% longer | **Verified** (Kim et al. 2019, adolescents) |
| Automated rewriting can undermine gains | **Verified** (Jahani et al.) |
| User habits are sticky | **Verified** (Hicke & Tomlinson) |
| 77% satisfied in <2 min; power users struggle more with phrasing | **Claimed** (Rev vendor survey, unweighted) |
| 91% abandoned an AI task; average prompt scores 57/100 | **Claimed** (Adobe, via secondary article) |
| ~3% of consumer AI users pay | **Claimed** (Menlo/Morning Consult) |
| Ego depletion fails to replicate | `[snippet only]` (consistent with widely known replication record) |
| <20% articulate enough for advanced prompting | **Opinion** (Nielsen's own estimate) |
| Problem bites in high-cost × high-private-context × slow-feedback tasks | **Hypothesis** |
| Standalone tool loses to habit and native features | **Hypothesis** |
| Power users want scaffolding and templates more than interviews | **Hypothesis** |
| Founder pain profile | **Hypothesis** (no data) |

---

## 19. Limitations

- No primary research was conducted. All personas and journeys are desk-built.
- Usage datasets are platform-specific (OpenAI, Anthropic, Microsoft) and classified by LLMs. Two of the NBER authors are OpenAI employees, and Anthropic's success metric is self-assessed by Claude.
- Key clarification studies are small (N=30–117) or domain-specific (product search, web search). Search-engine clarification may not transfer to prompt construction.
- I could not access: the HEPI full report (403), Figma's AI report (form-gated), the Wiley press release (403/429), ACM DL pages (403), Goddard 2012 (bot check), Romeo & Conti 2025 (paywall), the full text of Zou TOIS 2023, and Galesic & Bosnjak 2009. These are marked `[snippet only]` or cited via secondary summaries.
- The WebSearch budget ran out before I could search for: founder-specific usage data, Microsoft WTI 2025, NN/g prompt-controls detail, and further HN/Reddit threads on prompt-improver reception.

---

## 20. Unresolved questions

1. What share of *important* AI tasks fail because of missing user context, rather than model capability or unformed intent? (No study separates these.)
2. Can users *recognise* missing context from a candidate list, compared with recalling it unprompted? (H-REC is untested.)
3. Does the quality gain from clarification survive a **time-adjusted** comparison against simply iterating in-chat?
4. How do expert iterators react to upfront questions: as help or as friction?
5. Will native assistant features (Deep Research-style clarification, memory, prompt improvers) close the gap before a standalone product can win users? (WS1/WS7)
6. Is there any segment with demonstrated existing spend on prompt help (courses, templates, tools) large enough to sustain a business? (WS7)
7. Founder AI usage patterns: no dataset found.
8. Does answering questions raise ownership and trust (IKEA effect), or does it raise automation bias toward the polished prompt?

## 21. Validation experiments

| # | Experiment | Question answered | Success / kill signal |
|---|---|---|---|
| E1 | Diary study (§17.1) | Frequency × intensity of context-driven failures per segment | ≥30% of important uses fail on missing context, at ≥10 min each, weekly |
| E2 | Recognition test: show users their own failed prompt plus a list of 8 candidate missing dimensions, vs an open "what was missing?" question | H-REC | Recognition picks ≥2× more relevant dimensions than recall |
| E3 | Wizard-of-Oz, 4–5 arms (§17.2) | Elicitation vs guessing vs draft-first; format preference per segment | C/D beat B on time-to-usable output in ≥60% of high-stakes tasks |
| E4 | Log-based A/B in a prototype: skip button and per-question skip rates | Question fatigue threshold; which question types get answered | Median answered ≥2 of 3; skip rate <30% per question |
| E5 | Fake-door / concierge test with power users and agent developers (landing page plus manual service) | Pull and WTP signal | ≥5% sign-up from targeted traffic; ≥20% of concierge users return for a second task in 2 weeks |
| E6 | Generated-prompt audit: raters compare generated prompts with participants' stated intent | Drift-from-intent rate (Jahani risk) | <10% of prompts contain an assumption the user rejects |
| E7 | Ownership/trust probe inside E3: perceived ownership and verification behaviour | IKEA effect vs automation bias | Ownership up with no drop in verification |
