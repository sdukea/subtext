/**
 * Deterministic question-selection and stopping policy (research/06 §D–F).
 *
 * Code — not an LLM — decides whether to ask, what to ask and when to stop, because those are
 * exactly the decisions LLMs are measurably bad at (research/06 §0.3). Every constant here is a
 * tunable hypothesis; calibrate against the evaluation harness and logged outcomes.
 */
import type {
  AnswerEvent,
  ConversationState,
  Contradiction,
  PlannedQuestion,
  QuestionFormat,
  Slot,
  StopReason,
} from "./schema";
import { LIMITS } from "./schema";

export const POLICY = {
  /** Base ask threshold τ₀ (research/06 §D.3). */
  tauAsk0: 0.12,
  /** Threshold growth per question already asked: τ_ask(t) = τ₀(1+α)^asked. */
  alpha: 0.35,
  /** Below this VOI an unresolved slot is assumed silently instead of shown. */
  tauShow: 0.04,
  /** Effort weight κ (per minute of user time). */
  kappa: 0.2,
  /** Answerability below which a slot is delegated rather than asked. */
  delegateBelow: 0.35,
  /** Uncertainty assigned to open-ended slots with no enumerable candidates. */
  openSlotUncertainty: 0.8,
  stakes: { low: 0.85, medium: 1, high: 1.25 },
  /** Seconds of user effort per format (research/06 §D.2). */
  effortSeconds: { single_choice: 3, multi_choice: 5, free_text: 20 } satisfies Record<QuestionFormat, number>,
  /** Expected share of the slot's uncertainty a question resolves, ρ(s|q). */
  resolution: { single_choice: 0.9, multi_choice: 0.85, free_text: 0.7 } satisfies Record<QuestionFormat, number>,
  maxFreeTextPerRound: 1,
  /**
   * Convergence stop (research/06 §F.6, pragmatic form): after at least one round, if the sampled
   * interpretations agree at or above this level on every remaining choice question, the leftover
   * uncertainty is unlikely to change the output, so stop and show those details as assumptions.
   * The full output-divergence test (compile M candidate prompts, compare downstream sketches) is
   * deferred until outcome data can calibrate it.
   */
  convergeAt: 0.8,
} as const;

const RESOLVED = new Set(["stated", "answered", "edited", "delegated", "removed", "remembered"]);

export function isResolved(slot: Slot): boolean {
  return RESOLVED.has(slot.status);
}

export function questionsAsked(state: Pick<ConversationState, "rounds">): number {
  return state.rounds.reduce((n, r) => n + r.questions.length, 0);
}

export function budgetFor(complexity: number): { maxRounds: number; maxQuestions: number } {
  const c = Math.min(5, Math.max(1, Math.round(complexity)));
  if (c <= 1) return { maxRounds: 1, maxQuestions: 2 };
  if (c === 2) return { maxRounds: 1, maxQuestions: 3 };
  if (c === 3) return { maxRounds: 2, maxQuestions: 5 };
  return { maxRounds: 3, maxQuestions: 6 };
}

export function tauAsk(asked: number, stakes: ConversationState["task"]["stakes"]): number {
  return (POLICY.tauAsk0 * Math.pow(1 + POLICY.alpha, asked)) / POLICY.stakes[stakes];
}

export function answerability(slot: Slot, expertise: ConversationState["task"]["expertise"]): number {
  if (!slot.technical) return 1;
  return expertise === "expert" ? 0.9 : expertise === "intermediate" ? 0.55 : 0.2;
}

export function uncertainty(slot: Slot): number {
  if (slot.candidates.length === 0) return POLICY.openSlotUncertainty;
  return Math.max(0, Math.min(1, 1 - slot.confidence));
}

