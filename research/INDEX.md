# SubText Product Discovery: Index

All deliverables live in `research/`. Start with **[00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md)**.

## Deliverables

| File | Contents | Owner |
|---|---|---|
| [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md) | Verdict, answers A–M, risks, final recommendation, first 30 days | Coordinator |
| [01_PRODUCT_THESIS_VALIDATION.md](01_PRODUCT_THESIS_VALIDATION.md) | Thesis broken into 7 testable claims; what survives; refined thesis; kill criteria | Coordinator |
| [02_MARKET_RESEARCH.md](02_MARKET_RESEARCH.md) | Market evolution, is prompting getting less important, sizing (no fabricated TAM), segment scoring, threats | WS7 |
| [03_COMPETITIVE_INTELLIGENCE.md](03_COMPETITIVE_INTELLIGENCE.md) | Competitor database, feature matrix, pricing, positioning, sentiment, threats, whitespace, "why not just ask ChatGPT?" | WS1 |
| [data/competitors.csv](data/competitors.csv) | 53 competitors × 20 fields | WS1 |
| [04_PROMPT_ENGINEERING_KNOWLEDGE_BASE.md](04_PROMPT_ENGINEERING_KNOWLEDGE_BASE.md) | 17 techniques × 9 fields, model conventions, obsolete techniques, task taxonomy with slots, YAML schemas | WS2 |
| [05_USER_RESEARCH.md](05_USER_RESEARCH.md) | Competing hypotheses, behaviour evidence, question/fatigue research, 8 personas, JTBD, journey maps, interview guide, WoZ plan | WS3 |
| [06_QUESTIONING_ENGINE.md](06_QUESTIONING_ENGINE.md) | Architecture comparison, state schema, classification, question selection and stop rules, pseudocode, failure modes, 7 worked examples, engine evaluation | WS5 |
| [07_UX_AND_PRODUCT_DESIGN.md](07_UX_AND_PRODUCT_DESIGN.md) | 10 design questions answered, UX principles, IA, flows, screen inventory, interaction specs, wireframes, accessibility, surface trade-offs | WS4 |
| [08_TECHNICAL_ARCHITECTURE.md](08_TECHNICAL_ARCHITECTURE.md) | Architecture options A–E, recommended hybrid, components, data flow, schema, API, DB, orchestration, cost model, latency, security, deployment, phased path | WS6 |
| [09_EVALUATION_FRAMEWORK.md](09_EVALUATION_FRAMEWORK.md) | Arms incl. native baselines, confound controls, benchmark proposal, rubric, inter-rater agreement, power calculation, success metrics, failure analysis, production eval | WS6 |
| [10_BUSINESS_AND_GTM.md](10_BUSINESS_AND_GTM.md) | Business models, WTP evidence, channels, wrapper economics, niche, positioning options, 90-day GTM, pricing tests | WS7 |
| [11_PRIVACY_SECURITY_AND_LEGAL.md](11_PRIVACY_SECURITY_AND_LEGAL.md) | Provider data policies, BYOK, extensions, prompt injection, GDPR, DPDP, EU AI Act, copyright, risk register, pre-launch checklist | WS8 |
| [12_RED_TEAM_ANALYSIS.md](12_RED_TEAM_ANALYSIS.md) | Strongest arguments against, five key risks with tests, steelman, recommendation | Coordinator |
| [13_MVP_AND_PRODUCT_REQUIREMENTS.md](13_MVP_AND_PRODUCT_REQUIREMENTS.md) | Product definition, positioning, target user, in/out of scope, PRD requirements, metrics, differentiation | Coordinator |
| [14_DEVELOPMENT_ROADMAP.md](14_DEVELOPMENT_ROADMAP.md) | Phase 0 evidence sprint (first 30 days) → MVP → measured beta → expansion, with gates | Coordinator |
| [SOURCE_REGISTER.md](SOURCE_REGISTER.md) | ~500 sources: title, publisher, URL, date, accessed, category, findings, conclusions supported, reliability | All |
| [RESEARCH_PLAN.md](RESEARCH_PLAN.md) | Questions → workstreams, boundaries, evidence standards | Coordinator |
| [RESEARCH_LOG.md](RESEARCH_LOG.md) | Chronology, reviews, coordinator re-verifications | Coordinator |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | 18 prioritised open questions with resolution methods | Coordinator |
| [DECISION_LOG.md](DECISION_LOG.md) | Process and strategic decisions | Coordinator |
| `sources/` | Per-workstream source tables and the shared agent brief | All |

