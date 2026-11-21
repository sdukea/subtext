/**
 * Tests for the Phase 0 validation-prototype capabilities: convergence stopping, single
 * contradiction questions, remembered context, "Keep" on assumptions, target-specific rendering,
 * and the Wizard-of-Oz operator flow.
 */
import { describe, expect, it } from "vitest";
import type { AnalysisOutput, SampleOutput } from "./stages";
import type { ConversationState, LlmCall, PromptIR } from "./schema";
import { ConversationState as StateSchema } from "./schema";
import { computeStop, interpretationAgreement, selectBatch } from "./policy";
import { answer, compose, editSlot, EngineError, finish, operatorStop, publishRound, start, type LlmProvider } from "./orchestrator";
import { renderPrompt } from "./render";
import { MockProvider } from "./mock";
import { FAMILIES } from "./templates";

const call: LlmCall = { stage: "t", model: "test", ms: 0, inputTokens: 0, outputTokens: 0, ok: true };

function analysis(family: AnalysisOutput["family"] = "app_build", over: Partial<AnalysisOutput> = {}): AnalysisOutput {
  return {
    family,
    family_confidence: "high",
    title: "Booking site",
    goal: "Let customers book online",
    deliverable: "A web app",
    success_criteria: [],
    expertise: "novice",
    stakes: "medium",
    complexity: 4,
    slots: FAMILIES[family].slots.map((t) => ({
      id: t.id,
      known: false,
      value: "",
      source: "none" as const,
      candidates: t.format === "free_text" ? [] : [{ id: "a", label: `${t.label} A`, description: "" }, { id: "b", label: `${t.label} B`, description: "" }, { id: "c", label: `${t.label} C`, description: "" }],
      question: `${t.hint}?`,
      why: "",
      format: t.format,
    })),
    discovered: [],
    contradictions: [],
    injection_suspected: false,
    ...over,
  };
}

/** Provider whose samples agree on the first option with a configurable share of readings. */
class Provider implements LlmProvider {
  readonly mock = false;
  constructor(public a: AnalysisOutput, public samples = 6, public agreeing = 6) {}
  async analyse() {
    return { data: this.a, call };
  }
  async sample(_s: ConversationState, open: { id: string; options: { id: string }[] }[], i: number) {
    const pick = i < this.agreeing ? 0 : 1;
    return { data: { choices: open.map((o) => ({ slot_id: o.id, candidate_id: o.options[pick % o.options.length]!.id })) } as SampleOutput, call };
  }
  async compose(): Promise<{ data: PromptIR; call: LlmCall }> {
    throw new Error("unused");
  }
}

const json = (s: ConversationState) => StateSchema.parse(JSON.parse(JSON.stringify(s)));

describe("convergence stop (research/06 §F.6, pragmatic)", () => {
  it("weights agreement by impact and ignores slots without sampled candidates", () => {
    const s = (impact: number, confidence: number, n = 3) => ({ impact, confidence, candidates: Array.from({ length: n }, (_, i) => ({ id: `${i}`, label: `${i}`, p: 0 })) }) as never;
    expect(interpretationAgreement([s(1, 0.9), s(0.5, 0.6)])).toBeCloseTo((0.9 + 0.3) / 1.5);
    expect(interpretationAgreement([s(1, 0.2, 0)])).toBe(1);
  });

  it("stops after a round when interpretations agree on every remaining choice question", () => {
    const base = { answers: [], asked: 2, budget: { maxRounds: 3, maxQuestions: 6 }, userRequested: false, threshold: 0.1, maxNet: 0.3, candidates: [{ kind: "slot" } as never] };
    expect(computeStop({ ...base, roundsUsed: 1, agreement: 0.85, candidatesSampled: true }).reasons).toContain("interpretations_converged");
    // Not on the first pass, not with open free-text questions, not below the bar.
    expect(computeStop({ ...base, roundsUsed: 0, agreement: 0.9, candidatesSampled: true }).shouldStop).toBe(false);
    expect(computeStop({ ...base, roundsUsed: 1, agreement: 0.9, candidatesSampled: false }).shouldStop).toBe(false);
    expect(computeStop({ ...base, roundsUsed: 1, agreement: 0.6, candidatesSampled: true }).shouldStop).toBe(false);
  });

  it("records agreement and critical coverage on the state", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis()));
    expect(s.stop.agreement).toBeGreaterThan(0);
    expect(s.stop.agreement).toBeLessThanOrEqual(1);
    expect(s.stop.criticalCovered).toBe(true);
  });
});

