import { describe, expect, it } from "vitest";
import type { AnalysisOutput, SampleOutput } from "./stages";
import type { ConversationState, LlmCall, PromptIR, Slot } from "./schema";
import { ConversationState as StateSchema } from "./schema";
import { applySamples, mergeAnalysis, plan, PRIOR_STRENGTH } from "./derive";
import { budgetFor, computeStop, decideSlots, scoreSlot, selectBatch, similarity, tauAsk, POLICY } from "./policy";
import { answer, compose, createState, editSlot, EngineError, finish, revise, start, type LlmProvider } from "./orchestrator";
import { coverage, fallbackIR, renderPrompt, repairIR } from "./render";
import { MockProvider, mockFamily } from "./mock";
import { FAMILIES } from "./templates";

// ---------------------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------------------

const call: LlmCall = { stage: "t", model: "test", ms: 0, inputTokens: 0, outputTokens: 0, ok: true };

function analysis(overrides: Partial<AnalysisOutput> = {}, known: Record<string, string> = {}): AnalysisOutput {
  const fam = overrides.family ?? "writing";
  return {
    family: fam,
    family_confidence: "high",
    title: "Email to landlord",
    goal: "Get the boiler repaired",
    deliverable: "An email",
    success_criteria: [],
    expertise: "novice",
    stakes: "medium",
    complexity: 3,
    slots: FAMILIES[fam].slots.map((t) => ({
      id: t.id,
      known: t.id in known,
      value: known[t.id] ?? "",
      source: t.id in known ? "request" : "none",
      candidates:
        t.id in known || t.format === "free_text"
          ? []
          : [
              { id: "a", label: `${t.label} A`, description: "" },
              { id: "b", label: `${t.label} B`, description: "" },
              { id: "c", label: `${t.label} C`, description: "" },
            ],
      question: `Question about ${t.label}?`,
      why: "",
      format: t.format,
    })),
    discovered: [],
    contradictions: [],
    injection_suspected: false,
    ...overrides,
  };
}

/** Scripted provider: returns queued analyses; samples always agree on candidate "a". */
class ScriptedProvider implements LlmProvider {
  readonly mock = false;
  readonly samples = 4;
  analyses: AnalysisOutput[] = [];
  composeImpl: () => Promise<PromptIR> = async () => irFixture();
  analyseCalls = 0;
  constructor(...a: AnalysisOutput[]) {
    this.analyses = a;
  }
  async analyse() {
    const a = this.analyses[Math.min(this.analyseCalls, this.analyses.length - 1)]!;
    this.analyseCalls++;
    return { data: a, call };
  }
  async sample(_s: ConversationState, open: { id: string; options: { id: string }[] }[]) {
    return { data: { choices: open.map((o) => ({ slot_id: o.id, candidate_id: o.options[0]!.id })) } as SampleOutput, call };
  }
  async compose() {
    return { data: await this.composeImpl(), call };
  }
}

function irFixture(over: Partial<PromptIR> = {}): PromptIR {
  return {
    title: "T",
    objective: "Write an email asking the landlord to fix the boiler.",
    context: ["The boiler has been broken for 9 days."],
    audience: "",
    requirements: [{ text: "Ask for a repair date within 48 hours", priority: "must" }],
    constraints: [],
    decisions_for_model: [],
    assumptions: [],
    output_format: "",
    output_structure: [],
    success_criteria: [],
    out_of_scope: [],
    clarify_first: [],
    approach: [],
    ...over,
  };
}

function slot(over: Partial<Slot>): Slot {
  return {
    id: "x",
    label: "X",
    group: "context",
    origin: "template",
    status: "assumed",
    candidates: [
      { id: "a", label: "A", p: 0.5 },
      { id: "b", label: "B", p: 0.5 },
    ],
    confidence: 0.5,
    impact: 0.9,
    critical: true,
    technical: false,
    root: false,
    question: { text: "Which X?", format: "single_choice" },
    ...over,
  };
}
const task = { family: "writing" as const, familyConfidence: "high" as const, complexity: 3, stakes: "medium" as const, expertise: "novice" as const };

// ---------------------------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------------------------

