import "server-only";
import type { LlmProvider } from "@/engine/orchestrator";
import { MockProvider } from "@/engine/mock";
import { AnthropicProvider } from "./anthropic";

let cached: LlmProvider | undefined;

export function getProvider(): LlmProvider {
  if (cached) return cached;
  const forceMock = process.env.SUBTEXT_MOCK === "true";
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  const placeholder = !key || /^your[-_]|^sk-ant-x+$|^<.*>$/i.test(key) || key.length < 20;
  if (forceMock || placeholder) {
    if (!forceMock) console.warn("[subtext] ANTHROPIC_API_KEY is missing or a placeholder — running the DEVELOPMENT MOCK (no real AI).");
    cached = new MockProvider();
  } else {
    const samples = Number.parseInt(process.env.SUBTEXT_SAMPLES ?? "5", 10);
    cached = new AnthropicProvider({
      analyseModel: process.env.SUBTEXT_ANALYSE_MODEL || "claude-haiku-5-5",
      composeModel: process.env.SUBTEXT_COMPOSE_MODEL || "claude-sonnet-5-5",
      samples: Number.isFinite(samples) ? Math.min(8, Math.max(1, samples)) : 5,
    });
  }
  return cached;
}
