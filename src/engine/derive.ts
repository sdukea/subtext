/**
 * Deterministic state derivation.
 *
 *   record (request, answers, edits) + analysis  → mergeAnalysis → slots with candidates
 *   + K sampled readings                         → applySamples  → consistency-based confidence
 *   + policy                                     → plan          → decisions, next round, stop
 *
 * Precedence for a slot's value: Brief edit > answer > stated in request/answers > engine default.
 * Because the state is re-derived from the record every turn, revising an answer cannot leave
 * stale values behind.
 */
import type { AnalysisOutput, SampleOutput } from "./stages";
import type { AnswerEvent, Candidate, ConversationState, Contradiction, Slot } from "./schema";
import { LIMITS } from "./schema";
import { FAMILIES } from "./templates";
import { budgetFor, computeStop, decideSlots, interpretationAgreement, isResolved, questionsAsked, selectBatch, tauAsk } from "./policy";

/** Dirichlet smoothing strength for sampled probabilities (research/06 §D.4). */
export const PRIOR_STRENGTH = 2;

const snake = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "x";

const trimTo = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function cleanCandidates(raw: { id: string; label: string; description?: string }[]): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    const label = trimTo(c.label.trim(), 80);
    if (!label) continue;
    if (/^(other|you decide|not sure|something else)\b/i.test(label)) continue;
    let id = snake(c.id || label);
    while (seen.has(id)) id += "_";
    seen.add(id);
    out.push({ id, label, description: c.description?.trim() ? trimTo(c.description.trim(), 160) : undefined, p: 0 });
    if (out.length >= LIMITS.maxOptions) break;
  }
  const n = out.length || 1;
  return out.map((c) => ({ ...c, p: 1 / n }));
}

export function latestAnswerBySlot(answers: AnswerEvent[]): Map<string, AnswerEvent> {
  const m = new Map<string, AnswerEvent>();
  for (const a of answers) m.set(a.slotId, a);
  return m;
}

const impactOf = { low: 0.3, medium: 0.5, high: 0.7 } as const;

/** Apply the record's events on top of a slot's analysed status. */
function applyEvents(slot: Slot, answer: AnswerEvent | undefined, edit: ConversationState["edits"][number] | undefined): Slot {
  if (edit) {
    return edit.value === null
      ? { ...slot, status: "removed", value: undefined }
      : { ...slot, status: "edited", value: edit.value };
  }
  if (answer) {
    switch (answer.kind) {
      case "option":
      case "text":
        if (answer.value?.trim()) return { ...slot, status: "answered", value: answer.value.trim() };
        break;
      case "you_decide":
        return { ...slot, status: "delegated", value: slot.value || topCandidate(slot)?.label };
      case "not_sure":
      case "skipped":
        // Recorded; the slot stays an unresolved assumption and is never re-asked.
        return slot;
    }
  }
  return slot;
}

function topCandidate(slot: Pick<Slot, "candidates">): Candidate | undefined {
  return [...slot.candidates].sort((a, b) => b.p - a.p)[0];
}

