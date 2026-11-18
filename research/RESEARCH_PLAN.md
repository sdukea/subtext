# Research Plan — SubText Product Discovery

**Project:** Evidence-driven product discovery for an adaptive "clarify-then-prompt" tool (working name: SubText)
**Coordinator:** Principal research coordinator (Claude Code session)
**Start date:** 2026-11-13
**Status tracking:** see `RESEARCH_LOG.md` (progress), `DECISION_LOG.md` (decisions), `OPEN_QUESTIONS.md` (unresolved)

## 1. Thesis under test

A product that takes a vague request, detects missing/ambiguous information that materially affects output quality, asks adaptive follow-up questions only while their expected value exceeds their friction, and composes a structured, model-aware prompt that the user can edit/copy/export.

This is treated as a **hypothesis**, not a specification. Every workstream is instructed to look for disconfirming evidence.

## 2. Primary questions (A–M) → owning workstreams

| Q | Question | Primary owner | Supporting |
|---|---|---|---|
| A | Is the problem real and painful? | WS3 User research | WS1 Market, WS-RT Red team |
| B | Who experiences it most? | WS3 | WS7 Business |
| C | What solutions exist? | WS1 Competitive | — |
| D | What do they fail to solve? | WS1 | WS3 |
| E | Is there a differentiated opportunity? | Synthesis | WS1, WS-RT |
| F | Which techniques/research power it? | WS2 Prompt engineering | WS5 |
| G | How should adaptive questioning work? | WS5 Questioning engine | WS2, WS4 |
| H | How should the experience be designed? | WS4 UX | WS3 |
| I | What architecture? | WS6 Tech + Eval | WS5 |
| J | How to measure that it works? | WS6 | WS2 |
| K | Who pays and why? | WS7 Market + Business | WS1 |
| L | Smallest compelling product? | Synthesis | all |
| M | What makes it obsolete? | WS-RT | WS1, WS7 |

## 3. Workstreams and deliverables

| ID | Workstream | Executed by | Deliverable(s) |
|---|---|---|---|
| WS1 | Competitive intelligence | Subagent | `03_COMPETITIVE_INTELLIGENCE.md`, `data/competitors.csv`, `sources/WS1_sources.md` |
| WS2 | Prompt engineering & applied AI research | Subagent | `04_PROMPT_ENGINEERING_KNOWLEDGE_BASE.md`, `sources/WS2_sources.md` |
| WS3 | User research & behavioural psychology | Subagent | `05_USER_RESEARCH.md`, `sources/WS3_sources.md` |
| WS4 | Product & conversational UX | Subagent | `07_UX_AND_PRODUCT_DESIGN.md`, `sources/WS4_sources.md` |
| WS5 | Adaptive questioning engine | Subagent | `06_QUESTIONING_ENGINE.md`, `sources/WS5_sources.md` |
| WS6 | Technical architecture & evaluation | Subagent | `08_TECHNICAL_ARCHITECTURE.md`, `09_EVALUATION_FRAMEWORK.md`, `sources/WS6_sources.md` |
| WS7 | Market research, business model & GTM | Subagent | `02_MARKET_RESEARCH.md`, `10_BUSINESS_AND_GTM.md`, `sources/WS7_sources.md` |
| WS8 | Privacy, security & legal | Subagent | `11_PRIVACY_SECURITY_AND_LEGAL.md`, `sources/WS8_sources.md` |
| WS-RT | Skeptical red team + thesis validation | Coordinator | `01_PRODUCT_THESIS_VALIDATION.md`, `12_RED_TEAM_ANALYSIS.md` |
| SYN | Synthesis | Coordinator | `00_EXECUTIVE_SUMMARY.md`, `13_MVP_AND_PRODUCT_REQUIREMENTS.md`, `14_DEVELOPMENT_ROADMAP.md`, `SOURCE_REGISTER.md`, `INDEX.md` |

The brief named six agent assignments; the questioning engine (WS5) and privacy/legal (WS8) were split out because each is a substantial, independent research area, and market research was combined with business/GTM (WS7) because market sizing and willingness-to-pay share sources.

## 4. Boundaries to avoid duplicated work

- WS1 owns all competitor facts (features, pricing, sentiment). Others cite WS1 rather than re-researching products, except WS4 may inspect competitor UX patterns and WS5 may inspect how products that ask clarifying questions do so.
- WS2 owns technique research (CoT, few-shot, APE, DSPy, etc.). WS5 owns clarification/question-selection research (active learning, EIG, clarifying-question literature).
- WS6 owns evaluation methodology; WS2 provides technique-level measurement notes only.
- WS7 owns market sizing and pricing strategy; WS1 supplies the competitor price table.

## 5. Evidence standards (all workstreams)

1. Cite the source next to the claim, with URL.
2. Never cite a search snippet as if the page were read; mark snippet-only evidence as such.
3. Separate **verified** (read primary source / inspected product) from **claimed** (marketing) from **hypothesis** (our inference).
4. No fabricated interviews, quotes, prices, features or statistics.
5. Record date accessed (2026-11-13 unless stated).
6. Record unresolved questions.

## 6. Review gate

A workstream is marked complete only after the coordinator has read the deliverable, spot-checked key citations against their sources, and recorded gaps in `OPEN_QUESTIONS.md`.
