/**
 * SubText offline evaluation harness (research/09 L1 — synthetic benchmark, simulated users).
 *
 * Arms (research/09 §2). Every final prompt goes to the SAME downstream model with identical
 * settings; judges never see which arm produced an output.
 *   T1   raw seed request                                   (floor)
 *   T2   "improve this prompt" by the downstream model       (the free native substitute)
 *   T3   SubText composer, zero questions                    (value of the composer alone)
 *   T3L  T3 padded to T4's length with generic filler        (does length alone explain gains?)
 *   T4   SubText with a simulated user answering questions   (the product)
 *   T5   native clarification: the downstream model is told to ask clarifying questions first;
 *        the simulated user answers; the model then answers  (strongest substitute)
 *   T4O  composer given the hidden intent card directly      (upper bound; optional)
 *
 * Deviations from research/09, stated in every report: no human-written control prompts (arm C)
 * yet, so T2 improves the seed rather than a user prompt and T4-vs-T1 stands in for T4-vs-C;
 * T5 allows one clarification turn; judges default to one provider family.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { BenchmarkItem } from "./benchmark";
import { combineOrders, words, type Verdict } from "./stats";
import { AnthropicProvider } from "../src/server/anthropic";
import { MockProvider } from "../src/engine/mock";
import { answer, compose, finish, start, type AnswerInput, type LlmProvider } from "../src/engine/orchestrator";
import { POLICY } from "../src/engine/policy";
import { coverage } from "../src/engine/render";
import type { ConversationState, PlannedQuestion } from "../src/engine/schema";

export const ARMS = ["T1", "T2", "T3", "T3L", "T4", "T5", "T4O"] as const;
export type Arm = (typeof ARMS)[number];

/** List prices, USD per million tokens (research/08 §2 table, Anthropic pricing accessed 2026-11-13). */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2.0, output: 10.0 },
  "claude-opus-5-5": { input: 4.0, output: 20.0 },
};
export const costOf = (model: string, input: number, output: number) => {
  const p = PRICES[model] ?? PRICES[Object.keys(PRICES).find((k) => model.startsWith(k)) ?? ""];
  return p ? (input * p.input + output * p.output) / 1e6 : NaN;
};

export type Role = "subtext" | "downstream" | "judge" | "simulator" | "improver";

export interface HarnessConfig {
  dry: boolean;
  downstream: string;
  judge: string;
  simulator: string;
  analyseModel: string;
  composeModel: string;
  samples: number;
  /** Downstream generations per item per arm (research/09 §3 recommends 3). */
  k: number;
  oracle: boolean;
  /** Score every output on the anchored 1–5 rubric (research/09 §8.1); doubles judge cost. */
  rubric: boolean;
}

export class Usage {
  byRole: Record<Role, { input: number; output: number; calls: number; usd: number }> = {
    subtext: { input: 0, output: 0, calls: 0, usd: 0 },
    downstream: { input: 0, output: 0, calls: 0, usd: 0 },
    judge: { input: 0, output: 0, calls: 0, usd: 0 },
    simulator: { input: 0, output: 0, calls: 0, usd: 0 },
    improver: { input: 0, output: 0, calls: 0, usd: 0 },
  };
  add(role: Role, model: string, input: number, output: number) {
    const r = this.byRole[role];
    r.input += input;
    r.output += output;
    r.calls++;
    const c = costOf(model, input, output);
    if (Number.isFinite(c)) r.usd += c;
  }
  get totalUsd() {
    return Object.values(this.byRole).reduce((n, r) => n + r.usd, 0);
  }
}

// ---------------------------------------------------------------------------------------------
// LLM access (eval-only)
// ---------------------------------------------------------------------------------------------

export class EvalLlm {
  private client: Anthropic | null;
  constructor(public cfg: HarnessConfig, public usage = new Usage()) {
    this.client = cfg.dry ? null : new Anthropic({ maxRetries: 3 });
  }