describe("contradictions", () => {
  it("surfaces at most one contradiction per round, as a single confirmation question", () => {
    const c = (id: string) => ({ id, description: id, slotIds: [], severity: "hard" as const, options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] });
    const batch = selectBatch([], [c("c-1"), c("c-2")], { asked: new Set(), askedTexts: [] }, 5, 0);
    expect(batch.filter((q) => q.kind === "contradiction")).toHaveLength(1);
  });

  it("contradiction questions survive a JSON round trip (no Infinity)", async () => {
    const a = analysis("app_build", {
      contradictions: [{ description: "Free vs payments", slot_ids: ["accounts_data"], severity: "hard", question: "Should people pay?", options: [{ id: "free", label: "Free", description: "" }, { id: "paid", label: "Paid", description: "" }] }],
    });
    const s = await start("A free app that takes payments", "app_builder", new Provider(a));
    expect(s.pending[0]!.kind).toBe("contradiction");
    expect(() => json(s)).not.toThrow();
  });

  it("the development mock detects a keyword conflict", async () => {
    const s = await start("Build a free booking app that takes payments", "app_builder", new MockProvider());
    expect(s.contradictions).toHaveLength(1);
    expect(s.pending.filter((q) => q.kind === "contradiction")).toHaveLength(1);
  });
});

describe("remembered context (F9, local)", () => {
  const memory = [{ id: "m1", slotId: "design_direction", label: "Look & feel", value: "Warm, earthy, rounded", scope: "personal" as const, createdAt: "2026-11-20T00:00:00Z" }];

  it("fills an open slot, counts as resolved and is never asked", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis()), { memory });
    const slot = s.slots.find((x) => x.id === "design_direction")!;
    expect(slot.status).toBe("remembered");
    expect(slot.value).toBe("Warm, earthy, rounded");
    expect(s.pending.some((q) => q.slotId === "design_direction")).toBe(false);
  });

  it("anything stated in this session beats remembered context", async () => {
    const a = analysis();
    a.slots = a.slots.map((x) => (x.id === "design_direction" ? { ...x, known: true, value: "Bold black and white", source: "request" as const, candidates: [] } : x));
    const s = await start("Bold black and white booking site", "app_builder", new Provider(a), { memory });
    expect(s.slots.find((x) => x.id === "design_direction")!.value).toBe("Bold black and white");
  });

  it("is ignored in study sessions so both conditions start equal", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis()), { memory, experiment: { studyId: "st1", condition: "auto" } });
    expect(s.memory).toEqual([]);
  });
});

describe("Keep (confirm an assumption)", () => {
  it("pins the current value and records that it was confirmed, not rewritten", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis()));
    const target = s.slots.find((x) => x.status === "assumed")!;
    const kept = editSlot(s, target.id, target.value!, { confirmed: true });
    expect(kept.slots.find((x) => x.id === target.id)!.status).toBe("edited");
    expect(kept.edits.at(-1)).toMatchObject({ slotId: target.id, value: target.value, confirmed: true });
  });
});

