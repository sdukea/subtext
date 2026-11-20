/**
 * Conversation state — the single source of truth for a session (research/06 §B, research/08 §5).
 *
 * The state is derived from an append-only record (request + answers + pinned edits) plus the
 * latest LLM analysis. Revising an answer replaces the event and re-derives the state, so the
 * transcript is never the source of truth.
 */
import { z } from "zod";

export const LIMITS = {
  requestMaxChars: 8000,
  answerMaxChars: 2000,
  editMaxChars: 1000,
  promptMaxChars: 40000,
  maxOptions: 4,
  maxQuestionsPerRound: 3,
  maxDiscoveredSlots: 3,
} as const;

export const TargetId = z.enum(["generic", "app_builder", "coding_agent"]);
export type TargetId = z.infer<typeof TargetId>;

export const FamilyId = z.enum(["app_build", "coding_task", "research", "writing", "general"]);
export type FamilyId = z.infer<typeof FamilyId>;

export const SlotGroup = z.enum(["goal", "audience", "scope", "context", "constraints", "format", "style"]);
export type SlotGroup = z.infer<typeof SlotGroup>;

export const QuestionFormat = z.enum(["single_choice", "multi_choice", "free_text"]);
export type QuestionFormat = z.infer<typeof QuestionFormat>;

/**
 * stated      — present in the original request
 * answered    — supplied through an answer (directly or inferred from an answer's text)
 * edited      — user edited the Brief; pinned, always wins
 * delegated   — user said "You decide" or the slot is too technical to ask; compiled as an
 *               instruction for the downstream model to decide and state its choice
 * assumed     — engine default, shown in the Brief as an editable assumption
 * inferred    — engine default, low value; kept out of the prompt unless important
 * removed     — user removed it from the Brief (not applicable)
 * remembered  — filled from context the user saved in an earlier session ("Remember this");
 *               lower precedence than anything said in this session
 */
export const SlotStatus = z.enum(["stated", "answered", "edited", "delegated", "assumed", "inferred", "removed", "remembered"]);
export type SlotStatus = z.infer<typeof SlotStatus>;

export const Candidate = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  p: z.number(),
});
export type Candidate = z.infer<typeof Candidate>;

export const Decision = z.enum(["ask", "show", "silent", "delegate", "resolved"]);
export type Decision = z.infer<typeof Decision>;

export const Slot = z.object({
  id: z.string(),
  label: z.string(),
  group: SlotGroup,
  origin: z.enum(["template", "discovered"]),
  status: SlotStatus,
  value: z.string().optional(),
  candidates: z.array(Candidate),
  /** Consistency-based confidence: max candidate probability from sampled interpretations. Never self-reported. */
  confidence: z.number(),
  impact: z.number(),
  critical: z.boolean(),
  technical: z.boolean(),
  root: z.boolean(),
  question: z
    .object({ text: z.string(), why: z.string().optional(), format: QuestionFormat })
    .optional(),
  score: z
    .object({ voi: z.number(), net: z.number(), answerability: z.number(), effort: z.number() })
    .optional(),
  decision: Decision.optional(),
});
export type Slot = z.infer<typeof Slot>;

export const QuestionOption = z.object({ id: z.string(), label: z.string(), description: z.string().optional() });
export type QuestionOption = z.infer<typeof QuestionOption>;

/**
 * Who produced a question. Recorded for the Wizard-of-Oz comparison (research/05 §17.2):
 * model             — chosen and phrased by the engine
 * operator_selected — a researcher picked the engine's proposal unchanged
 * operator_edited   — a researcher picked an engine proposal and changed its wording or options
 * operator_written  — a researcher wrote the question
 */
export const QuestionSource = z.enum(["model", "operator_selected", "operator_edited", "operator_written"]);
export type QuestionSource = z.infer<typeof QuestionSource>;

export const PlannedQuestion = z.object({
  id: z.string(),
  slotId: z.string(),
  kind: z.enum(["slot", "contradiction"]),
  label: z.string(),
  text: z.string(),
  why: z.string().optional(),
  format: QuestionFormat,
  options: z.array(QuestionOption),
  /** What "You decide" would resolve to, shown to the user for transparency. */
  defaultLabel: z.string().optional(),
  net: z.number(),
  source: QuestionSource.default("model"),
});
export type PlannedQuestion = z.infer<typeof PlannedQuestion>;

export const AnswerKind = z.enum(["option", "text", "you_decide", "not_sure", "skipped"]);
export type AnswerKind = z.infer<typeof AnswerKind>;

export const AnswerEvent = z.object({
  questionId: z.string(),
  slotId: z.string(),
  round: z.number().int(),
  question: z.string(),
  label: z.string(),
  kind: AnswerKind,
  /** Human-readable answer (option labels joined, or free text). Untrusted user data. */
  value: z.string().optional(),
  optionIds: z.array(z.string()).optional(),
  revised: z.boolean().optional(),
});
export type AnswerEvent = z.infer<typeof AnswerEvent>;

export const EditEvent = z.object({
  slotId: z.string(),
  label: z.string(),
  value: z.string().nullable(),
  /** The user kept an assumption as-is ("Keep") rather than rewriting it. */
  confirmed: z.boolean().optional(),
});
export type EditEvent = z.infer<typeof EditEvent>;