  async text(role: Role, model: string, system: string, messages: { role: "user" | "assistant"; content: string }[], maxTokens = 6000): Promise<string> {
    if (!this.client) throw new Error("dry run: no client");
    const msg = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      output_config: { effort: "low" },
      ...(system ? { system } : {}),
      messages,
    });
    this.usage.add(role, model, msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0), msg.usage.output_tokens);
    return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  }

  async structured<T>(role: Role, model: string, system: string, user: string, schema: z.ZodType<T>, maxTokens = 3000): Promise<T> {
    if (!this.client) throw new Error("dry run: no client");
    const msg = await this.client.beta.messages.parse({
      model,
      max_tokens: maxTokens,
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: user }],
    });
    this.usage.add(role, model, msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0), msg.usage.output_tokens);
    if (!msg.parsed_output) throw new Error(`structured output missing (${msg.stop_reason})`);
    return msg.parsed_output as T;
  }
}

// ---------------------------------------------------------------------------------------------
// Simulated user (research/09 §4.4)
// ---------------------------------------------------------------------------------------------

const PROFILE: Record<BenchmarkItem["simulator"], string> = {
  cooperative: "Answer clearly and helpfully, but only with what is on your card.",
  terse: "Answer in as few words as possible. Pick an option whenever one fits.",
  uncertain: "You are unsure about details that are not central to your goal; say 'not sure' or 'you decide' for those.",
  verbose: "Answer conversationally, in a sentence or two, but still only with what is on your card.",
};

export function cardText(item: BenchmarkItem) {
  const prefs = item.intent.preferences_if_asked ? Object.entries(item.intent.preferences_if_asked).map(([k, v]) => `- ${k}: ${v}`) : [];
  return [
    `You are: ${item.intent.persona}`,
    `Your real goal: ${item.intent.goal}`,
    `Facts you know:`,
    ...item.intent.facts.map((f) => `- ${f.slot}: ${f.value}`),
    ...(prefs.length ? ["Preferences (only if asked):", ...prefs] : []),
    ...(item.intent.unknowns?.length ? [`You don't know: ${item.intent.unknowns.join(", ")}`] : []),
  ].join("\n");
}

const SIM_RULES = `You role-play a real person using an AI tool. Never volunteer facts that were not asked about. If nothing on your card answers a question, say you have no preference or don't know. Never invent facts that are not on your card.`;

const SimAnswer = z.object({
  answers: z.array(z.object({ question_id: z.string(), kind: z.enum(["option", "text", "you_decide", "not_sure"]), option_ids: z.array(z.string()), text: z.string() })),
});

export async function simulateAnswers(llm: EvalLlm, item: BenchmarkItem, questions: PlannedQuestion[]): Promise<AnswerInput[]> {
  if (llm.cfg.dry) {
    return questions.map((q) =>
      q.options.length ? { questionId: q.id, kind: "option", optionIds: [q.options[0]!.id] } : { questionId: q.id, kind: "text", text: item.intent.facts[0]?.value ?? "no preference" },
    );
  }
  const qs = questions
    .map((q) => `[${q.id}] ${q.text}${q.options.length ? `\n  options: ${q.options.map((o) => `${o.id} = ${o.label}`).join(" | ")}` : " (free text)"}`)
    .join("\n");
  const res = await llm.structured(
    "simulator",
    llm.cfg.simulator,
    `${SIM_RULES} ${PROFILE[item.simulator]} For each question choose "option" only if an option matches your card (you may add a short text), "text" for a short free answer, "you_decide" if you have no preference, or "not_sure".`,
    `${cardText(item)}\n\nQuestions:\n${qs}\n\nAnswer every question.`,
    SimAnswer,
  );
  return questions.map((q) => {
    const a = res.answers.find((x) => x.question_id === q.id);
    if (!a) return { questionId: q.id, kind: "skipped" as const };
    const optionIds = a.option_ids.filter((id) => q.options.some((o) => o.id === id));
    if (a.kind === "option" && optionIds.length) return { questionId: q.id, kind: "option" as const, optionIds, text: a.text || undefined };
    if (a.kind === "text" || a.kind === "option") return { questionId: q.id, kind: a.text ? ("text" as const) : ("skipped" as const), text: a.text };
    return { questionId: q.id, kind: a.kind };
  });
}

