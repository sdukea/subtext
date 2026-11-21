/**
 * SubText offline evaluation CLI (research/09 L1). See eval/harness.ts for the arms.
 *
 *   npm run eval -- --dry                        # wiring check: development mock, no network, no cost
 *   npm run eval -- --estimate                   # print a rough cost estimate and exit
 *   npm run eval -- --limit 6                    # small real pilot (needs ANTHROPIC_API_KEY; costs money)
 *   npm run eval -- --items bm-app-01,bm-cod-04 --k 3 --rubric --oracle
 *   npm run eval -- --family builder|document --specificity vague|partial|full
 *
 * Writes eval/results/<timestamp>/: report.md, report.json, items/<id>.json, and
 * human-eval/{pairs.csv,key.csv} for blind human rating of the primary contrasts.
 *
 * Results are SYNTHETIC (simulated users, LLM judges). They are not human evaluation results and
 * not production outcomes, and every report says so.
 */
import fs from "node:fs";
import path from "node:path";
import { BENCHMARK, type BenchmarkItem } from "./benchmark";
import { ARMS, CONTRASTS, EvalLlm, PRICES, costOf, runItem, type Arm, type HarnessConfig, type ItemResult } from "./harness";
import { holm, lengthControlledWinRate, mean, summarise, wilson, words, type Verdict } from "./stats";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string, d?: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};

const cfg: HarnessConfig = {
  dry: flag("dry"),
  downstream: opt("downstream", "claude-sonnet-5-5")!,
  judge: opt("judge", "claude-opus-5-5")!,
  simulator: opt("simulator", "claude-haiku-5-5")!,
  analyseModel: process.env.SUBTEXT_ANALYSE_MODEL || "claude-haiku-5-5",
  composeModel: process.env.SUBTEXT_COMPOSE_MODEL || "claude-sonnet-5-5",
  samples: Number(process.env.SUBTEXT_SAMPLES || 5),
  k: Math.max(1, Math.min(5, Number(opt("k", "1")))),
  oracle: flag("oracle"),
  rubric: flag("rubric"),
};

