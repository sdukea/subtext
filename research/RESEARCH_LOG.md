# Research Log

Chronological record of research activity. Dates are 2026-11-13 unless noted.

| Time / step | Activity | Outcome |
|---|---|---|
| 1 | Verified tools: WebSearch (direct, tested), WebFetch (via web-fetch agent, tested on code.claude.com/docs/llms.txt), built-in browser, Claude in Chrome | Research tooling confirmed |
| 2 | Created `research/`, `research/sources/`, `research/data/` and management files | Done |
| 3 | Launched 8 workstream subagents (WS1–WS8) in parallel | In progress |

## Workstream status

| WS | Status | Reviewed by coordinator | Notes |
|---|---|---|---|
| WS1 Competitive | Complete (partial coverage: Reddit/G2 blocked) | Yes — 4 claims re-verified | |
| WS2 Prompt engineering | Complete | Yes — key paper re-verified | Resumed after 429 |
| WS3 User research | Complete (desk only) | Yes | Resumed after 429 |
| WS4 UX | Complete | Yes — Bolt claim re-verified | |
| WS5 Questioning engine | Complete | Yes | Resumed after 429 |
| WS6 Tech + evaluation | Complete | Yes — Claude prices re-verified | Resumed after 429; sources file written on resume |
| WS7 Market + business | Complete | Yes | Resumed after 429 |
| WS8 Privacy/legal | Complete | Yes — Gemini terms + Anthropic D.4 re-verified | |
| WS-RT Red team | Complete | — | 01, 12 |
| SYN Synthesis | Complete | — | 00, 13, 14, SOURCE_REGISTER, INDEX, OPEN_QUESTIONS |

## Coordinator activity during agent runs
- RT: Read Yang et al. 2025 (underspecification, ACL Findings 2026) — verified key figures (41.1% default inference; up to 19% drop when specifying many requirements). Read Peng 2026 PDFs directly (weak-model compensation; ceiling effect; author's commercial lateni.com). RevenueCat 2025/2026 and a16z consumer AI 2025 read. Logged in `sources/RT_sources.md`. Sent lateni.com lead to WS1.
- WS4 returned (07_UX_AND_PRODUCT_DESIGN.md, ~10.2k words, 55 sources). Coordinator spot-check: Bolt "Enhance prompt" guided-question dialog VERIFIED at https://support.bolt.new/building/chat-tools. OpenAI deep-research help page returns 403 to fetch (agent's citation of it unverified by coordinator; corroborate via other sources). Outline complete against brief (10 questions, IA, flows, screens, specs, wireframes, a11y, surfaces). Status: Reviewed — accepted with noted snippet-only items.
- WS8 returned (11_PRIVACY_SECURITY_AND_LEGAL.md, 55 sources). Coordinator spot-check VERIFIED: Gemini API Additional Terms (effective 2026-03-23) require users 18+, prohibit API clients "likely to be accessed by" under-18s, and require Paid Services for EEA/CH/UK users; Anthropic Commercial Terms D.4 (eff. 2025-06-17) bars using Services "to build a competing product or service". Status: Reviewed — accepted. Implication logged in DECISION_LOG (no under-18 student targeting at launch on Gemini; counsel on D.4).

## 2026-11-13 → 2026-11-18: rate-limit interruption and resumption
- On 2026-11-13 five agents (WS2, WS3, WS5, WS6, WS7) stopped on an account usage limit (HTTP 429) while writing final sections. Work so far was saved on disk. Resumed each on 2026-11-18 with instructions to check completeness and finish.
- WS1 returned (03, competitors.csv 53 rows, 73 sources). Coordinator spot-checks VERIFIED: Anthropic legacy Workbench + /v1/experimental/generate_prompt, improve_prompt, templatize_prompt retired 2026-08-17 (release notes, 2026-07-17 entry); Workbench renamed "playground" 2026-08-18. Claude interactive multiple-choice inputs available to all users (support article, 2026-03-16). OpenAI dataset-backed Prompt Optimizer deprecated with the Evals platform: read-only 2026-10-31, shutdown 2026-11-30 (prompt-optimizer guide). Note: the deprecations page itself lists Evals and /v1/prompts but does not name the optimizer; the claim rests on the optimizer guide. Limitation accepted: Reddit sentiment blocked; G2/PromptBase/FlowGPT 403. Status: Reviewed — accepted.
- WS2 returned (04, ~12.9k words, 80 sources). Key: Yang et al. (also verified independently by coordinator, RT-1). Status: Reviewed — accepted; slot-impact ratings flagged as hypotheses.
- WS3 returned (05, 22 sections, 64 sources). Status: Reviewed — accepted; founder persona low-confidence (search budget exhausted).
- WS5 returned (06, ~15k words, 7 worked examples, 49 sources). Status: Reviewed — accepted.
- WS7 returned (02, 10, 62 sources). PromptPerfect shutdown claim is third-party only; "prompt engineering market" reports judged non-credible, no TAM fabricated. Status: Reviewed — accepted.

## 2026-11-18: Synthesis
- WS6 returned (08, 09, 58 sources). Coordinator re-verified Claude API prices (Haiku 5.5 $0.10/$0.50; Sonnet 5.5 $2/$10 per MTok) against https://platform.claude.com/docs/en/about-claude/pricing — consistent with 08 §2.1. Status: Reviewed — accepted.
- Cross-workstream convergence: all eight workstreams independently concluded that clarification is now native/table stakes and that a general consumer prompt tool is weak; WS7 niche (AI-app builders) contradicts R1 partially because Bolt/Lovable already clarify natively — resolved in 12/13 by repositioning on portability + memory and gating on a head-to-head vs native Plan modes.
- Contradiction resolved: WS1 stated OpenAI deprecations page lists the Prompt Optimizer; coordinator found the deprecation notice on the optimizer guide instead (fact stands, citation narrowed).
- Wrote 00, 01, 12, 13, 14, OPEN_QUESTIONS, merged SOURCE_REGISTER (~500 rows), INDEX with coverage checklist.
