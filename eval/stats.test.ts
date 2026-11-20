import { describe, expect, it } from "vitest";
import { combineOrders, holm, lengthControlledWinRate, signTest, summarise, wilson } from "./stats";
import { BENCHMARK } from "./benchmark";

describe("eval stats", () => {
  it("treats order-inconsistent judgements as ties (position-bias control)", () => {
    expect(combineOrders("A", "B")).toBe("A"); // swapped frame: B means A won again
    expect(combineOrders("A", "A")).toBe("tie");
    expect(combineOrders("tie", "tie")).toBe("tie");
  });
  it("computes an exact two-sided sign test", () => {
    expect(signTest(5, 5)).toBe(1);
    expect(signTest(10, 0)).toBeCloseTo(2 / 1024);
    expect(signTest(0, 0)).toBe(1);
  });
  it("summarises win rate on non-tied pairs", () => {
    expect(summarise(["A", "A", "B", "tie"])).toMatchObject({ wins: 2, losses: 1, ties: 1, winRate: 2 / 3 });
  });
  it("benchmark items are well-formed and unique", () => {
    expect(new Set(BENCHMARK.map((b) => b.id)).size).toBe(BENCHMARK.length);
    for (const b of BENCHMARK) {
      expect(b.mustHave.length).toBeGreaterThan(0);
      expect(b.seed.trim().length).toBeGreaterThan(0);
    }
    expect(BENCHMARK.some((b) => b.specificity === "full")).toBe(true);
  });
});

describe("interval and correction helpers", () => {
  it("wilson interval brackets the point estimate", () => {
    const [lo, hi] = wilson(30, 50);
    expect(lo).toBeLessThan(0.6);
    expect(hi).toBeGreaterThan(0.6);
    expect(lo).toBeCloseTo(0.4618, 3);
  });
  it("holm adjusts in step-down order and stays monotone", () => {
    expect(holm([0.01, 0.04, 0.03])).toEqual([0.03, 0.06, 0.06]);
  });
});

describe("length-controlled win rate", () => {
  it("matches the raw win rate when lengths are equal", () => {
    const pairs = [...Array(7).fill("A"), ...Array(3).fill("B")].map((v) => ({ verdict: v as "A" | "B", wordsA: 100, wordsB: 100 }));
    expect(lengthControlledWinRate(pairs).lcWinRate).toBeCloseTo(0.7, 1);
  });
  it("discounts wins that are explained by length", () => {
    // A wins only when it is much longer, loses when lengths are equal.
    const pairs = [
      ...Array(8).fill({ verdict: "A", wordsA: 400, wordsB: 100 }),
      ...Array(4).fill({ verdict: "B", wordsA: 100, wordsB: 100 }),
      ...Array(1).fill({ verdict: "A", wordsA: 100, wordsB: 100 }),
    ];
    const raw = 9 / 13;
    const lc = lengthControlledWinRate(pairs);
    expect(lc.lcWinRate).toBeLessThan(raw);
    expect(lc.slope).toBeGreaterThan(0);
  });
  it("needs at least three non-tied pairs", () => {
    expect(Number.isNaN(lengthControlledWinRate([{ verdict: "tie", wordsA: 1, wordsB: 1 }]).lcWinRate)).toBe(true);
  });
});