/** Score one unresolved slot: VOI = U × I × stakes; Net = A × VOI × ρ − κ × effort. */
export function scoreSlot(slot: Slot, task: ConversationState["task"]) {
  const format = slot.question?.format ?? (slot.candidates.length ? "single_choice" : "free_text");
  const voi = uncertainty(slot) * slot.impact * POLICY.stakes[task.stakes];
  const a = answerability(slot, task.expertise);
  const effort = POLICY.effortSeconds[format] / 60;
  const net = a * voi * POLICY.resolution[format] - POLICY.kappa * effort;
  return { voi, net, answerability: a, effort };
}

/**
 * Per-slot three-way decision (Horvitz thresholds, research/06 §D.3) plus delegation for
 * technical slots the user is unlikely to be able to answer (research/06 §H.9).
 */
export function decideSlots(slots: Slot[], task: ConversationState["task"], asked: Set<string>, threshold: number): Slot[] {
  return slots.map((slot) => {
    if (isResolved(slot)) return { ...slot, decision: "resolved" as const, score: undefined };
    const score = scoreSlot(slot, task);
    let decision: Slot["decision"];
    if (asked.has(slot.id)) {
      // Never re-ask: an asked-but-unresolved slot (skipped / "not sure") stays an assumption.
      decision = "show";
    } else if (score.answerability < POLICY.delegateBelow && score.voi >= POLICY.tauShow) {
      decision = "delegate";
    } else if (score.net >= threshold && slot.question) {
      decision = "ask";
    } else if (score.voi >= POLICY.tauShow || slot.critical) {
      decision = "show";
    } else {
      decision = "silent";
    }
    return { ...slot, score, decision };
  });
}

/** Turn a slot into a question, using its candidates as options. */
export function toQuestion(slot: Slot, round: number): PlannedQuestion {
  const format = slot.question?.format ?? "free_text";
  const options = format === "free_text" ? [] : slot.candidates.slice(0, LIMITS.maxOptions).map(({ id, label, description }) => ({ id, label, description }));
  const top = [...slot.candidates].sort((a, b) => b.p - a.p)[0];
  return {
    id: `r${round}-${slot.id}`,
    slotId: slot.id,
    kind: "slot",
    label: slot.label,
    text: slot.question?.text ?? `What should I know about ${slot.label.toLowerCase()}?`,
    why: slot.question?.why,
    // A choice question needs at least two options; otherwise ask it as free text.
    format: format !== "free_text" && options.length < 2 ? "free_text" : format,
    options: options.length >= 2 ? options : [],
    defaultLabel: top?.label ?? slot.value,
    net: slot.score?.net ?? 0,
    source: "model",
  };
}

export function contradictionQuestion(c: Contradiction, round: number): PlannedQuestion {
  return {
    id: `r${round}-${c.id}`,
    slotId: c.id,
    kind: "contradiction",
    label: "Which matters more",
    text: c.question ?? c.description,
    why: c.description,
    format: c.options.length >= 2 ? "single_choice" : "free_text",
    options: c.options.length >= 2 ? c.options.slice(0, LIMITS.maxOptions) : [],
    // Finite so the state stays JSON-serialisable; contradictions are always placed first anyway.
    net: 1e6,
    source: "model",
  };
}

/** Normalised word overlap — used to keep re-phrased duplicates out of the queue. */
export function similarity(a: string, b: string): number {
  const tok = (x: string) =>
    new Set(
      x
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w)),
    );
  const A = tok(a);
  const B = tok(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}
const STOP = new Set(["the", "you", "your", "what", "which", "should", "would", "this", "that", "for", "and", "are", "with", "how", "will", "want", "does", "any"]);

/**
 * Select the next round (research/06 §E.1): highest net first; a root question goes alone with at
 * most two independent choice questions; at most one free-text question; free text last; capped by
 * the remaining question budget. Hard contradictions always come first.
 */