// ---------------------------------------------------------------------------------------------
// Arms
// ---------------------------------------------------------------------------------------------

function subtextProvider(cfg: HarnessConfig): LlmProvider {
  return cfg.dry ? new MockProvider() : new AnthropicProvider({ analyseModel: cfg.analyseModel, composeModel: cfg.composeModel, samples: cfg.samples });
}

export interface SubtextRun {
  prompt: string;
  questions: number;
  rounds: number;
  effortSeconds: number;
  stop: string[];
  family: string;
  ms: number;
  usd: number;
  state: ConversationState;
}

function recordSubtextUsage(llm: EvalLlm, s: ConversationState): number {
  let usd = 0;
  for (const c of s.calls) {
    llm.usage.add("subtext", c.model, c.inputTokens, c.outputTokens);
    const x = costOf(c.model, c.inputTokens, c.outputTokens);
    if (Number.isFinite(x)) usd += x;
  }
  return usd;
}

/** T3 (withQuestions=false) and T4 (withQuestions=true). */
export async function runSubtext(llm: EvalLlm, item: BenchmarkItem, withQuestions: boolean, requestOverride?: string): Promise<SubtextRun> {
  const p = subtextProvider(llm.cfg);
  const t0 = Date.now();
  let s = await start(requestOverride ?? item.seed, item.target, p);
  if (!withQuestions) s = finish(s);
  let guard = 0;
  while (s.phase === "questioning" && guard++ < 6) s = await answer(s, await simulateAnswers(llm, item, s.pending), p);
  s = await compose(s, p);
  const asked = s.rounds.flatMap((r) => r.questions);
  return {
    prompt: s.prompts.at(-1)!.text,
    questions: asked.length,
    rounds: s.rounds.length,
    effortSeconds: asked.reduce((n, q) => n + POLICY.effortSeconds[q.format], 0),
    stop: s.stop.reasons,
    family: s.task.family,
    ms: Date.now() - t0,
    usd: recordSubtextUsage(llm, s),
    state: s,
  };
}

/** T4O: the composer sees the full intent card (no questions). Upper bound on information. */
export function oracleRequest(item: BenchmarkItem): string {
  return `${item.seed}\n\nFull details:\n${item.intent.goal}\n${item.intent.facts.map((f) => `- ${f.value}`).join("\n")}`;
}

export const IMPROVE_INSTRUCTION = "Improve this prompt so an AI assistant gives a better result. Return only the improved prompt.";

export async function improvePrompt(llm: EvalLlm, seed: string): Promise<string> {
  if (llm.cfg.dry) return `${seed}\n\n(dry run — improver not called)`;
  return llm.text("improver", llm.cfg.downstream, "", [{ role: "user", content: `${IMPROVE_INSTRUCTION}\n\n<prompt>\n${seed}\n</prompt>` }], 3000);
}

/** Generic filler with no task information, used to length-match T3 to T4 (arm T3L). */
const FILLER = [
  "Be clear and well organised.",
  "Use plain language and avoid unnecessary jargon.",
  "Make sure the result is accurate and complete.",
  "Structure the response so it is easy to scan.",
  "Follow common best practices for this kind of work.",
  "Keep quality high throughout.",
  "Double-check the work before finishing.",
  "Prefer concrete details over vague statements.",
];
export function lengthMatch(prompt: string, targetWords: number): string {
  let out = prompt.trimEnd() + "\n\n## General guidance";
  let i = 0;
  while (words(out) < targetWords && i < 200) out += `\n- ${FILLER[i++ % FILLER.length]}`;
  return out + "\n";
}

export const NATIVE_CLARIFY_SYSTEM = "Ask any clarifying questions you need before answering.";

const T5Sim = z.object({ is_asking_questions: z.boolean(), reply: z.string() });