## Dossier sections (brief §14) → where they are

| # | Section | Location |
|---|---|---|
| 01 | Executive summary | `00` |
| 02 | Product thesis assessment | `01` |
| 03 | Problem validation | `01` §1, `05` §0–2 |
| 04 | Market analysis | `02` |
| 05 | Target customer segments | `02` (segment scoring), `13` §2 |
| 06 | User personas and JTBD | `05` |
| 07 | Competitive intelligence | `03` |
| 08 | Competitive feature matrix | `03` §B, `data/competitors.csv` |
| 09 | Pricing and business model analysis | `03` §C, `10` |
| 10 | Prompt engineering knowledge base | `04` |
| 11 | Task taxonomy | `04` (taxonomy section) |
| 12 | Adaptive questioning engine design | `06` |
| 13 | Conversational UX strategy | `07`, `05` (question-format evidence) |
| 14 | Product information architecture | `07` §4 |
| 15 | Proposed MVP user experience | `07` §5–8, `13` §5 |
| 16 | Technical architecture | `08` |
| 17 | Evaluation and benchmarking framework | `09` |
| 18 | Privacy and security considerations | `11` |
| 19 | Differentiation strategy | `13` §9, `03` §G–H, `06` §9 |
| 20 | Positioning and messaging | `13` §1, `10` §6 |
| 21 | Go-to-market strategy | `10` |
| 22 | Risks and counterarguments | `12` |
| 23 | MVP scope | `13` §3–4 |
| 24 | Product requirements document | `13` |
| 25 | Technical implementation roadmap | `14`, `08` §16 |
| 26 | Open questions and outstanding research | `OPEN_QUESTIONS.md` + each report's final sections |
| 27 | Final recommendation | `00` (final section), `12` §5 |

## Coverage checklist

| Workstream | Status | Notes / gaps |
|---|---|---|
| 1. Market research & opportunity | **Complete, with stated limits** | No TAM fabricated: published "prompt engineering market" reports judged non-credible ($0.3B–$7B spread). Google Trends inaccessible; search volumes from third-party estimators (low-medium reliability). |
| 2. Competitive intelligence | **Partially complete** | 53 competitors, full matrix and pricing. **Gaps:** Reddit and G2 sentiment not collectable (blocked); no logged-in, hands-on product testing; Agenta, Phoenix, Weave, Jasper, Copy.ai, Notion AI, workflow builders, Perplexity, Meta AI, Grok not profiled individually (low relevance). PromptPerfect closure is third-party only. |
| 3. Prompt engineering & applied AI | **Complete** | Many papers read at abstract level (flagged per source). Slot-impact ratings in the taxonomy are hypotheses to measure. |
| 4. User research & behaviour | **Complete (desk research only)** | No interviews conducted, by design; interview guide, diary and WoZ plans provided. Founder persona low-confidence. |
| 5. Questioning engine | **Complete** | 7 worked examples (the brief's 4 + debug, logo, zero-question). |
| 6. UX & product design | **Complete** | ChatGPT/Claude deep links not live-tested (to avoid acting in the user's accounts). |
| 7. Technical architecture | **Complete** | Token counts in the cost model are estimates; WS5/WS6 state schemas need reconciling at implementation. |
| 8. Evaluation & benchmarking | **Complete** | Power assumptions (tie rate, ICC) need pilot data. |
| 9. Business model & GTM | **Complete, with stated limits** | Some anchors (Google AI Plus US price, builder-intent search volume) unresolved. |
| 10. Privacy, security & legal | **Complete (research, not legal advice)** | Several items need counsel (Anthropic D.4, DPDP scope, AI Act Art. 50(2)). |
| 11. Red team | **Complete** | — |
| Synthesis (00, 01, 12–14, register, index) | **Complete** | — |

## Verification notes

Coordinator re-checks against primary sources (details in `RESEARCH_LOG.md`) included:
- Bolt's guided-question "Enhance prompt"
- Anthropic's retirement of its prompt tools on 2026-08-17
- OpenAI's Prompt Optimizer shutdown on 2026-11-30
- Claude's interactive multiple-choice inputs
- The Gemini API under-18 and EEA restrictions
- Anthropic Commercial Terms D.4
- Current Claude API prices
- The underspecification paper's key figures
- The Peng 2026 PDFs

One agent claim was narrowed: the deprecations page doesn't name the OpenAI optimizer; the shutdown notice appears on the optimizer's own guide.
