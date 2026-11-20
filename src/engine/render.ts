/**
 * Prompt IR → text. Pure, deterministic, unit-tested (research/08 §8.4).
 *
 * Structure adapts to the target tool and the task family; empty sections are omitted so short
 * tasks get short prompts. Plain Markdown headings work across ChatGPT, Claude and Gemini;
 * target-specific formatting is an open question (research OQ-8) so we don't vary syntax by vendor.
 */
import type { ConversationState, FamilyId, PromptIR, TargetId } from "./schema";
import { resolvedDecisions } from "./derive";

export const TARGETS: Record<TargetId, { label: string; short: string; description: string }> = {
  generic: { label: "Any AI assistant", short: "Any assistant", description: "ChatGPT, Claude, Gemini or similar" },
  app_builder: { label: "AI app builder", short: "App builder", description: "Lovable, Bolt, v0, Replit" },
  coding_agent: { label: "Coding agent", short: "Coding agent", description: "Cursor, Claude Code, Codex" },
};

const list = (items: string[]) => items.map((x) => `- ${x.trim()}`).join("\n");
const numbered = (items: string[]) => items.map((x, i) => `${i + 1}. ${x.trim()}`).join("\n");
const nonEmpty = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
const section = (h: string, body: string) => (body.trim() ? `## ${h}\n${body.trim()}` : "");

/** Family-specific wording for the generic (any assistant) structure. */
function genericHeadings(family: FamilyId) {
  const base = { context: "Context", requirements: "Requirements", constraints: "Constraints", output: "Output", success: "A good result" };
  if (family === "research") return { ...base, requirements: "What to find out", constraints: "Evidence standard", output: "Deliverable", success: "A good answer" };
  if (family === "writing") return { ...base, context: "Background", requirements: "Must include", constraints: "Style and constraints", output: "Format" };
  if (family === "app_build") return { ...base, context: "What we're building", requirements: "Core features", success: "Done when" };
  if (family === "coding_task") return { ...base, constraints: "Constraints — do not break", success: "Verification" };
  return base;
}

interface Parts {
  objective: string;
  context: string[];
  must: string[];
  should: string[];
  constraints: string[];
  decisions: string[];
  assumptions: string[];
  output: string;
  approach: string[];
  success: string[];
  outOfScope: string[];
  clarify: string[];
}

function parts(ir: PromptIR): Parts {
  const context = nonEmpty(ir.context);
  if (ir.audience.trim()) context.push(`Audience: ${ir.audience.trim()}`);
  const out = nonEmpty(ir.output_structure);
  return {
    objective: ir.objective.trim(),
    context,
    must: nonEmpty(ir.requirements.filter((r) => r.priority === "must").map((r) => r.text)),
    should: nonEmpty(ir.requirements.filter((r) => r.priority === "should").map((r) => r.text)),
    constraints: nonEmpty(ir.constraints),
    decisions: nonEmpty(ir.decisions_for_model),
    assumptions: nonEmpty(ir.assumptions),
    output: [ir.output_format.trim(), out.length ? list(out) : ""].filter(Boolean).join("\n"),
    approach: nonEmpty(ir.approach),
    success: nonEmpty(ir.success_criteria),
    outOfScope: nonEmpty(ir.out_of_scope),
    clarify: nonEmpty(ir.clarify_first).slice(0, 2),
  };
}

const ASSUMPTIONS = "Assumptions (adjust if they don't fit)";

/**
 * Any assistant (ChatGPT, Claude, Gemini): lead with the deliverable; context, then what to
 * include, then shape of the answer. No build or repository conventions.
 */
function renderGeneric(p: Parts, family: FamilyId): string[] {
  const h = genericHeadings(family);
  return [
    p.objective,
    section(h.context, list(p.context)),
    section(h.requirements, list([...p.must, ...p.should.map((x) => `${x} (nice to have)`)])),
    section(h.constraints, list(p.constraints)),
    section("Decide for yourself", list(p.decisions)),
    section(ASSUMPTIONS, list(p.assumptions)),
    section(h.output, p.output),
    section("Approach", numbered(p.approach)),
    section(h.success, list(p.success)),
    section("Out of scope", list(p.outOfScope)),
    p.clarify.length ? section("Before you start", `If any of these are unclear, ask me first:\n${list(p.clarify)}`) : "",
  ];
}

/**
 * AI app builder (Lovable, Bolt, v0, Replit): a build spec. Features are numbered in build order,
 * nice-to-haves and out-of-scope items are fenced off as "not in this version", and the closing
 * instructions keep the first build small and make the builder report what it chose and deferred —
 * the expensive failure modes for builders are scope creep and silent guesses (research/13 §2).
 */
function renderAppBuilder(p: Parts): string[] {
  const later = [...p.should.map((x) => `${x} (later, unless it's trivial)`), ...p.outOfScope];
  return [
    p.objective,
    section("What we're building", list(p.context)),
    section("Core features (in build order)", numbered(p.must.length ? p.must : p.should)),
    section("Constraints and design", list(p.constraints)),
    section("Your call — choose, then tell me what you chose", list(p.decisions)),
    section(ASSUMPTIONS, list(p.assumptions)),
    section("Not in this version", list(p.must.length ? later : p.outOfScope)),
    section("Deliverable", p.output),
    section("How to build it", numbered(p.approach)),
    section("Done when", list(p.success)),
    p.clarify.length ? section("Before you start", `Ask me about these before building:\n${list(p.clarify)}`) : "",
    section(
      "Working rules",
      list([
        "Build the first version only. Get feature 1 working end to end before starting the next.",
        "Don't add sign-in, payments, extra pages or integrations that aren't listed above.",
        "Use realistic placeholder content where real content is missing, and mark it clearly.",
        "When you finish, list what you built, every choice you made on my behalf, and anything you deferred.",
      ]),
    ),
  ];
}

