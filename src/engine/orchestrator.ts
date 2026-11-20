/**
 * Session orchestrator — the deterministic state machine (research/08 §4.1).
 *
 *   start → analyse → [ask round → answer → analyse]* → stop → compose → review/edit
 *
 * Code owns the loop, budgets and stopping; providers are narrow typed functions.
 */
import type { AnalysisOutput, SampleOutput } from "./stages";
import { openSlotsForSampling } from "./stages";
import type { AnswerEvent, ConversationState, Experiment, LlmCall, MemoryItem, PlannedQuestion, PromptIR, PromptVersion, QuestionFormat, TargetId } from "./schema";
import { LIMITS } from "./schema";
import { applySamples, mergeAnalysis, plan } from "./derive";
import { fallbackIR, lengthWarning, renderPrompt, repairIR, TARGETS } from "./render";

export interface StageResult<T> {
  data: T;
  call: LlmCall;
}

export interface LlmProvider {
  readonly mock: boolean;
  readonly samples: number;
  analyse(state: ConversationState, targetLabel: string): Promise<StageResult<AnalysisOutput>>;
  sample(state: ConversationState, open: ReturnType<typeof openSlotsForSampling>, index: number): Promise<StageResult<SampleOutput>>;
  compose(state: ConversationState, targetLabel: string): Promise<StageResult<PromptIR>>;
}

export class EngineError extends Error {
  constructor(
    public code: "invalid_input" | "invalid_state" | "provider_unavailable" | "provider_failed" | "rate_limited",
    message: string,
    public retryable = false,
  ) {
    super(message);
  }
}

export interface AnswerInput {
  questionId: string;
  kind: AnswerEvent["kind"];
  optionIds?: string[];
  text?: string;
}

const now = () => new Date().toISOString();
const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;

export interface StartOptions {
  memory?: MemoryItem[];
  experiment?: Experiment;
}

export function createState(request: string, target: TargetId, mock: boolean, opts: StartOptions = {}): ConversationState {
  const r = request.trim();
  if (!r) throw new EngineError("invalid_input", "Describe what you want to do first.");
  if (r.length > LIMITS.requestMaxChars) throw new EngineError("invalid_input", `Keep the request under ${LIMITS.requestMaxChars.toLocaleString()} characters.`);
  const t = now();
  return {
    version: 1,
    id: uid(),
    createdAt: t,
    updatedAt: t,
    phase: "questioning",
    mock,
    request: r,
    target,
    answers: [],
    edits: [],
    // Study sessions ignore saved context so both conditions start from the same information.
    memory: opts.experiment ? [] : (opts.memory ?? []).slice(0, 30),
    intent: { title: "", goal: "", deliverable: "", successCriteria: [] },
    task: { family: "general", familyConfidence: "low", complexity: 3, stakes: "medium", expertise: "intermediate" },
    slots: [],
    contradictions: [],
    rounds: [],
    pending: [],
    budget: { maxRounds: 2, maxQuestions: 5 },
    stop: { shouldStop: false, reasons: [], maxNet: 0, threshold: 0, agreement: 1, criticalCovered: true },
    proposals: [],
    prompts: [],
    promptStale: false,
    safety: { injectionSuspected: false },
    calls: [],
    experiment: opts.experiment,
  };
}

/** Remove a round that was shown but not answered (before re-planning). */
function dropUnansweredRound(state: ConversationState): ConversationState {
  const last = state.rounds.at(-1);
  if (!last) return state;
  const answered = state.answers.some((a) => a.round === last.index);
  return answered ? { ...state, pending: [] } : { ...state, rounds: state.rounds.slice(0, -1), pending: [] };
}

async function analyseAndPlan(state: ConversationState, provider: LlmProvider): Promise<ConversationState> {
  const label = TARGETS[state.target].label;
  const calls: LlmCall[] = [];
  const analysis = await provider.analyse(state, label);
  calls.push(analysis.call);
  let next = mergeAnalysis(state, analysis.data);

  const open = openSlotsForSampling(next);
  if (open.length) {
    const results = await Promise.allSettled(Array.from({ length: provider.samples }, (_, i) => provider.sample(next, open, i)));
    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    calls.push(...ok.map((r) => r.call));
    // With no successful samples, candidate probabilities stay uniform (maximum uncertainty).
    if (ok.length) next = applySamples(next, ok.map((r) => r.data));
  }

  next = plan(next);
  next = { ...next, calls: [...state.calls, ...calls], updatedAt: now(), promptStale: next.prompts.length > 0 };
  return state.experiment?.condition === "wizard" ? holdForOperator(next) : next;
}

export async function start(request: string, target: TargetId, provider: LlmProvider, opts: StartOptions = {}): Promise<ConversationState> {
  return analyseAndPlan(createState(request, target, provider.mock, opts), provider);
}

// ---------------------------------------------------------------------------------------------
// Wizard-of-Oz (research/05 §17.2, research/14 Phase 0 week 2)
//
// In the "wizard" condition the engine still analyses, samples and plans, but its proposed round
// is withheld: it becomes `proposals`, visible only to the operator, and the session waits for a
// researcher to publish questions (or stop). Every question records who produced it.
// ---------------------------------------------------------------------------------------------

