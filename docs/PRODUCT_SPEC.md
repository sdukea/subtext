# SubText — Product Spec (as implemented)

Source of truth: `research/13_MVP_AND_PRODUCT_REQUIREMENTS.md`, `research/06_QUESTIONING_ENGINE.md` and `research/07_UX_AND_PRODUCT_DESIGN.md`. This document records what the build actually does and how it maps to those sources.

**Positioning (research `13` §1):** a pre-flight brief builder for expensive AI runs. This build is the Phase 0 validation prototype (`docs/VALIDATION_PLAN.md`): the product plus the instruments to test it. It is not a production SaaS.

Three central objects: **Request** (what the user starts with) → **Brief** (what SubText understands, with provenance) → **Spec** (what the user takes to their AI tool).

## Problem and user

People know what they want from AI but leave out the context, constraints and success criteria that decide whether the result is right. LLMs guess unstated requirements correctly only about 41% of the time (`00`). The pain is concentrated in expensive, hard-to-reverse runs (`01`, `12`).

**Primary user (research D7):** adult builders using AI app builders and coding agents.
**Also supported:** general assistant tasks (research, writing, learning), using the same engine. The first screen does not force a category (user brief §3A).

## Value proposition

SubText infers a brief from one rough input, asks only the questions whose answers would change the result, makes every assumption visible and editable, and compiles one consolidated prompt for the tool you're about to use. It is not a chatbot, a template library or a prompt lengthener (`13` §4).

## Core journey

1. **Input.** One text box: "What are you about to build or ask an AI to do?" Optionally choose the target (Any assistant / App builder / Coding agent). Enter continues; ⌘↵ "Just write it" skips questions. Saved context from earlier sessions is applied as defaults.
2. **Understand.** The engine classifies the task family, extracts stated facts, proposes candidate values for open details and estimates uncertainty by sampling. The Brief panel fills in.
3. **Ask, adaptively.** A round has at most 3 questions, chosen by expected value of information minus user effort. The bar rises with every question asked. Each card offers options, "Something else…", "You decide" (showing what would be assumed) and "Not sure". Technical choices are delegated to the downstream AI instead of being asked of novices.
4. **Stop deliberately.** Questioning stops when no question clears the threshold (zero questions for specific requests), the budget is used up, the user says stop, or answers stop carrying information (`06` §F).
5. **Compose.** One consolidated prompt is built from the structured brief, never from the transcript. Its structure adapts to the target and task family. Confirmed facts become requirements, unconfirmed defaults are listed as assumptions, and delegated details become "decide and state your choice".
6. **Review.** The prompt is an editable artifact with Copy (primary, ⌘⇧C), Download .md, Regenerate, target switch (re-rendered instantly with no model call) and version history.
7. **Revise.** Change any earlier answer, edit or remove any Brief detail, or refine the original request. State is re-derived; a stale prompt is flagged with a Regenerate prompt.
8. **History.** Sessions are saved in the browser and reopen from the home screen or a `?s=` URL.

## Requirements coverage (research `13` §3)

| # | Capability | Status |
|---|---|---|
| F1 | Single input + target selector | Done |
| F2 | Inferred Brief with stated / assumed marking | Done (Brief panel; "you said", "assumed", "AI decides", "you confirmed", "remembered"; "Decided" group for resolved conflicts; "Success looks like") |
| F3 | Value-gated questions, ≤3 per round, zero-question path | Done (deterministic policy) |
| F4 | Assumption chips: edit, replace, remove, confirm, remember | Done ("Keep" confirms; "Remember for future sessions" in the editor) |
| F5 | Skip-all always visible | Done ("Write it now", "Skip these", ⌘↵ on home) |
| F6 | Compile with target renderers (generic, app builder, coding agent) | Done |
| F7 | Review and edit; versions | Done (editable artifact, version list). Section-level regenerate and diff view not yet |
| F8 | Copy and export | Copy and Markdown done. Deep links deliberately omitted (research D5: fragile) |
| F9 | Memory (About me, project context) | Partial: per-browser saved context, applied to matching slots in new sessions, listed and deletable on home. No accounts or project grouping |
| F10 | History | Done, local to the browser. Search and duplicate not yet |
| F11 | Feedback capture | Study sessions only: per-question helpfulness and spec fit. Not in normal mode |
| F12 | Privacy defaults | Partial: content stays in the browser, server logs carry no content, keys are server-side, 18+ notice, "Delete all my SubText data", study consent with 18+ confirmation. No privacy policy or terms yet (needs legal review) |

## Out of scope (research `13` §4)

Browser extension, executing the task, prompt marketplace, teaching prompt engineering, one-click "optimise" as a headline, image/video prompts, multi-agent architecture, fetching URLs.

## Messaging rules

Lead with the outcome ("say what you mean"), not "prompt engineering". Make no quality claims until the evaluation in `docs/ARCHITECTURE.md` § Evaluation supports them.