export function selectBatch(
  slots: Slot[],
  contradictions: Contradiction[],
  history: { asked: Set<string>; askedTexts: string[] },
  remaining: number,
  round: number,
): PlannedQuestion[] {
  const cap = Math.min(LIMITS.maxQuestionsPerRound, remaining);
  if (cap <= 0) return [];
  const batch: PlannedQuestion[] = [];

  // At most one contradiction per round, surfaced as a single confirmation question (research/06 §H.4).
  const hard = contradictions.find((c) => c.severity === "hard" && !history.asked.has(c.id));
  if (hard) batch.push(contradictionQuestion(hard, round));

  const asks = slots
    .filter((s) => s.decision === "ask")
    .sort((a, b) => (b.score?.net ?? 0) - (a.score?.net ?? 0))
    .map((s) => ({ slot: s, q: toQuestion(s, round) }))
    .filter(({ q }) => !history.askedTexts.some((t) => similarity(t, q.text) >= 0.75));

  const rootFirst = asks[0]?.slot.root;
  let freeText = 0;
  for (const { slot, q } of asks) {
    if (batch.length >= cap) break;
    if (q.format === "free_text") {
      if (freeText >= POLICY.maxFreeTextPerRound) continue;
      // With a root question in the round, only add cheap independent choice questions.
      if (rootFirst && slot !== asks[0]!.slot) continue;
      freeText++;
    }
    if (batch.some((b) => similarity(b.text, q.text) >= 0.75)) continue;
    batch.push(q);
  }
  // Free text last (research/06 §E.1 batch ordering).
  return [...batch.filter((q) => q.format !== "free_text"), ...batch.filter((q) => q.format === "free_text")];
}

/**
 * Impact-weighted agreement of the sampled interpretations over the given slots: Σ(I·conf)/ΣI.
 * Only slots with enumerated candidates have a sampled confidence; returns 1 when there are none.
 */
export function interpretationAgreement(slots: Slot[]): number {
  const sampled = slots.filter((s) => s.candidates.length >= 2);
  const w = sampled.reduce((n, s) => n + s.impact, 0);
  if (!sampled.length || w === 0) return 1;
  return sampled.reduce((n, s) => n + s.impact * s.confidence, 0) / w;
}

/** Combinable stop rules (research/06 §F). */
export function computeStop(input: {
  answers: AnswerEvent[];
  roundsUsed: number;
  asked: number;
  budget: { maxRounds: number; maxQuestions: number };
  candidates: PlannedQuestion[];
  userRequested: boolean;
  threshold: number;
  maxNet: number;
  /** Agreement over the slots behind `candidates` (see interpretationAgreement). */
  agreement?: number;
  /** True when every candidate question is a choice question with sampled candidates. */
  candidatesSampled?: boolean;
  operatorStopped?: boolean;
}): { shouldStop: boolean; reasons: StopReason[] } {
  const reasons: StopReason[] = [];
  if (input.userRequested) reasons.push("user_requested");
  if (input.operatorStopped) reasons.push("operator_stopped");
  if (input.roundsUsed >= input.budget.maxRounds || input.asked >= input.budget.maxQuestions) reasons.push("budget_exhausted");

  // Diminishing returns: the last round produced no real information.
  const lastRound = Math.max(-1, ...input.answers.map((a) => a.round));
  const last = input.answers.filter((a) => a.round === lastRound);
  if (last.length >= 2 && last.every((a) => a.kind === "you_decide" || a.kind === "not_sure" || a.kind === "skipped")) {
    reasons.push("diminishing_returns");
  }

  if (input.candidates.length === 0) reasons.push(input.roundsUsed === 0 ? "fast_path" : "value_below_threshold");
  else if (
    input.roundsUsed >= 1 &&
    input.candidatesSampled &&
    !input.candidates.some((q) => q.kind === "contradiction") &&
    (input.agreement ?? 0) >= POLICY.convergeAt
  ) {
    reasons.push("interpretations_converged");
  }
  return { shouldStop: reasons.length > 0, reasons };
}
