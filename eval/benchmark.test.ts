import { describe, expect, it } from "vitest";
import { BENCHMARK } from "./benchmark";

describe("benchmark v0", () => {
  it("has the Phase 0 composition (research/14: 60 tasks, 40 builder/coding, 20 research/document)", () => {
    expect(BENCHMARK).toHaveLength(60);
    const n = (f: string) => BENCHMARK.filter((b) => b.family === f).length;
    expect(n("app_build") + n("coding_task")).toBe(40);
    expect(n("research") + n("writing")).toBe(20);
  });
  it("covers every seed-specificity stratum, including fully specified (over-asking) items", () => {
    const n = (s: string) => BENCHMARK.filter((b) => b.specificity === s).length;
    expect([n("vague"), n("partial"), n("full")]).toEqual([36, 15, 9]);
  });
  it("every item has a hidden intent card with at least two high-materiality facts", () => {
    for (const b of BENCHMARK) expect(b.intent.facts.filter((f) => f.materiality === "high").length, b.id).toBeGreaterThanOrEqual(2);
  });
});