/**
 * Coding agent (Cursor, Claude Code, Codex): a task spec for working in an existing repository.
 * Scope and what must not change come before the requirements; verification is explicit; the
 * closing rules ask for exploration first, minimal diffs and a summary (research/04 model conventions).
 */
function renderCodingAgent(p: Parts): string[] {
  return [
    p.objective,
    section("Context", list(p.context)),
    section("Constraints — do not break", list(p.constraints)),
    section("Requirements", list([...p.must, ...p.should.map((x) => `${x} (optional)`)])),
    section("Out of scope", list(p.outOfScope)),
    section("Your call", list(p.decisions)),
    section(ASSUMPTIONS, list(p.assumptions)),
    section("Steps", numbered(p.approach)),
    section("Verification", list(p.success)),
    section("Output", p.output),
    p.clarify.length ? section("Before you start", `If any of these are unclear, ask me before changing code:\n${list(p.clarify)}`) : "",
    section(
      "Working rules",
      list([
        "Read the relevant code first and follow the patterns already in the repository.",
        "Make the smallest change that meets the requirements; don't refactor unrelated code.",
        "Ask before deleting files, changing public interfaces or adding dependencies.",
        "Run the tests (and add tests for the change), then summarise what you changed and why.",
      ]),
    ),
  ];
}

export function renderPrompt(ir: PromptIR, target: TargetId, family: FamilyId): string {
  const p = parts(ir);
  const sections = target === "app_builder" ? renderAppBuilder(p) : target === "coding_agent" ? renderCodingAgent(p) : renderGeneric(p, family);
  return sections.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---------------------------------------------------------------------------------------------
// Deterministic composer — used in development-mock mode and as graceful degradation when the
// compose stage fails (research/08 §8.2). Never claims to be AI output.
// ---------------------------------------------------------------------------------------------

export function fallbackIR(state: ConversationState): PromptIR {
  const confirmed = state.slots.filter((s) => ["stated", "answered", "edited", "remembered"].includes(s.status) && s.value);
  const assumed = state.slots.filter((s) => s.status === "assumed" && s.value);
  const delegated = state.slots.filter((s) => s.status === "delegated");
  const group = (g: string) => confirmed.filter((s) => s.group === g);
  const fmt = (s: { label: string; value?: string }) => `${s.label}: ${s.value}`;

  return {
    title: state.intent.title,
    objective: state.intent.goal ? `${state.intent.goal.replace(/\.$/, "")}.` : state.request.trim(),
    context: [`Original request: "${state.request.trim()}"`, ...[...group("goal"), ...group("context"), ...group("audience")].map(fmt)],
    audience: "",
    requirements: [
      ...resolvedDecisions(state).map((d) => ({ text: `${d.question}: ${d.decision}`, priority: "must" as const })),
      ...group("scope").map((s) => ({ text: fmt(s), priority: "must" as const })),
    ],
    constraints: [...group("constraints"), ...group("style")].map(fmt),
    decisions_for_model: delegated.map((s) => `Choose the ${s.label.toLowerCase()} and state your choice${s.value ? ` (a sensible default: ${s.value})` : ""}.`),
    assumptions: assumed.map(fmt),
    output_format: group("format").map(fmt).join("; ") || (state.intent.deliverable ? `Produce: ${state.intent.deliverable}` : ""),
    output_structure: [],
    success_criteria: state.intent.successCriteria,
    out_of_scope: [],
    clarify_first: [],
    approach: [],
  };
}

// ---------------------------------------------------------------------------------------------
// Validation: every user-confirmed detail must survive composition (research/06 §G critique).
// ---------------------------------------------------------------------------------------------

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

export function coverage(text: string, value: string): number {
  const vw = [...new Set(words(value))];
  if (!vw.length) return 1;
  const t = new Set(words(text));
  return vw.filter((w) => t.has(w) || t.has(w.replace(/s$/, ""))).length / vw.length;
}

/** Returns the IR with any dropped user-confirmed facts appended, plus warnings. */
export function repairIR(ir: PromptIR, state: ConversationState): { ir: PromptIR; warnings: string[] } {
  const warnings: string[] = [];
  const text = JSON.stringify(ir);
  const missing = state.slots.filter(
    (s) => (s.status === "answered" || s.status === "edited") && s.value && coverage(text, s.value) < 0.4,
  );
  const lostDecisions = resolvedDecisions(state).filter((d) => coverage(text, d.decision) < 0.4);
  let out = ir;
  if (missing.length) {
    out = { ...out, context: [...out.context, ...missing.map((s) => `${s.label}: ${s.value}`)] };
    warnings.push(`Restored ${missing.length} detail${missing.length > 1 ? "s" : ""} the composer left out: ${missing.map((s) => s.label).join(", ")}.`);
  }
  if (lostDecisions.length) {
    out = { ...out, requirements: [...lostDecisions.map((d) => ({ text: `${d.question}: ${d.decision}`, priority: "must" as const })), ...out.requirements] };
    warnings.push(`Restored ${lostDecisions.length} decision${lostDecisions.length > 1 ? "s" : ""} you made that the composer left out.`);
  }
  return { ir: out, warnings };
}

export function lengthWarning(text: string): string | undefined {
  const n = text.split(/\s+/).filter(Boolean).length;
  return n > 700 ? `This prompt is ${n} words. Long prompts can dilute instructions — consider trimming.` : undefined;
}