function holdForOperator(state: ConversationState): ConversationState {
  if (state.phase === "composed") return state;
  const proposals = state.phase === "questioning" ? state.pending : [];
  const rounds = state.phase === "questioning" ? state.rounds.slice(0, -1) : state.rounds;
  return { ...state, phase: "awaiting_operator", pending: [], rounds, proposals };
}

export interface OperatorQuestion {
  /** Existing slot or contradiction id; omit to create a new detail from `label`. */
  slotId?: string;
  label: string;
  text: string;
  why?: string;
  format: QuestionFormat;
  options: { id?: string; label: string; description?: string }[];
  /** Id of the engine proposal this started from, if any. */
  fromProposal?: string;
}

const optId = (label: string, i: number) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `opt_${i + 1}`;

/** Publish an operator-chosen round. Deterministic; no model call. */
export function publishRound(state: ConversationState, questions: OperatorQuestion[]): ConversationState {
  if (state.phase !== "awaiting_operator") throw new EngineError("invalid_state", "This session isn't waiting for questions.");
  const qs = questions.filter((q) => q.text.trim()).slice(0, LIMITS.maxQuestionsPerRound);
  if (!qs.length) throw new EngineError("invalid_input", "Add at least one question, or stop questioning.");
  const round = state.rounds.length;
  let slots = state.slots;
  const planned: PlannedQuestion[] = qs.map((q, i) => {
    const proposal = q.fromProposal ? state.proposals.find((p) => p.id === q.fromProposal) : undefined;
    let slotId = q.slotId?.trim() || proposal?.slotId;
    const isContradiction = !!slotId && state.contradictions.some((c) => c.id === slotId);
    if (!slotId || (!isContradiction && !slots.some((s) => s.id === slotId))) {
      // A detail the engine did not model: add it as a discovered slot so the answer has a home.
      const base = optId(q.label || q.text, i);
      slotId = `op_${base}`;
      while (slots.some((s) => s.id === slotId)) slotId += "_";
      slots = [
        ...slots,
        { id: slotId, label: (q.label || "Detail").slice(0, 40), group: "context", origin: "discovered", status: "assumed", candidates: [], confidence: 0, impact: 0.5, critical: false, technical: false, root: false, decision: "show" },
      ];
    }
    const options = q.format === "free_text" ? [] : q.options.filter((o) => o.label.trim()).slice(0, LIMITS.maxOptions).map((o, j) => ({ id: o.id || optId(o.label, j), label: o.label.trim().slice(0, 80), description: o.description?.trim() || undefined }));
    const format: QuestionFormat = q.format !== "free_text" && options.length < 2 ? "free_text" : q.format;
    const text = q.text.trim().slice(0, 300);
    const unchanged =
      !!proposal && proposal.text === text && proposal.format === format && JSON.stringify(proposal.options.map((o) => o.label)) === JSON.stringify(options.map((o) => o.label));
    return {
      id: `r${round}-${slotId}`,
      slotId,
      kind: isContradiction ? "contradiction" : "slot",
      label: (q.label || proposal?.label || "Detail").slice(0, 40),
      text,
      why: q.why?.trim() || undefined,
      format,
      options: format === "free_text" ? [] : options,
      defaultLabel: proposal?.defaultLabel,
      net: proposal?.net ?? 0,
      source: proposal ? (unchanged ? "operator_selected" : "operator_edited") : "operator_written",
    };
  });
  return {
    ...state,
    slots,
    phase: "questioning",
    pending: planned,
    proposals: [],
    rounds: [...state.rounds, { index: round, questions: planned, shownAt: now() }],
    stop: { ...state.stop, shouldStop: false, reasons: [] },
    updatedAt: now(),
  };
}

/** Operator ends questioning; the participant's client then composes. */
export function operatorStop(state: ConversationState): ConversationState {
  if (state.phase !== "awaiting_operator") throw new EngineError("invalid_state", "This session isn't waiting for questions.");
  return { ...plan({ ...state, proposals: [] }, { operatorStopped: true }), proposals: [], updatedAt: now() };
}

function toEvent(state: ConversationState, input: AnswerInput, round: number): AnswerEvent {
  const q = state.rounds.flatMap((r) => r.questions).find((x) => x.id === input.questionId);
  if (!q) throw new EngineError("invalid_input", "That question is no longer part of this session.");
  const text = (input.text ?? "").trim().slice(0, LIMITS.answerMaxChars);
  let kind = input.kind;
  let value: string | undefined;
  if (kind === "option") {
    const labels = (input.optionIds ?? []).map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean) as string[];
    value = [...labels, text].filter(Boolean).join("; ");
    if (!value) kind = "skipped";
  } else if (kind === "text") {
    value = text;
    if (!value) kind = "skipped";
  }
  return { questionId: q.id, slotId: q.slotId, round, question: q.text, label: q.label, kind, value, optionIds: input.optionIds };
}