/** T5: the downstream model's own clarification (research/09 §2, T5b), one clarification turn. */
export async function nativeClarify(llm: EvalLlm, item: BenchmarkItem): Promise<{ output: string; asked: boolean }> {
  if (llm.cfg.dry) return { output: `(dry run — native clarification not called) ${item.seed}`, asked: false };
  const first = await llm.text("downstream", llm.cfg.downstream, NATIVE_CLARIFY_SYSTEM, [{ role: "user", content: item.seed }]);
  const sim = await llm.structured(
    "simulator",
    llm.cfg.simulator,
    `${SIM_RULES} ${PROFILE[item.simulator]} You will see an AI assistant's reply to your request. If it asks you questions, set is_asking_questions = true and answer them in "reply" as this person would (only from your card). If it did not ask anything, set is_asking_questions = false and reply "".`,
    `${cardText(item)}\n\nYour request was: ${item.seed}\n\n<assistant_reply>\n${first}\n</assistant_reply>`,
    T5Sim,
  );
  if (!sim.is_asking_questions || !sim.reply.trim()) return { output: first, asked: false };
  const final = await llm.text("downstream", llm.cfg.downstream, NATIVE_CLARIFY_SYSTEM, [
    { role: "user", content: item.seed },
    { role: "assistant", content: first },
    { role: "user", content: sim.reply },
  ]);
  return { output: final, asked: true };
}

export async function downstream(llm: EvalLlm, prompt: string): Promise<string> {
  if (llm.cfg.dry) return `(dry run — downstream not called) ${prompt.slice(0, 120)}`;
  return llm.text("downstream", llm.cfg.downstream, "", [{ role: "user", content: prompt }], 6000);
}

// ---------------------------------------------------------------------------------------------
// Judging (research/09 §8)
// ---------------------------------------------------------------------------------------------

const Pairwise = z.object({ reasoning: z.string(), verdict: z.enum(["A", "B", "tie"]) });
const Checklist = z.object({ must_have_met: z.array(z.boolean()), must_not_violated: z.array(z.boolean()) });
const Rubric = z.object({
  evidence: z.string(),
  task_success: z.number().int(),
  relevance: z.number().int(),
  specificity: z.number().int(),
  correctness: z.number().int(),
  usefulness: z.number().int(),
  concision: z.number().int(),
});
export type RubricScores = Omit<z.infer<typeof Rubric>, "evidence">;

export const JUDGE_SYSTEM = `You are an impartial evaluator. You judge which AI output better serves a specific person's REAL goal, described in a hidden intent card the AI never saw. Prefer outputs that achieve the goal, respect the person's facts and constraints, are specific rather than generic, and are no longer than needed. Do not prefer an output for being longer. An output that only asks questions instead of doing the work is worse than one that does the work well. Quote evidence briefly in your reasoning, then give a verdict: "A", "B" or "tie".`;

function judgeContext(item: BenchmarkItem) {
  return `${cardText(item)}\n\nMust have: ${item.mustHave.join("; ")}\nMust not: ${item.mustNot.join("; ")}`;
}

/** Both-order pairwise judgement; inconsistent verdicts count as a tie (position-bias control). */
export async function pairwise(llm: EvalLlm, item: BenchmarkItem, a: string, b: string): Promise<{ verdict: Verdict; consistent: boolean }> {
  if (llm.cfg.dry) return { verdict: "tie", consistent: true };
  const ask = (x: string, y: string) =>
    llm.structured("judge", llm.cfg.judge, JUDGE_SYSTEM, `${judgeContext(item)}\n\n<output_A>\n${x}\n</output_A>\n\n<output_B>\n${y}\n</output_B>`, Pairwise).then((r) => r.verdict);
  const [first, second] = await Promise.all([ask(a, b), ask(b, a)]);
  const verdict = combineOrders(first, second);
  const swapped = second === "A" ? "B" : second === "B" ? "A" : "tie";
  return { verdict, consistent: first === swapped };
}