function selectItems(): BenchmarkItem[] {
  const only = opt("items")?.split(",");
  const fam = opt("family");
  const spec = opt("specificity");
  const limit = Number(opt("limit", String(BENCHMARK.length)));
  return BENCHMARK.filter((b) => !only || only.includes(b.id))
    .filter((b) => !fam || (fam === "builder" ? ["app_build", "coding_task"].includes(b.family) : fam === "document" ? ["research", "writing"].includes(b.family) : b.family === fam))
    .filter((b) => !spec || b.specificity === spec)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------------------------
// Rough cost estimate (token counts are assumptions; prices from research/08 §2)
// ---------------------------------------------------------------------------------------------

function estimate(n: number) {
  const c = (m: string, i: number, o: number) => costOf(m, i, o);
  const K = cfg.samples;
  const session = (rounds: number) => rounds * (c(cfg.analyseModel, 3500, 1500) + K * c(cfg.analyseModel, 1800, 120)) + c(cfg.composeModel, 3000, 1800);
  const subtext = session(1) + session(3) + (cfg.oracle ? session(1) : 0);
  const arms = 5 + (cfg.oracle ? 1 : 0);
  const down = cfg.k * (arms * c(cfg.downstream, 900, 2500) + 2 * c(cfg.downstream, 1200, 2500)) + c(cfg.downstream, 200, 400);
  const sim = 3 * c(cfg.simulator, 1500, 300) + cfg.k * c(cfg.simulator, 2500, 300);
  const contrasts = CONTRASTS.filter((x) => cfg.oracle || x.b !== "T4O").length;
  const judge = cfg.k * contrasts * 2 * c(cfg.judge, 6500, 500) + (arms + 1) * c(cfg.judge, 3500, 200) * (cfg.rubric ? 2 : 1);
  const per = subtext + down + sim + judge;
  return { perItem: per, total: per * n };
}

// ---------------------------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------------------------

function contrastStats(results: ItemResult[], id: (typeof CONTRASTS)[number]["id"], a: Arm, b: Arm) {
  const pairs: { verdict: Verdict; wordsA: number; wordsB: number }[] = [];
  for (const r of results) {
    const vs = r.verdicts[id];
    if (!vs) continue;
    vs.forEach((v, i) => pairs.push({ verdict: v, wordsA: words(r.outputs[a]?.[i] ?? ""), wordsB: words(r.outputs[b]?.[i] ?? "") }));
  }
  const s = summarise(pairs.map((p) => p.verdict));
  const [lo, hi] = wilson(s.wins, s.wins + s.losses);
  const lc = lengthControlledWinRate(pairs);
  return { ...s, ci: [lo, hi] as [number, number], lcWinRate: lc.lcWinRate, lengthSlope: lc.slope };
}

function aggregate(results: ItemResult[]) {
  const contrasts = CONTRASTS.map((c) => ({ ...c, ...contrastStats(results, c.id, c.a, c.b) })).filter((c) => c.n > 0);
  const primary = contrasts.filter((c) => c.primary);
  const adj = holm(primary.map((c) => c.p));
  const withHolm = contrasts.map((c) => ({ ...c, pHolm: c.primary ? adj[primary.indexOf(c)]! : NaN }));
  const arms = ARMS.filter((a) => results.some((r) => r.outputs[a]));
  const per = <T>(f: (r: ItemResult) => T | undefined) => results.map(f).filter((x): x is T => x !== undefined);
  const qs = (spec: string) => results.filter((r) => r.specificity === spec).map((r) => r.questionsAsked);
  const full = results.filter((r) => r.specificity === "full");
  const vague = qs("vague").sort((x, y) => x - y);
  return {
    contrasts: withHolm,
    byGroup: {
      builder: CONTRASTS.map((c) => ({ id: c.id, ...contrastStats(results.filter((r) => ["app_build", "coding_task"].includes(r.family)), c.id, c.a, c.b) })).filter((c) => c.n > 0),
      document: CONTRASTS.map((c) => ({ id: c.id, ...contrastStats(results.filter((r) => ["research", "writing"].includes(r.family)), c.id, c.a, c.b) })).filter((c) => c.n > 0),
    },
    questions: {
      meanBySpecificity: { vague: mean(qs("vague")), partial: mean(qs("partial")), full: mean(qs("full")) },
      medianVague: vague.length ? vague[Math.floor((vague.length - 1) / 2)]! : NaN,
      overAskingRate: full.length ? full.filter((r) => r.questionsAsked >= 2).length / full.length : NaN,
      meanEffortSeconds: mean(results.map((r) => r.effortSeconds)),
      stopReasons: results.reduce<Record<string, number>>((m, r) => {
        for (const s of r.stop) m[s] = (m[s] ?? 0) + 1;
        return m;
      }, {}),
      familyAccuracy: mean(results.map((r) => (r.classifiedAs === r.family ? 1 : 0))),
    },
    arms: Object.fromEntries(
      arms.map((a) => [
        a,
        {
          checklistMet: mean(per((r) => r.checklist[a]?.met).filter(Number.isFinite)),
          mustNotViolations: per((r) => r.checklist[a]?.violations).reduce((n, x) => n + x, 0),
          promptWords: mean(per((r) => r.promptWords[a])),
          outputWords: mean(per((r) => r.outputWords[a])),
          factRecall: mean(per((r) => r.factRecall[a]).filter(Number.isFinite)),
          rubricMean: mean(per((r) => r.rubric[a]).flatMap((x) => (x ? [Object.values(x).reduce((n, v) => n + v, 0) / 6] : []))),
        },
      ]),
    ),
    positionConsistency: mean(results.map((r) => r.positionConsistency).filter(Number.isFinite)),
    t5AskedRate: mean(results.map((r) => (r.t5Asked ? 1 : 0))),
    subtext: { meanSeconds: mean(results.map((r) => r.subtextMs)) / 1000, meanUsdPerSession: mean(results.map((r) => r.subtextUsd)) },
  };
}

// ---------------------------------------------------------------------------------------------
// Human evaluation export (research/09 L2 rating of the primary contrasts, blind)
// ---------------------------------------------------------------------------------------------

const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function humanExport(results: ItemResult[], dir: string) {
  const rnd = seeded(20261120);
  const pairs: (string | number)[][] = [["pair_id", "item_id", "persona", "goal", "facts", "must_have", "output_1", "output_2", "preference (1 / 2 / tie)", "notes"]];
  const key: (string | number)[][] = [["pair_id", "contrast", "output_1_arm", "output_2_arm"]];
  let n = 0;
  for (const r of results) {
    const item = BENCHMARK.find((b) => b.id === r.id)!;
    for (const c of CONTRASTS.filter((x) => x.primary)) {
      const oa = r.outputs[c.a]?.[0];
      const ob = r.outputs[c.b]?.[0];
      if (!oa || !ob) continue;
      const flip = rnd() < 0.5;
      const id = `p${String(++n).padStart(4, "0")}`;
      pairs.push([id, r.id, item.intent.persona, item.intent.goal, item.intent.facts.map((f) => `${f.slot}: ${f.value}`).join(" | "), item.mustHave.join(" | "), flip ? ob : oa, flip ? oa : ob, "", ""]);
      key.push([id, c.id, flip ? c.b : c.a, flip ? c.a : c.b]);
    }
  }
  // Shuffle row order so raters can't infer contrasts from position.
  const body = pairs.slice(1);
  const order = body.map((_, i) => i).sort(() => rnd() - 0.5);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "pairs.csv"), csv([pairs[0]!, ...order.map((i) => body[i]!)]));
  fs.writeFileSync(path.join(dir, "key.csv"), csv(key));
  return n;
}