export async function answer(state: ConversationState, inputs: AnswerInput[], provider: LlmProvider): Promise<ConversationState> {
  if (state.phase !== "questioning" || !state.pending.length) throw new EngineError("invalid_state", "There are no open questions to answer.");
  const round = state.rounds.at(-1)!.index;
  const byId = new Map(inputs.map((i) => [i.questionId, i]));
  // Every pending question gets an event; unanswered ones are recorded as skipped.
  const events = state.pending.map((q) => toEvent(state, byId.get(q.id) ?? { questionId: q.id, kind: "skipped" }, round));
  const rounds = state.rounds.map((r) => (r.index === round ? { ...r, answeredAt: now() } : r));
  return analyseAndPlan({ ...state, rounds, answers: [...state.answers, ...events], pending: [] }, provider);
}

export async function revise(state: ConversationState, input: AnswerInput, provider: LlmProvider): Promise<ConversationState> {
  const idx = state.answers.findIndex((a) => a.questionId === input.questionId);
  if (idx < 0) throw new EngineError("invalid_input", "That answer can't be found.");
  const prev = state.answers[idx]!;
  const event = { ...toEvent(state, input, prev.round), revised: true };
  const answers = state.answers.map((a, i) => (i === idx ? event : a));
  return analyseAndPlan(dropUnansweredRound({ ...state, answers }), provider);
}

export async function refine(state: ConversationState, request: string, provider: LlmProvider): Promise<ConversationState> {
  const r = request.trim();
  if (!r) throw new EngineError("invalid_input", "The request can't be empty.");
  if (r.length > LIMITS.requestMaxChars) throw new EngineError("invalid_input", "That request is too long.");
  return analyseAndPlan(dropUnansweredRound({ ...state, request: r }), provider);
}

/** Pin a Brief edit. Deterministic — no model call. `confirmed` marks "Keep" on an assumption. */
export function editSlot(state: ConversationState, slotId: string, value: string | null, opts: { confirmed?: boolean } = {}): ConversationState {
  const slot = state.slots.find((s) => s.id === slotId);
  if (!slot) throw new EngineError("invalid_input", "That detail no longer exists.");
  const v = value === null ? null : value.trim().slice(0, LIMITS.editMaxChars);
  if (v === "") throw new EngineError("invalid_input", "Use Remove to clear a detail.");
  const edits = [...state.edits.filter((e) => e.slotId !== slotId), { slotId, label: slot.label, value: v, ...(opts.confirmed && v !== null ? { confirmed: true } : {}) }];
  const slots = state.slots.map((s) =>
    s.id === slotId ? { ...s, status: v === null ? ("removed" as const) : ("edited" as const), value: v ?? undefined, decision: "resolved" as const } : s,
  );
  return { ...state, edits, slots, updatedAt: now(), promptStale: state.prompts.length > 0 };
}

/** "Write it now": stop asking. Pending answers given so far are recorded first. No model call. */
export function finish(state: ConversationState, inputs: AnswerInput[] = []): ConversationState {
  let s = state;
  if (state.pending.length && inputs.length) {
    const round = state.rounds.at(-1)!.index;
    const byId = new Map(inputs.map((i) => [i.questionId, i]));
    const events = state.pending.filter((q) => byId.has(q.id)).map((q) => toEvent(state, byId.get(q.id)!, round));
    s = { ...state, answers: [...state.answers, ...events] };
  }
  s = dropUnansweredRound({ ...s, proposals: [] });
  return { ...plan(s, { userRequested: true }), updatedAt: now() };
}

export async function compose(state: ConversationState, provider: LlmProvider): Promise<ConversationState> {
  if (!state.slots.length) throw new EngineError("invalid_state", "Nothing to compose yet.");
  const label = TARGETS[state.target].label;
  let ir: PromptIR;
  let source: PromptVersion["source"];
  const warnings: string[] = [];
  const calls: LlmCall[] = [];

  if (provider.mock) {
    ir = fallbackIR(state);
    source = "mock";
  } else {
    try {
      const res = await provider.compose(state, label);
      calls.push(res.call);
      ir = res.data;
      source = "composed";
    } catch (err) {
      if (err instanceof EngineError && err.code === "rate_limited") throw err;
      // Graceful degradation (research/08 §8.2): the user still gets a prompt.
      ir = fallbackIR(state);
      source = "fallback";
      warnings.push("The writing model was unavailable, so this prompt was assembled directly from your brief. Try Regenerate for a refined version.");
    }
  }

  const repaired = repairIR(ir, state);
  warnings.push(...repaired.warnings);
  const text = renderPrompt(repaired.ir, state.target, state.task.family);
  const lw = lengthWarning(text);
  if (lw) warnings.push(lw);

  const version: PromptVersion = { id: uid(), createdAt: now(), target: state.target, text, source, ir: repaired.ir, warnings };
  return {
    ...state,
    phase: "composed",
    pending: [],
    prompts: [...state.prompts, version].slice(-20),
    promptStale: false,
    calls: [...state.calls, ...calls],
    updatedAt: now(),
  };
}