export function mergeAnalysis(state: ConversationState, analysis: AnalysisOutput): ConversationState {
  const family = analysis.family;
  const tpl = FAMILIES[family];
  const answers = latestAnswerBySlot(state.answers);
  const edits = new Map(state.edits.map((e) => [e.slotId, e]));
  const prior = new Map(state.slots.map((s) => [s.id, s]));
  const memory = new Map(state.memory.filter((m) => m.slotId).map((m) => [m.slotId!, m]));

  const slots: Slot[] = [];
  for (const t of tpl.slots) {
    const r = analysis.slots.find((x) => x.id === t.id);
    const candidates = r && !r.known ? cleanCandidates(r.candidates) : [];
    const known = !!r?.known && !!r.value.trim();
    const base: Slot = {
      id: t.id,
      label: t.label,
      group: t.group,
      origin: "template",
      status: known ? (r!.source === "answers" ? "answered" : "stated") : "assumed",
      value: known ? trimTo(r!.value.trim(), 400) : undefined,
      candidates,
      confidence: candidates.length ? 1 / candidates.length : 0,
      impact: t.impact,
      critical: t.critical,
      technical: t.technical,
      root: t.root,
      question: r?.question.trim()
        ? { text: trimTo(r.question.trim(), 200), why: r.why.trim() ? trimTo(r.why.trim(), 160) : undefined, format: r.format }
        : undefined,
    };
    if (!known && !base.value) base.value = topCandidate(base)?.label ?? t.fallback;
    // Remembered context fills a slot the current request leaves open (precedence: below anything said now).
    const remembered = !known ? memory.get(t.id) : undefined;
    if (remembered) Object.assign(base, { status: "remembered" as const, value: trimTo(remembered.value, 400) });
    slots.push(applyEvents(base, answers.get(t.id), edits.get(t.id)));
  }

  // Discovered slots (open slot discovery, research/06 §C.3). Impact shrunk toward 0.4.
  const templateIds = new Set(tpl.slots.map((t) => t.id));
  for (const d of analysis.discovered.slice(0, LIMITS.maxDiscoveredSlots)) {
    const id = snake(d.id);
    if (templateIds.has(id) || slots.some((s) => s.id === id)) continue;
    const candidates = d.known ? [] : cleanCandidates(d.candidates);
    const known = d.known && !!d.value.trim();
    const base: Slot = {
      id,
      label: trimTo(d.label.trim() || id, 40),
      group: d.group,
      origin: "discovered",
      status: known ? (d.source === "answers" ? "answered" : "stated") : "assumed",
      value: known ? trimTo(d.value.trim(), 400) : candidates[0]?.label,
      candidates,
      confidence: candidates.length ? 1 / candidates.length : 0,
      impact: 0.5 * impactOf[d.impact] + 0.5 * 0.4,
      critical: false,
      technical: false,
      root: false,
      question: d.question.trim() ? { text: trimTo(d.question.trim(), 200), why: d.why.trim() || undefined, format: d.format } : undefined,
    };
    slots.push(applyEvents(base, answers.get(id), edits.get(id)));
  }

  // Keep any slot the user has answered or edited even if this analysis dropped it.
  for (const id of new Set([...answers.keys(), ...edits.keys()])) {
    if (slots.some((s) => s.id === id)) continue;
    const p = prior.get(id);
    if (p) slots.push(applyEvents({ ...p }, answers.get(id), edits.get(id)));
  }

  const contradictions: Contradiction[] = analysis.contradictions.map((c) => ({
    id: `c-${[...c.slot_ids].map(snake).sort().join("+") || snake(c.description)}`,
    description: trimTo(c.description, 240),
    slotIds: c.slot_ids,
    severity: c.severity,
    question: c.question.trim() || undefined,
    options: cleanCandidates(c.options).map(({ id, label, description }) => ({ id, label, description })),
  }));

  return {
    ...state,
    intent: {
      title: trimTo(analysis.title.trim() || state.intent.title || "Untitled", 60),
      goal: trimTo(analysis.goal.trim(), 300),
      deliverable: trimTo(analysis.deliverable.trim(), 200),
      successCriteria: analysis.success_criteria.slice(0, 3).map((x) => trimTo(x, 200)),
    },
    task: {
      family,
      familyConfidence: analysis.family_confidence,
      complexity: Math.min(5, Math.max(1, Math.round(analysis.complexity))),
      stakes: analysis.stakes,
      expertise: analysis.expertise,
    },
    slots,
    contradictions,
    safety: { injectionSuspected: analysis.injection_suspected },
  };
}

/**
 * Turn K independent readings into consistency-based probabilities, smoothed with a uniform
 * prior: p_i = (count_i + α/n) / (K + α). Confidence = max_i p_i — never self-reported.
 */
export function applySamples(state: ConversationState, samples: SampleOutput[]): ConversationState {
  const slots = state.slots.map((slot) => {
    if (isResolved(slot) || slot.candidates.length < 2) return slot;
    const n = slot.candidates.length;
    const counts = new Map(slot.candidates.map((c) => [c.id, 0]));
    let k = 0; // only valid votes count
    for (const s of samples) {
      const choice = s.choices.find((c) => c.slot_id === slot.id);
      if (choice && counts.has(choice.candidate_id)) {
        counts.set(choice.candidate_id, counts.get(choice.candidate_id)! + 1);
        k++;
      }
    }
    const candidates = slot.candidates.map((c) => ({ ...c, p: (counts.get(c.id)! + PRIOR_STRENGTH / n) / (k + PRIOR_STRENGTH) }));
    const confidence = Math.max(...candidates.map((c) => c.p));
    const top = topCandidate({ candidates });
    const value = slot.status === "assumed" ? top?.label ?? slot.value : slot.value;
    return { ...slot, candidates, confidence, value };
  });
  return { ...state, slots };
}