describe("policy: value of asking", () => {
  it("scores VOI as uncertainty × impact × stakes", () => {
    const s = scoreSlot(slot({ confidence: 0.6, impact: 0.5 }), task);
    expect(s.voi).toBeCloseTo(0.4 * 0.5 * 1);
  });

  it("raises the ask threshold with every question asked (diminishing patience)", () => {
    expect(tauAsk(0, "medium")).toBeCloseTo(POLICY.tauAsk0);
    expect(tauAsk(3, "medium")).toBeGreaterThan(tauAsk(1, "medium"));
    expect(tauAsk(0, "high")).toBeLessThan(tauAsk(0, "low"));
  });

  it("asks high-impact uncertain slots, shows mid ones, hides trivial ones", () => {
    const slots = decideSlots(
      [
        slot({ id: "big", impact: 0.9, confidence: 0.4 }),
        slot({ id: "mid", impact: 0.3, confidence: 0.6, critical: false }),
        slot({ id: "tiny", impact: 0.05, confidence: 0.9, critical: false }),
      ],
      task,
      new Set(),
      tauAsk(0, "medium"),
    );
    expect(slots.map((s) => s.decision)).toEqual(["ask", "show", "silent"]);
  });

  it("delegates technical slots for novices instead of asking (research/06 §H.9)", () => {
    const [s] = decideSlots([slot({ technical: true, impact: 0.9, confidence: 0.3 })], task, new Set(), 0.12);
    expect(s!.decision).toBe("delegate");
    const [e] = decideSlots([slot({ technical: true, impact: 0.9, confidence: 0.3 })], { ...task, expertise: "expert" }, new Set(), 0.12);
    expect(e!.decision).toBe("ask");
  });

  it("never re-asks a slot that was already asked", () => {
    const [s] = decideSlots([slot({ id: "x", impact: 1, confidence: 0.2 })], task, new Set(["x"]), 0.01);
    expect(s!.decision).toBe("show");
  });

  it("does not ask about resolved slots", () => {
    const [s] = decideSlots([slot({ status: "answered", value: "v" })], task, new Set(), 0);
    expect(s!.decision).toBe("resolved");
  });

  it("budgets scale with complexity", () => {
    expect(budgetFor(1)).toEqual({ maxRounds: 1, maxQuestions: 2 });
    expect(budgetFor(5).maxQuestions).toBe(6);
  });
});

describe("policy: batching", () => {
  const decided = (xs: Slot[]) => decideSlots(xs, task, new Set(), 0.05);

  it("caps a round at three questions and puts free text last", () => {
    const slots = decided([
      slot({ id: "f", question: { text: "Tell me the key facts", format: "free_text" }, candidates: [], impact: 1 }),
      slot({ id: "a", question: { text: "Who reads this?", format: "single_choice" } }),
      slot({ id: "b", question: { text: "What tone fits?", format: "single_choice" } }),
      slot({ id: "c", question: { text: "How long should it be?", format: "single_choice" } }),
    ]);
    const batch = selectBatch(slots, [], { asked: new Set(), askedTexts: [] }, 10, 0);
    expect(batch).toHaveLength(3);
    expect(batch.at(-1)!.format).toBe("free_text");
  });

  it("allows at most one free-text question per round", () => {
    const slots = decided([
      slot({ id: "f1", question: { text: "Describe the features", format: "free_text" }, candidates: [] }),
      slot({ id: "f2", question: { text: "Paste the error message", format: "free_text" }, candidates: [] }),
    ]);
    expect(selectBatch(slots, [], { asked: new Set(), askedTexts: [] }, 10, 0)).toHaveLength(1);
  });

  it("respects the remaining question budget", () => {
    const slots = decided([slot({ id: "a", question: { text: "Who reads it?", format: "single_choice" } }), slot({ id: "b", question: { text: "Which tone?", format: "single_choice" } })]);
    expect(selectBatch(slots, [], { asked: new Set(), askedTexts: [] }, 1, 0)).toHaveLength(1);
    expect(selectBatch(slots, [], { asked: new Set(), askedTexts: [] }, 0, 0)).toHaveLength(0);
  });

  it("filters rephrased duplicates of questions already asked", () => {
    const slots = decided([slot({ id: "new", question: { text: "Who exactly will read this email?", format: "single_choice" } })]);
    const batch = selectBatch(slots, [], { asked: new Set(), askedTexts: ["Who will read this email?"] }, 5, 1);
    expect(batch).toHaveLength(0);
    expect(similarity("Who will read this email?", "What colour should the logo be?")).toBeLessThan(0.3);
  });

  it("puts unresolved hard contradictions first", () => {
    const slots = decided([slot({ id: "a", question: { text: "Who reads it?", format: "single_choice" } })]);
    const batch = selectBatch(
      slots,
      [{ id: "c-x", description: "Free vs paid", slotIds: [], severity: "hard", question: "Which matters more?", options: [{ id: "a", label: "Free" }, { id: "b", label: "Paid" }] }],
      { asked: new Set(), askedTexts: [] },
      5,
      0,
    );
    expect(batch[0]!.kind).toBe("contradiction");
  });

  it("turns a choice question with fewer than two options into free text", () => {
    const slots = decided([slot({ id: "a", candidates: [{ id: "only", label: "Only", p: 0.4 }], confidence: 0.4 })]);
    const [q] = selectBatch(slots, [], { asked: new Set(), askedTexts: [] }, 5, 0);
    expect(q!.format).toBe("free_text");
    expect(q!.options).toEqual([]);
  });
});

