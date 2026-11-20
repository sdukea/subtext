/**
 * DEVELOPMENT MOCK — keyword heuristics, not AI.
 *
 * Used when no API key is configured (or SUBTEXT_MOCK=true) and in tests, so the whole journey can
 * be exercised offline. The UI labels mock sessions prominently. Never present this as real AI.
 */
import type { AnalysisOutput, SampleOutput } from "./stages";
import type { ConversationState, FamilyId, LlmCall, PromptIR } from "./schema";
import type { LlmProvider, StageResult } from "./orchestrator";
import { FAMILIES } from "./templates";
import { fallbackIR } from "./render";

const FAMILY_KEYWORDS: [FamilyId, RegExp][] = [
  ["coding_task", /\b(bug|fix|crash|error|refactor|function|endpoint|codebase|repo|stack trace|typescript|python|test)\b/i],
  ["app_build", /\b(app|website|site|landing page|saas|dashboard|platform|mvp|lovable|bolt|v0)\b/i],
  ["research", /\b(research|market|competitors?|analy[sz]e|compare|literature|report on|study of)\b/i],
  ["writing", /\b(write|email|essay|article|blog|post|copy|letter|cover letter|newsletter)\b/i],
];

/** Plain-language mock questions, so the offline journey reads like the real one. */
const MOCK_QUESTIONS: Record<string, string> = {
  app_purpose: "What's the main thing people will do with it?",
  core_features: "What must someone be able to do in the first version?",
  audience: "Who will use it?",
  accounts_data: "Does it need logins, saved data or payments?",
  scope_level: "How finished does this first version need to be?",
  starting_point: "Is this a new project or a change to an existing one?",
  design_direction: "How should it look and feel?",
  platform: "Where will people use it?",
  tech_stack: "Any technology you need it built with?",
  done_when: "How will you know the first version works?",
  task_kind: "What kind of change is this?",
  change: "What exactly should be different afterwards?",
  codebase: "Which language, framework or files are involved?",
  evidence: "Is there an error message or log to include?",
  preserve: "Is there anything that must not change?",
  latitude: "How much freedom should the agent have?",
  verification: "How should the change be checked?",
  research_question: "What specific question should the research answer?",
  decision: "What will you decide or do with the result?",
  scope: "Which market, region or time period?",
  evidence_standard: "How strict should the sources be?",
  deliverable: "What should the result look like?",
  known_context: "What do you already know?",
  piece: "What kind of piece is this?",
  purpose: "What should the reader do or feel afterwards?",
  reader: "Who's going to read it?",
  key_points: "Which facts or details must it include?",
  tone: "What tone fits?",
  length: "How long should it be?",
  objective: "What are you ultimately trying to achieve?",
  situation: "What background would help?",
  output_format: "What shape should the answer take?",
  constraints: "Any limits — time, budget, tools, things to avoid?",
};

const call = (stage: string): LlmCall => ({ stage, model: "mock", ms: 0, inputTokens: 0, outputTokens: 0, ok: true });
const snake = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function mockFamily(text: string): FamilyId {
  for (const [f, re] of FAMILY_KEYWORDS) if (re.test(text)) return f;
  return "general";
}

export class MockProvider implements LlmProvider {
  readonly mock = true;
  readonly samples = 3;

  async analyse(state: ConversationState): Promise<StageResult<AnalysisOutput>> {
    const family = state.task.family !== "general" && state.slots.length ? state.task.family : mockFamily(state.request);
    const text = `${state.request}\n${state.answers.map((a) => a.value ?? "").join("\n")}`.toLowerCase();
    const words = state.request.trim().split(/\s+/).length;
    const tpl = FAMILIES[family];
    const slots = tpl.slots.map((t) => {
      const hit = t.mockKeywords.find((k) => text.includes(k));
      const known = !!hit && words > 6;
      return {
        id: t.id,
        known,
        value: known ? `Mentions "${hit}"` : "",
        source: known ? ("request" as const) : ("none" as const),
        candidates: known ? [] : t.mockOptions.map((o) => ({ id: snake(o), label: o, description: "" })),
        question: MOCK_QUESTIONS[t.id] ?? `What should I know about ${t.label.toLowerCase()}?`,
        why: "",
        format: t.mockOptions.length >= 2 ? t.format === "free_text" ? ("free_text" as const) : ("single_choice" as const) : ("free_text" as const),
      };
    });
    return {
      call: call("analyse"),
      data: {
        family,
        family_confidence: "medium",
        title: state.request.split(/\s+/).slice(0, 5).join(" "),
        goal: state.request.trim().slice(0, 200),
        deliverable: tpl.label,
        success_criteria: [],
        expertise: "intermediate",
        stakes: "medium",
        complexity: words > 60 ? 2 : words > 20 ? 3 : 4,
        slots,
        discovered: [],
        contradictions: mockContradictions(text),
        injection_suspected: /ignore (all|previous|your) instructions/i.test(state.request),
      },
    };
  }

  async sample(_state: ConversationState, open: { id: string; options: { id: string }[] }[], index: number): Promise<StageResult<SampleOutput>> {
    // Deterministic spread: readings 0 and 1 agree, reading 2 differs — moderate uncertainty.
    return {
      call: call(`sample_${index}`),
      data: { choices: open.map((s) => ({ slot_id: s.id, candidate_id: s.options[index === 2 ? 1 % s.options.length : 0]!.id })) },
    };
  }

  async compose(state: ConversationState): Promise<StageResult<PromptIR>> {
    return { call: call("compose"), data: fallbackIR(state) };
  }
}

/** Development mock: one keyword-detected conflict so the contradiction path can be exercised offline. */
function mockContradictions(text: string): AnalysisOutput["contradictions"] {
  if (/\bfree\b/.test(text) && /\b(payments?|subscriptions?|charge|paid)\b/.test(text)) {
    return [
      {
        description: "The request says it's free but also mentions taking payments.",
        slot_ids: ["accounts_data", "scope_level"],
        severity: "hard",
        question: "Should people pay for anything in this first version?",
        options: [
          { id: "free", label: "No — completely free", description: "" },
          { id: "paid", label: "Yes — some things are paid", description: "" },
          { id: "later", label: "Free now, payments later", description: "" },
        ],
      },
    ];
  }
  return [];
}