// ---------------------------------------------------------------------------------------------

function markdown(meta: Record<string, unknown>, agg: ReturnType<typeof aggregate>, usage: EvalLlm["usage"], failures: string[]) {
  const f = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "—");
  const pct = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : "—");
  const dry = meta.dry as boolean;
  return [
    `# SubText evaluation — ${dry ? "DRY RUN (wiring only; no real results)" : "synthetic benchmark (L1)"}`,
    "",
    `${meta.date} · items ${meta.items} · downstream ${meta.downstream} · judge ${meta.judge} · simulator ${meta.simulator} · k=${meta.k}`,
    "",
    "**Evidence type: synthetic.** Simulated users answer from hidden intent cards and LLM judges score the outputs. This is not human evaluation and not production data. The v0 benchmark (60 items) can only detect very large effects (research/09 §7).",
    dry ? "\n> Dry run: SubText used the keyword mock, downstream calls were skipped and every judgement is a placeholder tie. Nothing below measures quality.\n" : "",
    "## Contrasts (downstream outputs, both-order pairwise judging)",
    "",
    "| Contrast | Question | W | L | T | Win rate (non-tied) | 95% CI | LC win rate | p (sign) | p (Holm) |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...agg.contrasts.map((c) => `| ${c.id}${c.primary ? " ★" : ""} | ${c.question} | ${c.wins} | ${c.losses} | ${c.ties} | ${f(c.winRate)} | ${f(c.ci[0])}–${f(c.ci[1])} | ${f(c.lcWinRate)} | ${f(c.p, 3)} | ${c.primary ? f(c.pHolm, 3) : ""} |`),
    "",
    "★ primary (Holm-corrected). LC = length-controlled (logistic regression on log output-length ratio; intercept at equal length).",
    "",
    "| Contrast | Builder/coding win rate (n) | Research/document win rate (n) |",
    "|---|---|---|",
    ...agg.contrasts.map((c) => {
      const b = agg.byGroup.builder.find((x) => x.id === c.id);
      const d = agg.byGroup.document.find((x) => x.id === c.id);
      return `| ${c.id} | ${b ? `${f(b.winRate)} (${b.n})` : "—"} | ${d ? `${f(d.winRate)} (${d.n})` : "—"} |`;
    }),
    "",
    "## Arms",
    "",
    "| Arm | Must-have met | Must-not violations | Rubric mean (1–5) | Fact recall in prompt* | Prompt words | Output words |",
    "|---|---|---|---|---|---|---|",
    ...Object.entries(agg.arms).map(([a, x]) => `| ${a} | ${f(x.checklistMet)} | ${x.mustNotViolations} | ${f(x.rubricMean)} | ${f(x.factRecall)} | ${f(x.promptWords, 0)} | ${f(x.outputWords, 0)} |`),
    "",
    "\\* Lexical proxy: share of high-materiality intent facts whose words appear in the prompt. T5 has no single prompt.",
    "",
    "## Questioning (T4)",
    "",
    dry ? "_Dry run: these numbers come from the keyword mock, not the real engine._\n" : "",
    `- Mean questions — vague ${f(agg.questions.meanBySpecificity.vague, 1)} · partial ${f(agg.questions.meanBySpecificity.partial, 1)} · fully specified ${f(agg.questions.meanBySpecificity.full, 1)} (target ≈ 0)`,
    `- Median questions on vague items: ${f(agg.questions.medianVague, 0)} (guardrail ≤ 4)`,
    `- Over-asking on fully specified items (≥ 2 questions): ${pct(agg.questions.overAskingRate)} (guardrail ≤ 20%)`,
    `- Estimated answering effort: ${f(agg.questions.meanEffortSeconds, 0)} s per session (format-based estimate, not measured)`,
    `- Stop reasons: ${Object.entries(agg.questions.stopReasons).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}`,
    `- Task family classified correctly: ${pct(agg.questions.familyAccuracy)}`,
    `- T5: the downstream model asked clarifying questions on ${pct(agg.t5AskedRate)} of items`,
    `- Judge position consistency: ${pct(agg.positionConsistency)} (guardrail ≥ 80%)`,
    "",
    "## Cost and latency",
    "",
    `- SubText per session: ${f(agg.subtext.meanSeconds, 1)} s with instant simulated answers · $${f(agg.subtext.meanUsdPerSession, 4)} (guardrail ≤ $0.05)`,
    `- Whole run: $${f(usage.totalUsd, 2)} at list prices — ${Object.entries(usage.byRole).map(([k, v]) => `${k} $${f(v.usd, 2)} (${v.calls} calls)`).join(" · ")}`,
    "",
    "## Reading this report",
    "",
    "Pre-registered decision thresholds (research/09 §9.2; research/01 §4): **go** needs T4vT2 and T4vT3 lower CI > 0.50 with point estimates ≥ 0.60, replicated with humans; **kill** if SubText is preferred in < 55% of non-tied pairs against the best native baseline (T2/T5), or shows no win over T3.",
    "",
    "Known limitations: simulated users are kinder than real ones; no human-written control prompts (arm C) yet, so T4vT1 stands in; the judge shares a provider family with SubText's models unless --judge is changed (self-preference risk); T5 allows one clarification turn; v0 items were written by the team and are not a locked test split.",
    failures.length ? `\nFailed items (excluded): ${failures.join(", ")}` : "",
  ].join("\n");
}