export const Round = z.object({
  index: z.number().int(),
  questions: z.array(PlannedQuestion),
  /** When the round was shown (server time). For operator rounds: when it was published. */
  shownAt: z.string().optional(),
  answeredAt: z.string().optional(),
});
export type Round = z.infer<typeof Round>;

export const StopReason = z.enum([
  "user_requested",
  "budget_exhausted",
  "value_below_threshold",
  "diminishing_returns",
  "fast_path",
  "interpretations_converged",
  "operator_stopped",
  "engine_failure",
]);
export type StopReason = z.infer<typeof StopReason>;

export const Contradiction = z.object({
  id: z.string(),
  description: z.string(),
  slotIds: z.array(z.string()),
  severity: z.enum(["soft", "hard"]),
  question: z.string().optional(),
  options: z.array(QuestionOption),
});
export type Contradiction = z.infer<typeof Contradiction>;

export const PromptIR = z.object({
  title: z.string(),
  objective: z.string(),
  context: z.array(z.string()),
  audience: z.string(),
  requirements: z.array(z.object({ text: z.string(), priority: z.enum(["must", "should"]) })),
  constraints: z.array(z.string()),
  decisions_for_model: z.array(z.string()),
  assumptions: z.array(z.string()),
  output_format: z.string(),
  output_structure: z.array(z.string()),
  success_criteria: z.array(z.string()),
  out_of_scope: z.array(z.string()),
  clarify_first: z.array(z.string()),
  approach: z.array(z.string()),
});
export type PromptIR = z.infer<typeof PromptIR>;

export const PromptVersion = z.object({
  id: z.string(),
  createdAt: z.string(),
  target: TargetId,
  text: z.string(),
  source: z.enum(["composed", "edited", "fallback", "mock"]),
  ir: PromptIR.optional(),
  warnings: z.array(z.string()),
});
export type PromptVersion = z.infer<typeof PromptVersion>;

export const LlmCall = z.object({
  stage: z.string(),
  model: z.string(),
  ms: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  ok: z.boolean(),
});
export type LlmCall = z.infer<typeof LlmCall>;

export const Phase = z.enum(["questioning", "awaiting_operator", "ready_to_compose", "composed"]);
export type Phase = z.infer<typeof Phase>;

/** Context the user chose to remember across sessions (research/13 F9). Stored only in their browser. */
export const MemoryItem = z.object({
  id: z.string().max(80),
  /** Template slot id this fills when the same slot appears in a later session. */
  slotId: z.string().max(80).optional(),
  label: z.string().max(80),
  value: z.string().max(LIMITS.editMaxChars),
  scope: z.enum(["personal", "project"]),
  createdAt: z.string().max(40),
});
export type MemoryItem = z.infer<typeof MemoryItem>;

export const Experiment = z.object({
  studyId: z.string().max(80),
  condition: z.enum(["auto", "wizard"]),
});
export type Experiment = z.infer<typeof Experiment>;

export const Survey = z.object({
  /** Per question id: did this question help? */
  questionRatings: z.record(z.string(), z.enum(["useful", "not_useful"])),
  /** 1–5: how well the final specification captures what the participant meant. */
  fit: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  submittedAt: z.string(),
});
export type Survey = z.infer<typeof Survey>;

export const ConversationState = z.object({
  version: z.literal(1),
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  phase: Phase,
  mock: z.boolean(),

  // ---- record (append-only inputs) ----
  request: z.string(),
  target: TargetId,
  answers: z.array(AnswerEvent),
  edits: z.array(EditEvent),
  memory: z.array(MemoryItem).max(30).default([]),

  // ---- derived understanding ----
  intent: z.object({
    title: z.string(),
    goal: z.string(),
    deliverable: z.string(),
    successCriteria: z.array(z.string()),
  }),
  task: z.object({
    family: FamilyId,
    familyConfidence: z.enum(["high", "medium", "low"]),
    complexity: z.number().int(),
    stakes: z.enum(["low", "medium", "high"]),
    expertise: z.enum(["novice", "intermediate", "expert"]),
  }),
  slots: z.array(Slot),
  contradictions: z.array(Contradiction),

  // ---- questioning ----
  rounds: z.array(Round),
  pending: z.array(PlannedQuestion),
  budget: z.object({ maxRounds: z.number().int(), maxQuestions: z.number().int() }),
  stop: z.object({
    shouldStop: z.boolean(),
    reasons: z.array(StopReason),
    maxNet: z.number(),
    threshold: z.number(),
    /** Impact-weighted agreement of sampled interpretations on the slots still worth asking about (0–1). */
    agreement: z.number().default(1),
    /** Every critical slot is resolved, shown as an assumption or delegated. */
    criticalCovered: z.boolean().default(true),
  }),
  /** Wizard-of-Oz: the engine's own proposed questions, shown to the operator only. */
  proposals: z.array(PlannedQuestion).default([]),

  // ---- output ----
  prompts: z.array(PromptVersion),
  promptStale: z.boolean(),

  safety: z.object({ injectionSuspected: z.boolean() }),
  calls: z.array(LlmCall),

  experiment: Experiment.optional(),
  survey: Survey.optional(),
});
export type ConversationState = z.infer<typeof ConversationState>;