describe("target renderers materially change structure", () => {
  const ir: PromptIR = {
    title: "T",
    objective: "Build a booking site for a dog groomer.",
    context: ["One-van business in Bristol"],
    audience: "Local dog owners on phones",
    requirements: [
      { text: "Book a time slot", priority: "must" },
      { text: "Price list", priority: "must" },
      { text: "Gallery", priority: "should" },
    ],
    constraints: ["No customer accounts"],
    decisions_for_model: ["Choose the stack"],
    assumptions: ["Owner gets an email per booking"],
    output_format: "",
    output_structure: [],
    success_criteria: ["A booking can be made on a phone in under a minute"],
    out_of_scope: ["Payments"],
    clarify_first: [],
    approach: [],
  };
  const heads = (t: string) => t.match(/^## .+$/gm)!.map((h) => h.slice(3));

  it("produces different section sets and orders per target", () => {
    const g = renderPrompt(ir, "generic", "app_build");
    const a = renderPrompt(ir, "app_builder", "app_build");
    const c = renderPrompt(ir, "coding_agent", "app_build");
    expect(new Set([heads(g).join("|"), heads(a).join("|"), heads(c).join("|")]).size).toBe(3);
  });

  it("app builder: numbered build order, nice-to-haves deferred, working rules on scope", () => {
    const a = renderPrompt(ir, "app_builder", "app_build");
    expect(a).toContain("## Core features (in build order)\n1. Book a time slot\n2. Price list");
    expect(a).toMatch(/## Not in this version\n- Gallery \(later/);
    expect(a).toContain("Don't add sign-in, payments");
    expect(a).not.toContain("Run the tests");
  });

  it("coding agent: constraints before requirements, verification and repository rules", () => {
    const c = renderPrompt(ir, "coding_agent", "coding_task");
    expect(c.indexOf("## Constraints — do not break")).toBeLessThan(c.indexOf("## Requirements"));
    expect(c).toContain("## Verification");
    expect(c).toContain("Read the relevant code first");
    expect(c).not.toContain("Build the first version only");
  });

  it("generic: no build or repository rules", () => {
    const g = renderPrompt(ir, "generic", "writing");
    expect(g).not.toContain("Working rules");
  });
});

describe("Wizard-of-Oz operator flow", () => {
  const wizard = { studyId: "st1", condition: "wizard" as const };

  it("withholds the engine's round and waits for the operator, keeping proposals", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: wizard });
    expect(s.phase).toBe("awaiting_operator");
    expect(s.pending).toEqual([]);
    expect(s.rounds).toEqual([]);
    expect(s.proposals.length).toBeGreaterThan(0);
    expect(() => json(s)).not.toThrow();
  });

  it("the automated condition behaves like the normal product", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: { studyId: "st2", condition: "auto" } });
    expect(s.phase).toBe("questioning");
    expect(s.pending.every((q) => q.source === "model")).toBe(true);
  });

  it("records who produced each question: selected, edited or written", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: wizard });
    const [p1, p2] = s.proposals;
    const published = publishRound(s, [
      { fromProposal: p1!.id, label: p1!.label, text: p1!.text, format: p1!.format, options: p1!.options },
      { fromProposal: p2!.id, label: p2!.label, text: "Reworded by the researcher?", format: p2!.format, options: p2!.options },
      { label: "Opening hours", text: "What hours do you take bookings?", format: "free_text", options: [] },
    ]);
    expect(published.phase).toBe("questioning");
    expect(published.pending.map((q) => q.source)).toEqual(["operator_selected", "operator_edited", "operator_written"]);
    expect(published.slots.some((x) => x.id.startsWith("op_") && x.label === "Opening hours")).toBe(true);
    expect(published.rounds.at(-1)!.shownAt).toBeTruthy();
    expect(() => json(published)).not.toThrow();
  });

  it("answers to operator questions flow back through analysis and return to the operator", async () => {
    const p = new Provider(analysis(), 6, 3);
    const s = await start("Build me a booking site", "app_builder", p, { experiment: wizard });
    const r = publishRound(s, [{ label: "Opening hours", text: "What hours do you take bookings?", format: "free_text", options: [] }]);
    const after = await answer(r, [{ questionId: r.pending[0]!.id, kind: "text", text: "Weekdays 9–5" }], p);
    expect(after.phase).toBe("awaiting_operator");
    expect(after.answers[0]).toMatchObject({ value: "Weekdays 9–5" });
    expect(after.slots.find((x) => x.label === "Opening hours")!.status).toBe("answered");
    expect(after.rounds[0]!.answeredAt).toBeTruthy();
  });

  it("caps operator rounds at three questions and rejects empty rounds", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: wizard });
    const q = (t: string) => ({ label: t, text: `${t}?`, format: "free_text" as const, options: [] });
    expect(publishRound(s, [q("a"), q("b"), q("c"), q("d")]).pending).toHaveLength(3);
    expect(() => publishRound(s, [])).toThrow(EngineError);
  });

  it("operator stop moves to composition with the reason recorded", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: wizard });
    const stopped = operatorStop(s);
    expect(stopped.phase).toBe("ready_to_compose");
    expect(stopped.stop.reasons).toContain("operator_stopped");
    const composed = await compose(stopped, new MockProvider());
    expect(composed.phase).toBe("composed");
  });

  it("the participant can still skip everything while waiting", async () => {
    const s = await start("Build me a booking site", "app_builder", new Provider(analysis(), 6, 3), { experiment: wizard });
    const done = finish(s);
    expect(done.phase).toBe("ready_to_compose");
    expect(done.stop.reasons).toContain("user_requested");
  });
});

describe("resolved contradictions reach the spec", () => {
  it("an answered contradiction becomes a must-have requirement, in the fallback composer and after repair", async () => {
    const p = new MockProvider();
    let s = await start("Build a free booking app that takes payments", "app_builder", p);
    const c = s.pending.find((q) => q.kind === "contradiction")!;
    s = await answer(s, [{ questionId: c.id, kind: "option", optionIds: [c.options[0]!.id] }], p);
    s = finish(s);
    s = await compose(s, p);
    const text = s.prompts.at(-1)!.text;
    expect(text).toContain("No — completely free");
  });

  it("repair restores a decision the composer dropped", async () => {
    const { repairIR } = await import("./render");
    const p = new MockProvider();
    let s = await start("Build a free booking app that takes payments", "app_builder", p);
    const c = s.pending.find((q) => q.kind === "contradiction")!;
    s = await answer(s, [{ questionId: c.id, kind: "option", optionIds: [c.options[2]!.id] }], p);
    const empty: PromptIR = { title: "", objective: "Build it.", context: [], audience: "", requirements: [], constraints: [], decisions_for_model: [], assumptions: [], output_format: "", output_structure: [], success_criteria: [], out_of_scope: [], clarify_first: [], approach: [] };
    const { ir, warnings } = repairIR(empty, s);
    expect(ir.requirements[0]!.text).toContain("Free now, payments later");
    expect(warnings.some((w) => /decision/.test(w))).toBe(true);
  });
});
