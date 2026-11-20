import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { ConversationState, LlmCall, PromptIR as PromptIRType } from "@/engine/schema";
import { PromptIR } from "@/engine/schema";
import type { LlmProvider, StageResult } from "@/engine/orchestrator";
import { EngineError } from "@/engine/orchestrator";
import {
  ANALYSE_SYSTEM,
  AnalysisOutput,
  COMPOSE_SYSTEM,
  SAMPLE_SYSTEM,
  SampleOutput,
  analyseUserMessage,
  composeUserMessage,
  sampleUserMessage,
} from "@/engine/stages";

export interface AnthropicConfig {
  analyseModel: string;
  composeModel: string;
  samples: number;
}

interface StageSpec<T> {
  stage: string;
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens: number;
  fast: boolean;
  timeoutMs: number;
}

/**
 * Anthropic provider. Narrow, schema-constrained calls; credentials stay server-side.
 * Retries: the SDK retries 408/409/429/5xx and connection errors (maxRetries 2); this layer adds
 * one retry for schema/parse failures.
 */
export class AnthropicProvider implements LlmProvider {
  readonly mock = false;
  readonly samples: number;
  private client: Anthropic;

  constructor(private cfg: AnthropicConfig) {
    this.client = new Anthropic({ maxRetries: 2 });
    this.samples = cfg.samples;
  }

  private async call<T>(spec: StageSpec<T>): Promise<StageResult<T>> {
    const started = Date.now();
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await this.client.beta.messages.parse(
          {
            model: spec.model,
            max_tokens: spec.maxTokens,
            // Fast stages: thinking off, low effort (latency budget research/08 §10).
            // Compose: adaptive thinking at low effort, with server-side refusal fallback.
            ...(spec.fast
              ? { thinking: { type: "disabled" as const }, output_config: { effort: "low" as const, format: betaZodOutputFormat(spec.schema) } }
              : {
                  thinking: { type: "adaptive" as const },
                  output_config: { effort: "low" as const, format: betaZodOutputFormat(spec.schema) },
                  betas: ["server-side-fallback-2026-07-01"],
                  fallbacks: "default" as const,
                }),
            system: [{ type: "text", text: spec.system, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: spec.user }],
          },
          { timeout: spec.timeoutMs },
        );
        if (res.stop_reason === "refusal") throw new EngineError("provider_failed", "The model declined this request.", false);
        if (res.stop_reason === "max_tokens") throw new Error("Structured output was truncated");
        if (!res.parsed_output) throw new Error("Structured output missing");
        const call: LlmCall = {
          stage: spec.stage,
          model: res.model,
          ms: Date.now() - started,
          inputTokens: (res.usage.input_tokens ?? 0) + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0),
          outputTokens: res.usage.output_tokens ?? 0,
          ok: true,
        };
        return { data: res.parsed_output as T, call };
      } catch (err) {
        lastError = err;
        if (err instanceof Anthropic.RateLimitError) throw new EngineError("rate_limited", "The AI provider is busy. Try again in a moment.", true);
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          throw new EngineError("provider_unavailable", "The AI provider rejected SubText's credentials. Check ANTHROPIC_API_KEY.", false);
        }
        if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.NotFoundError) {
          throw new EngineError("provider_failed", `The AI provider rejected the request (${err.status}).`, false);
        }
        if (err instanceof Anthropic.APIError || err instanceof EngineError) break; // SDK already retried transport errors
        // Parse/validation failure → one more attempt.
      }
    }
    console.error(`[subtext] stage ${spec.stage} failed`, lastError instanceof Error ? lastError.message : lastError);
    if (lastError instanceof EngineError) throw lastError;
    throw new EngineError("provider_failed", "The AI provider didn't respond properly. Try again.", true);
  }

  analyse(state: ConversationState, targetLabel: string) {
    return this.call({
      stage: "analyse",
      model: this.cfg.analyseModel,
      system: ANALYSE_SYSTEM,
      user: analyseUserMessage(state, targetLabel),
      schema: AnalysisOutput,
      maxTokens: 6000,
      fast: true,
      timeoutMs: 30_000,
    });
  }

  sample(state: ConversationState, open: { id: string; label: string; options: { id: string; label: string }[] }[], index: number) {
    // Shuffle option order per sample to reduce position bias.
    const shuffled = open.map((s) => ({ ...s, options: rotate(s.options, index) }));
    return this.call({
      stage: `sample_${index}`,
      model: this.cfg.analyseModel,
      system: SAMPLE_SYSTEM,
      user: sampleUserMessage(state, shuffled),
      schema: SampleOutput,
      maxTokens: 1000,
      fast: true,
      timeoutMs: 15_000,
    });
  }

  compose(state: ConversationState, targetLabel: string): Promise<StageResult<PromptIRType>> {
    return this.call({
      stage: "compose",
      model: this.cfg.composeModel,
      system: COMPOSE_SYSTEM,
      user: composeUserMessage(state, targetLabel),
      schema: PromptIR,
      maxTokens: 12000,
      fast: false,
      timeoutMs: 60_000,
    });
  }
}

function rotate<T>(xs: T[], k: number): T[] {
  if (!xs.length) return xs;
  const n = k % xs.length;
  const r = [...xs.slice(n), ...xs.slice(0, n)];
  return k % 2 ? r.reverse() : r;
}