/** Decide every slot, pick the next round (if any) and evaluate the stop rules. */
export function plan(state: ConversationState, opts: { userRequested?: boolean; operatorStopped?: boolean } = {}): ConversationState {
  const asked = new Set(state.answers.map((a) => a.slotId));
  for (const r of state.rounds) for (const q of r.questions) asked.add(q.slotId);
  const askedTexts = state.rounds.flatMap((r) => r.questions.map((q) => q.text));
  const nAsked = questionsAsked(state);
  const budget = budgetFor(state.task.complexity);
  const threshold = tauAsk(nAsked, state.task.stakes);

  let slots = decideSlots(state.slots, state.task, asked, threshold).map((s): Slot => {
    if (s.decision === "delegate") return { ...s, status: "delegated" };
    if (s.decision === "silent" && s.status === "assumed") return { ...s, status: "inferred" };
    if ((s.decision === "show" || s.decision === "ask") && s.status === "inferred") return { ...s, status: "assumed" };
    return s;
  });

  const remaining = budget.maxQuestions - nAsked;
  const roundIndex = state.rounds.length;
  const candidates = selectBatch(slots, state.contradictions, { asked, askedTexts }, remaining, roundIndex);
  const maxNet = Math.max(0, ...slots.map((s) => s.score?.net ?? 0));
  const candidateSlots = candidates.flatMap((q) => slots.filter((s) => s.id === q.slotId));
  const agreement = interpretationAgreement(candidateSlots);
  const candidatesSampled = candidates.length > 0 && candidateSlots.length === candidates.length && candidateSlots.every((s) => s.candidates.length >= 2);

  const stop = computeStop({
    answers: state.answers,
    roundsUsed: state.rounds.length,
    asked: nAsked,
    budget,
    candidates,
    userRequested: !!opts.userRequested,
    threshold,
    maxNet,
    agreement,
    candidatesSampled,
    operatorStopped: !!opts.operatorStopped,
  });

  if (stop.shouldStop) {
    // Remaining asks become visible assumptions (research/06 §F.1).
    slots = slots.map((s) => (s.decision === "ask" ? { ...s, decision: "show" as const } : s));
  }

  return {
    ...state,
    slots,
    budget,
    pending: stop.shouldStop ? [] : candidates,
    rounds: stop.shouldStop ? state.rounds : [...state.rounds, { index: roundIndex, questions: candidates, shownAt: new Date().toISOString() }],
    stop: { shouldStop: stop.shouldStop, reasons: stop.reasons, maxNet, threshold, agreement, criticalCovered: criticalCovered(slots) },
    phase: stop.shouldStop ? (state.phase === "composed" ? "composed" : "ready_to_compose") : "questioning",
  };
}

/**
 * Conflicts the user resolved by answering a contradiction question (research/06 §H.4). These
 * have no slot of their own, so they are carried explicitly into composition and the Brief.
 */
export function resolvedDecisions(state: Pick<ConversationState, "rounds" | "answers">): { questionId: string; question: string; decision: string }[] {
  const kinds = new Map(state.rounds.flatMap((r) => r.questions).map((q) => [q.id, q]));
  return state.answers.flatMap((a) => {
    const q = kinds.get(a.questionId);
    if (!q || q.kind !== "contradiction" || !(a.kind === "option" || a.kind === "text") || !a.value?.trim()) return [];
    return [{ questionId: a.questionId, question: q.text.replace(/\?\s*$/, ""), decision: a.value.trim() }];
  });
}

/** Research/06 §F.4: every critical slot is resolved, shown as an assumption, or delegated. */
export function criticalCovered(slots: Slot[]): boolean {
  return slots.filter((s) => s.critical).every((s) => isResolved(s) || s.decision === "show" || s.decision === "delegate" || s.status === "assumed");
}
