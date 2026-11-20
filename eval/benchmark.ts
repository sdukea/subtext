/**
 * Benchmark v0 (research/09 §4.1–4.3; research/14 Phase 0).
 *
 * 60 authored tasks in eval/data/benchmark-v0.json: 40 builder/coding-agent (24 app builds, 16
 * coding tasks) and 20 research/document (10 research, 10 writing); seed specificity 36 vague /
 * 15 partial / 9 fully specified (the last stratum tests over-asking). Each item carries a hidden
 * intent card that drives the simulated user and the judges and is never shown to any arm.
 *
 * v0 is for harness development and pilot effect sizes, not for conclusions: research/09 §7 needs
 * ~150 non-tied pairs to detect a 0.65 win rate. All items are authored (synthetic), not real users.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { TargetId } from "../src/engine/schema";

export const BenchmarkItem = z.object({
  id: z.string(),
  version: z.string().default("1.0"),
  split: z.enum(["dev", "test"]).default("dev"),
  family: z.enum(["app_build", "coding_task", "research", "writing", "general"]),
  specificity: z.enum(["vague", "partial", "full"]),
  target: TargetId,
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  seed: z.string().min(1),
  intent: z.object({
    persona: z.string(),
    goal: z.string(),
    facts: z.array(z.object({ slot: z.string(), value: z.string(), materiality: z.enum(["high", "medium", "low"]) })).min(1),
    preferences_if_asked: z.record(z.string(), z.string()).optional(),
    unknowns: z.array(z.string()).optional(),
  }),
  mustHave: z.array(z.string()).min(1),
  niceToHave: z.array(z.string()).default([]),
  mustNot: z.array(z.string()),
  simulator: z.enum(["cooperative", "terse", "uncertain", "verbose"]),
  outputType: z.string().default("output"),
  provenance: z.string().default("authored"),
});
export type BenchmarkItem = z.infer<typeof BenchmarkItem>;

export function loadBenchmark(file = path.join(path.dirname(new URL(import.meta.url).pathname), "data", "benchmark-v0.json")): BenchmarkItem[] {
  const items = z.array(BenchmarkItem).parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const ids = new Set<string>();
  for (const it of items) {
    if (ids.has(it.id)) throw new Error(`Duplicate benchmark id ${it.id}`);
    ids.add(it.id);
  }
  return items;
}

export const BENCHMARK: BenchmarkItem[] = loadBenchmark();