export async function checklist(llm: EvalLlm, item: BenchmarkItem, output: string): Promise<{ met: number; violations: number }> {
  if (llm.cfg.dry) return { met: NaN, violations: 0 };
  const r = await llm.structured(
    "judge",
    llm.cfg.judge,
    "You check an AI output against a checklist. Be strict and literal.",
    `Must-have items (answer in order):\n${item.mustHave.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nMust-not items (answer in order):\n${item.mustNot.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\n<output>\n${output}\n</output>`,
    Checklist,
  );
  return { met: r.must_have_met.slice(0, item.mustHave.length).filter(Boolean).length / item.mustHave.length, violations: r.must_not_violated.slice(0, item.mustNot.length).filter(Boolean).length };
}

const RUBRIC_SYSTEM = `Score the AI output for this person on each dimension from 1 to 5 using these anchors (research rubric):
task_success: 1 = addresses a different task; 3 = partially achieves the goal, needs substantial follow-up; 5 = fully achieves the goal, usable immediately.
relevance: 1 = mostly generic; 3 = mix of tailored and generic; 5 = all specific to this person.
specificity: 1 = vague generalities; 3 = some concrete specifics; 5 = concrete and actionable throughout.
correctness: 1 = major errors or invented facts; 3 = minor errors; 5 = no detectable errors, uncertainty flagged.
usefulness: 1 = would discard; 3 = would keep parts and redo the rest; 5 = would use as-is.
concision: 1 = bloated or truncated; 3 = somewhat long or short; 5 = length fits the need.
Write brief evidence quotes first, then the scores.`;

export async function rubric(llm: EvalLlm, item: BenchmarkItem, output: string): Promise<RubricScores | null> {
  if (llm.cfg.dry || !llm.cfg.rubric) return null;
  const r = await llm.structured("judge", llm.cfg.judge, RUBRIC_SYSTEM, `${judgeContext(item)}\n\n<output>\n${output}\n</output>`, Rubric);
  const clamp = (x: number) => Math.min(5, Math.max(1, Math.round(x)));
  return { task_success: clamp(r.task_success), relevance: clamp(r.relevance), specificity: clamp(r.specificity), correctness: clamp(r.correctness), usefulness: clamp(r.usefulness), concision: clamp(r.concision) };
}

/** Lexical proxy for research/09 §8.2 requirement recall: share of high-materiality facts present in a prompt. */
export function factRecall(item: BenchmarkItem, prompt: string): number {
  const high = item.intent.facts.filter((f) => f.materiality === "high");
  if (!high.length) return NaN;
  return high.filter((f) => coverage(prompt, f.value) >= 0.5).length / high.length;
}

// ---------------------------------------------------------------------------------------------
// One item
// ---------------------------------------------------------------------------------------------

export const CONTRASTS = [
  { id: "T4vT2", a: "T4", b: "T2", primary: true, question: "Beats the free 'improve this prompt' substitute?" },
  { id: "T4vT3", a: "T4", b: "T3", primary: true, question: "Do the questions add value beyond rewriting?" },
  { id: "T4vT1", a: "T4", b: "T1", primary: true, question: "Beats the raw request (stand-in for arm C)?" },
  { id: "T4vT5", a: "T4", b: "T5", primary: false, question: "Beats the model's own clarifying questions?" },
  { id: "T3vT3L", a: "T3", b: "T3L", primary: false, question: "Is the composer's gain more than length?" },
  { id: "T4vT4O", a: "T4", b: "T4O", primary: false, question: "Headroom: how far from full information?" },
] as const satisfies readonly { id: string; a: Arm; b: Arm; primary: boolean; question: string }[];
export type ContrastId = (typeof CONTRASTS)[number]["id"];

export interface ItemResult {
  id: string;
  family: string;
  specificity: string;
  target: string;
  classifiedAs: string;
  questionsAsked: number;
  rounds: number;
  effortSeconds: number;
  stop: string[];
  t5Asked: boolean;
  subtextMs: number;
  subtextUsd: number;
  prompts: Partial<Record<Arm, string>>;
  /** outputs[arm][sample] */
  outputs: Partial<Record<Arm, string[]>>;
  promptWords: Partial<Record<Arm, number>>;
  outputWords: Partial<Record<Arm, number>>;
  factRecall: Partial<Record<Arm, number>>;
  /** verdicts[contrast][sample]: "A" = first arm of the contrast wins */
  verdicts: Partial<Record<ContrastId, Verdict[]>>;
  positionConsistency: number;
  checklist: Partial<Record<Arm, { met: number; violations: number }>>;
  rubric: Partial<Record<Arm, RubricScores | null>>;
  questions: { id: string; text: string; format: string; source: string; answer: string }[];
}