describe("policy: stop rules", () => {
  const base = { answers: [], roundsUsed: 0, asked: 0, budget: { maxRounds: 2, maxQuestions: 5 }, candidates: [], userRequested: false, threshold: 0.1, maxNet: 0 };
  it("fast path when nothing is worth asking on the first pass", () => {
    expect(computeStop(base).reasons).toEqual(["fast_path"]);
  });
  it("stops on budget", () => {
    expect(computeStop({ ...base, roundsUsed: 2, candidates: [{} as never] }).reasons).toContain("budget_exhausted");
  });
  it("stops when the user asks", () => {
    expect(computeStop({ ...base, userRequested: true, candidates: [{} as never] }).shouldStop).toBe(true);
  });
  it("stops on diminishing returns (a round of 'you decide')", () => {
    const answers = ["a", "b"].map((id) => ({ questionId: id, slotId: id, round: 0, question: "?", label: id, kind: "you_decide" as const }));
    expect(computeStop({ ...base, roundsUsed: 1, answers, candidates: [{} as never] }).reasons).toContain("diminishing_returns");
  });
  it("continues when valuable questions remain within budget", () => {
    expect(computeStop({ ...base, roundsUsed: 1, asked: 2, candidates: [{} as never] }).shouldStop).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------------------------

describe("derive", () => {
  const fresh = () => createState("Write an email to my landlord", "generic", false);

  it("creates one slot per template slot and marks stated facts", () => {
    const s = mergeAnalysis(fresh(), analysis({}, { reader: "My landlord" }));
    expect(s.slots).toHaveLength(FAMILIES.writing.slots.length);
    expect(s.slots.find((x) => x.id === "reader")).toMatchObject({ status: "stated", value: "My landlord" });
  });

  it("computes smoothed consistency confidence from samples", () => {
    let s = mergeAnalysis(fresh(), analysis());
    const k = 4;
    const samples: SampleOutput[] = Array.from({ length: k }, () => ({ choices: [{ slot_id: "tone", candidate_id: "a" }] }));
    s = applySamples(s, samples);
    const tone = s.slots.find((x) => x.id === "tone")!;
    expect(tone.confidence).toBeCloseTo((k + PRIOR_STRENGTH / 3) / (k + PRIOR_STRENGTH));
    expect(tone.value).toBe("Tone A");
    // A slot with split readings is less certain.
    const split = applySamples(mergeAnalysis(fresh(), analysis()), [
      { choices: [{ slot_id: "tone", candidate_id: "a" }] },
      { choices: [{ slot_id: "tone", candidate_id: "b" }] },
      { choices: [{ slot_id: "tone", candidate_id: "c" }] },
      { choices: [{ slot_id: "tone", candidate_id: "a" }] },
    ]);
    expect(split.slots.find((x) => x.id === "tone")!.confidence).toBeLessThan(tone.confidence);
  });

  it("ignores sample choices that don't match a candidate", () => {
    const s = applySamples(mergeAnalysis(fresh(), analysis()), [{ choices: [{ slot_id: "tone", candidate_id: "invented" }] }]);
    expect(s.slots.find((x) => x.id === "tone")!.confidence).toBeCloseTo(1 / 3);
  });

  it("edits beat answers, answers beat the analysis", () => {
    let s = fresh();
    s = {
      ...s,
      answers: [{ questionId: "q", slotId: "tone", round: 0, question: "?", label: "Tone", kind: "text", value: "Firm" }],
      edits: [{ slotId: "reader", label: "Reader", value: "Property manager" }],
    };
    s = mergeAnalysis(s, analysis({}, { reader: "Landlord", tone: "Friendly" }));
    expect(s.slots.find((x) => x.id === "tone")).toMatchObject({ status: "answered", value: "Firm" });
    expect(s.slots.find((x) => x.id === "reader")).toMatchObject({ status: "edited", value: "Property manager" });
  });

  it("'You decide' delegates the slot", () => {
    const s = mergeAnalysis(
      { ...fresh(), answers: [{ questionId: "q", slotId: "tone", round: 0, question: "?", label: "Tone", kind: "you_decide" }] },
      analysis(),
    );
    expect(s.slots.find((x) => x.id === "tone")!.status).toBe("delegated");
  });

  it("keeps answered discovered slots even if a later analysis drops them", () => {
    let s = mergeAnalysis(fresh(), analysis({
      discovered: [{ id: "deadline", label: "Deadline", group: "constraints", impact: "high", known: false, value: "", source: "none", candidates: [], question: "When is it due?", why: "", format: "free_text" }],
    }));
    s = { ...s, answers: [{ questionId: "q", slotId: "deadline", round: 0, question: "When?", label: "Deadline", kind: "text", value: "Friday" }] };
    const next = mergeAnalysis(s, analysis());
    expect(next.slots.find((x) => x.id === "deadline")).toMatchObject({ status: "answered", value: "Friday" });
  });

  it("clamps out-of-range model values and caps options", () => {
    const a = analysis({ complexity: 42 });
    a.slots[0]!.candidates = Array.from({ length: 9 }, (_, i) => ({ id: `o${i}`, label: `Option ${i}`, description: "" }));
    const s = mergeAnalysis(fresh(), a);
    expect(s.task.complexity).toBe(5);
    expect(s.slots[0]!.candidates.length).toBeLessThanOrEqual(4);
  });

  it("drops 'other'/'you decide' style options the model adds", () => {
    const a = analysis();
    a.slots[0]!.candidates = [
      { id: "x", label: "Email", description: "" },
      { id: "y", label: "Other", description: "" },
      { id: "z", label: "You decide", description: "" },
    ];
    expect(mergeAnalysis(fresh(), a).slots[0]!.candidates.map((c) => c.label)).toEqual(["Email"]);
  });
});

// ---------------------------------------------------------------------------------------------
// Orchestrator — full journeys
// ---------------------------------------------------------------------------------------------

describe("orchestrator", () => {
  it("fast path: a fully specified request gets zero questions", async () => {
    const all = Object.fromEntries(FAMILIES.writing.slots.map((t) => [t.id, `value for ${t.id}`]));
    const p = new ScriptedProvider(analysis({ complexity: 1 }, all));
    const s = await start("Write a 120-word, warm email to my manager Sam asking to move our 1:1 to Thursday.", "generic", p);
    expect(s.pending).toHaveLength(0);
    expect(s.stop.reasons).toContain("fast_path");
    expect(s.phase).toBe("ready_to_compose");
  });

  it("asks about gaps, adapts to answers and stops within budget", async () => {
    const first = analysis();
    // After answers, the model reports the answered facts as known.
    const second = analysis({}, { piece: "Email", purpose: "Get repair", reader: "Landlord", key_points: "Boiler broken 9 days" });
    const p = new ScriptedProvider(first, second);
    let s = await start("Write an email", "generic", p);
    expect(s.phase).toBe("questioning");
    expect(s.pending.length).toBeGreaterThan(0);
    expect(s.pending.length).toBeLessThanOrEqual(3);

    const asked1 = new Set(s.pending.map((q) => q.slotId));
    s = await answer(s, s.pending.map((q) => (q.options.length ? { questionId: q.id, kind: "option", optionIds: [q.options[0]!.id] } : { questionId: q.id, kind: "text", text: "Boiler broken 9 days" })), p);

    // Never re-asks the same slot.
    for (const q of s.pending) expect(asked1.has(q.slotId)).toBe(false);
    const total = s.rounds.reduce((n, r) => n + r.questions.length, 0);
    expect(total).toBeLessThanOrEqual(s.budget.maxQuestions);
    expect(s.rounds.length).toBeLessThanOrEqual(s.budget.maxRounds);
  });

  it("terminates: repeated answering never exceeds the budget (loop prevention)", async () => {
    const p = new ScriptedProvider(analysis({ complexity: 5 }));
    let s = await start("Help", "generic", p);
    for (let i = 0; i < 10 && s.phase === "questioning"; i++) {
      s = await answer(s, s.pending.map((q) => ({ questionId: q.id, kind: "not_sure" })), p);
    }
    expect(s.phase).toBe("ready_to_compose");
    expect(s.rounds.reduce((n, r) => n + r.questions.length, 0)).toBeLessThanOrEqual(6);
  });

  it("revising an answer replaces it without duplicating events", async () => {
    const p = new ScriptedProvider(analysis());
    let s = await start("Write an email", "generic", p);
    const q = s.pending.find((x) => x.options.length)!;
    s = await answer(s, [{ questionId: q.id, kind: "option", optionIds: [q.options[0]!.id] }], p);
    const before = s.answers.length;
    s = await revise(s, { questionId: q.id, kind: "option", optionIds: [q.options[1]!.id] }, p);
    expect(s.answers).toHaveLength(before);
    const ev = s.answers.find((a) => a.questionId === q.id)!;
    expect(ev.value).toBe(q.options[1]!.label);
    expect(ev.revised).toBe(true);
    expect(s.slots.find((x) => x.id === q.slotId)!.value).toBe(q.options[1]!.label);
  });

  it("rejects answers to questions that aren't part of the session", async () => {
    const p = new ScriptedProvider(analysis());
    const s = await start("Write an email", "generic", p);
    await expect(answer(s, [{ questionId: "bogus", kind: "text", text: "x" }], p)).resolves.toBeDefined(); // ignored, recorded as skipped
    await expect(revise(s, { questionId: "bogus", kind: "text", text: "x" }, p)).rejects.toBeInstanceOf(EngineError);
  });

  it("'write it now' stops immediately, keeps given answers and makes no model call", async () => {
    const p = new ScriptedProvider(analysis());
    let s = await start("Write an email", "generic", p);
    const calls = p.analyseCalls;
    const q = s.pending[0]!;
    s = finish(s, [{ questionId: q.id, kind: "text", text: "Something specific" }]);
    expect(p.analyseCalls).toBe(calls);
    expect(s.phase).toBe("ready_to_compose");
    expect(s.stop.reasons).toContain("user_requested");
    expect(s.answers).toHaveLength(1);
    expect(s.slots.some((x) => x.status === "assumed")).toBe(true);
  });

  it("brief edits pin values and mark the prompt stale", async () => {
    const p = new ScriptedProvider(analysis());
    let s = finish(await start("Write an email", "generic", p));
    s = await compose(s, p);
    s = editSlot(s, "tone", "Very formal");
    expect(s.slots.find((x) => x.id === "tone")).toMatchObject({ status: "edited", value: "Very formal" });
    expect(s.promptStale).toBe(true);
    s = editSlot(s, "length", null);
    expect(s.slots.find((x) => x.id === "length")!.status).toBe("removed");
    expect(() => editSlot(s, "tone", "   ")).toThrow(EngineError);
  });

  it("compose degrades gracefully to a deterministic prompt when the model fails", async () => {
    const p = new ScriptedProvider(analysis());
    p.composeImpl = async () => {
      throw new EngineError("provider_failed", "down", true);
    };
    const s = await compose(finish(await start("Write an email to my landlord", "generic", p)), p);
    expect(s.phase).toBe("composed");
    expect(s.prompts.at(-1)!.source).toBe("fallback");
    expect(s.prompts.at(-1)!.text).toContain("landlord");
    expect(s.prompts.at(-1)!.warnings.length).toBeGreaterThan(0);
  });

  it("rejects empty and oversized requests", () => {
    expect(() => createState("   ", "generic", false)).toThrow(EngineError);
    expect(() => createState("x".repeat(9000), "generic", false)).toThrow(EngineError);
  });

  it("produces states that satisfy the schema", async () => {
    const p = new ScriptedProvider(analysis());
    const s = await compose(finish(await start("Write an email", "generic", p)), p);
    expect(StateSchema.safeParse(s).success).toBe(true);
  });
});

describe("mock provider (development only)", () => {
  it("runs the complete journey offline and labels itself as mock", async () => {
    const p = new MockProvider();
    let s = await start("Build me a website for my dog grooming business", "app_builder", p);
    expect(s.mock).toBe(true);
    expect(s.task.family).toBe("app_build");
    for (let i = 0; i < 5 && s.phase === "questioning"; i++) {
      s = await answer(s, s.pending.map((q) => ({ questionId: q.id, kind: q.options.length ? "option" : "text", optionIds: q.options.length ? [q.options[0]!.id] : undefined, text: q.options.length ? undefined : "Online booking and a price list" })), p);
    }
    s = await compose(s, p);
    expect(s.prompts.at(-1)!.source).toBe("mock");
    expect(s.prompts.at(-1)!.text).toContain("Online booking");
  });
  it("classifies families by keyword", () => {
    expect(mockFamily("fix this crash in my python script")).toBe("coding_task");
    expect(mockFamily("research the market for dental software")).toBe("research");
  });
});

// ---------------------------------------------------------------------------------------------
// Rendering & validation
// ---------------------------------------------------------------------------------------------

describe("render", () => {
  it("omits empty sections and leads with the objective", () => {
    const text = renderPrompt(irFixture(), "generic", "writing");
    expect(text.startsWith("Write an email")).toBe(true);
    expect(text).not.toContain("## Constraints");
    expect(text).toContain("## Must include");
  });

  it("adapts structure to the target", () => {
    const ir = irFixture({ requirements: [{ text: "Booking form", priority: "must" }, { text: "Price list", priority: "must" }], out_of_scope: ["Payments"] });
    const app = renderPrompt(ir, "app_builder", "app_build");
    expect(app).toContain("## Core features (in build order)\n1. Booking form\n2. Price list");
    expect(app).toContain("## Not in this version");
    const code = renderPrompt(irFixture({ constraints: ["Keep the public API"] }), "coding_agent", "coding_task");
    expect(code).toContain("## Constraints — do not break");
  });

  it("caps clarify-first questions at two", () => {
    const text = renderPrompt(irFixture({ clarify_first: ["a", "b", "c"] }), "generic", "general");
    expect(text.match(/^- /gm)!.length).toBeLessThanOrEqual(4);
    expect(text).not.toContain("- c");
  });

  it("restores user-confirmed details the composer dropped", async () => {
    const p = new ScriptedProvider(analysis());
    let s = await start("Write an email", "generic", p);
    s = { ...s, slots: s.slots.map((x) => (x.id === "key_points" ? { ...x, status: "answered" as const, value: "Deposit of £850 still unreturned" } : x)) };
    const { ir, warnings } = repairIR(irFixture(), s);
    expect(JSON.stringify(ir)).toContain("£850");
    expect(warnings[0]).toMatch(/Restored 1 detail/);
    expect(coverage("the deposit of 850 pounds", "Deposit of £850")).toBeGreaterThan(0.4);
  });

  it("fallback IR never invents content beyond the brief", async () => {
    const p = new ScriptedProvider(analysis());
    const s = finish(await start("Write an email to my landlord", "generic", p));
    const ir = fallbackIR(s);
    expect(ir.context[0]).toContain("Write an email to my landlord");
  });
});

describe("plan integration", () => {
  it("does not stack a new round on top of an unanswered one when re-planned", async () => {
    const p = new ScriptedProvider(analysis());
    const s = await start("Write an email", "generic", p);
    const replanned = plan({ ...s, rounds: s.rounds.slice(0, -1), pending: [] });
    expect(replanned.rounds).toHaveLength(1);
  });
});