async function main() {
  const items = selectItems();
  if (flag("estimate")) {
    const e = estimate(items.length);
    console.log(`Rough cost estimate for ${items.length} items (k=${cfg.k}${cfg.oracle ? ", oracle" : ""}${cfg.rubric ? ", rubric" : ""}): ~$${e.perItem.toFixed(2)} per item, ~$${e.total.toFixed(2)} total at list prices.`);
    console.log(`Prices used (USD/M tokens in/out): ${Object.entries(PRICES).map(([k, v]) => `${k} ${v.input}/${v.output}`).join(" · ")}. Token counts are assumptions; check the real run's report.`);
    return;
  }
  if (!cfg.dry && (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.length < 20 || /^your[-_]/i.test(process.env.ANTHROPIC_API_KEY))) {
    console.error("ANTHROPIC_API_KEY is missing or a placeholder. Use --dry for a wiring check, or --estimate for a cost estimate.");
    process.exit(1);
  }
  const llm = new EvalLlm(cfg);
  console.log(`SubText eval — ${cfg.dry ? "DRY RUN (development mock, no network)" : `downstream=${cfg.downstream} judge=${cfg.judge} simulator=${cfg.simulator}`} — ${items.length} items`);
  const concurrency = Math.max(1, Number(opt("concurrency", "2")));
  const results: ItemResult[] = [];
  const failures: string[] = [];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "results", stamp);
  fs.mkdirSync(path.join(dir, "items"), { recursive: true });

  const queue = [...items];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        try {
          const r = await runItem(llm, item);
          results.push(r);
          fs.writeFileSync(path.join(dir, "items", `${r.id}.json`), JSON.stringify(r, null, 2));
          console.log(`  ${r.id.padEnd(11)} ${r.questionsAsked}q  ${CONTRASTS.map((c) => `${c.id} ${(r.verdicts[c.id] ?? []).join("")}`).join("  ")}`);
        } catch (e) {
          failures.push(item.id);
          console.log(`  ${item.id.padEnd(11)} FAILED: ${e instanceof Error ? e.message : e}`);
        }
      }
    }),
  );
  results.sort((a, b) => a.id.localeCompare(b.id));

  const agg = aggregate(results);
  const meta = { ...cfg, date: new Date().toISOString(), evidence: cfg.dry ? "none (dry run)" : "synthetic (simulated users, LLM judges)", items: results.length, failures };
  const pairs = humanExport(results, path.join(dir, "human-eval"));
  fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify({ meta, aggregate: agg, usage: llm.usage.byRole, totalUsd: llm.usage.totalUsd }, null, 2));
  const md = markdown(meta, agg, llm.usage, failures);
  fs.writeFileSync(path.join(dir, "report.md"), md);
  console.log(`\n${md}\n\nSaved ${path.relative(process.cwd(), dir)}/ (report.md, report.json, items/, human-eval/ with ${pairs} blind pairs)`);
}

void main();