export async function runItem(llm: EvalLlm, item: BenchmarkItem): Promise<ItemResult> {
  const cfg = llm.cfg;
  const [t3, t4, t2, t4o] = await Promise.all([
    runSubtext(llm, item, false),
    runSubtext(llm, item, true),
    improvePrompt(llm, item.seed),
    cfg.oracle ? runSubtext(llm, item, false, oracleRequest(item)) : Promise.resolve(null),
  ]);
  const prompts: Partial<Record<Arm, string>> = { T1: item.seed, T2: t2, T3: t3.prompt, T3L: lengthMatch(t3.prompt, words(t4.prompt)), T4: t4.prompt };
  if (t4o) prompts.T4O = t4o.prompt;

  const outputs: Partial<Record<Arm, string[]>> = {};
  let t5Asked = false;
  await Promise.all([
    ...(Object.keys(prompts) as Arm[]).map(async (arm) => {
      outputs[arm] = await Promise.all(Array.from({ length: cfg.k }, () => downstream(llm, prompts[arm]!)));
    }),
    (async () => {
      const runs = await Promise.all(Array.from({ length: cfg.k }, () => nativeClarify(llm, item)));
      outputs.T5 = runs.map((r) => r.output);
      t5Asked = runs.some((r) => r.asked);
    })(),
  ]);

  const verdicts: Partial<Record<ContrastId, Verdict[]>> = {};
  let consistent = 0;
  let judged = 0;
  await Promise.all(
    CONTRASTS.filter((c) => outputs[c.a] && outputs[c.b]).map(async (c) => {
      const res = await Promise.all(outputs[c.a]!.map((oa, i) => pairwise(llm, item, oa, outputs[c.b]![i]!)));
      verdicts[c.id] = res.map((r) => r.verdict);
      consistent += res.filter((r) => r.consistent).length;
      judged += res.length;
    }),
  );

  const arms = Object.keys(outputs) as Arm[];
  const checks: ItemResult["checklist"] = {};
  const rubrics: ItemResult["rubric"] = {};
  await Promise.all(
    arms.map(async (arm) => {
      checks[arm] = await checklist(llm, item, outputs[arm]![0]!);
      rubrics[arm] = await rubric(llm, item, outputs[arm]![0]!);
    }),
  );

  const answers = new Map(t4.state.answers.map((a) => [a.questionId, a]));
  return {
    id: item.id,
    family: item.family,
    specificity: item.specificity,
    target: item.target,
    classifiedAs: t4.family,
    questionsAsked: t4.questions,
    rounds: t4.rounds,
    effortSeconds: t4.effortSeconds,
    stop: t4.stop,
    t5Asked,
    subtextMs: t4.ms,
    subtextUsd: t4.usd,
    prompts,
    outputs,
    promptWords: Object.fromEntries(Object.entries(prompts).map(([k, v]) => [k, words(v)])),
    outputWords: Object.fromEntries(arms.map((a) => [a, outputs[a]!.reduce((n, o) => n + words(o), 0) / outputs[a]!.length])),
    factRecall: Object.fromEntries(Object.entries(prompts).map(([k, v]) => [k, factRecall(item, v)])),
    verdicts,
    positionConsistency: judged ? consistent / judged : NaN,
    checklist: checks,
    rubric: rubrics,
    questions: t4.state.rounds.flatMap((r) =>
      r.questions.map((q) => {
        const a = answers.get(q.id);
        return { id: q.id, text: q.text, format: q.format, source: q.source, answer: a ? (a.kind === "option" || a.kind === "text" ? (a.value ?? "") : a.kind) : "skipped" };
      }),
    ),
  };
}
