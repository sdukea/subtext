# Decision Log

Research-process and strategic decisions, with rationale and alternatives considered.

| # | Date | Decision | Rationale | Alternatives considered |
|---|---|---|---|---|
| D1 | 2026-11-13 | Split research into 8 parallel subagent workstreams plus coordinator-run red team and synthesis | Brief requested parallel specialised agents; questioning engine and privacy are large independent areas | 6 agents as listed in brief (would overload UX and tech agents) |
| D2 | 2026-11-13 | Each agent writes its own sources file; coordinator merges into SOURCE_REGISTER.md | Avoids concurrent-write conflicts on a single file | Single shared register (race conditions) |
| D3 | 2026-11-13 | Red-team and thesis validation run by coordinator, not a subagent | Needs all workstream outputs to challenge; avoids an agent anchoring on its own findings | Separate red-team agent |
| D4 | 2026-11-13 | Treat under-18 students as out of scope for launch | Gemini API terms prohibit apps likely accessed by under-18s; India DPDP treats <18 as children needing verifiable parental consent (WS8) | Target school students with parental-consent flow (high compliance cost) |
| D5 | 2026-11-13 | Primary action = Copy; deep links secondary; web app before extension | Claude desktop link prefill only (~14k char limit); ChatGPT `?q=` undocumented; extension selector fragility and malicious-extension trust problem (WS4, WS8) | Extension-first injecting into chatgpt.com/claude.ai |
| D6 | 2026-11-18 | Recommend: do not build thesis as written; narrow to pre-flight brief builder for expensive AI runs; validate in a 4-week evidence sprint with kill criteria before production code | Convergent evidence across WS1–WS8 + red team (see 12) | Build as proposed; abandon outright; pivot directly to B2B API |
| D7 | 2026-11-18 | Initial segment: adult builders using AI app builders and coding agents | Visible cost of bad briefs (credits/rework), dense communities, tool switching (WS7) — conditional on beating native Plan modes | Deep-research knowledge workers (secondary); students (blocked by D4); teams (later) |
