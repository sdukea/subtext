/** Dev probe: run one real start() and print the plan. Usage: npx tsx scripts/probe.ts "request" [target] */
import { AnthropicProvider } from "../src/server/anthropic";
import { start } from "../src/engine/orchestrator";

const req = process.argv[2] ?? "Build me a website for my business";
const target = (process.argv[3] ?? "generic") as "generic";
const p = new AnthropicProvider({ analyseModel: process.env.SUBTEXT_ANALYSE_MODEL || "claude-haiku-5-5", composeModel: "claude-sonnet-5-5", samples: 5 });
const t = Date.now();
const s = await start(req, target, p);
console.log(`\n${req}\n  family=${s.task.family} complexity=${s.task.complexity} stakes=${s.task.stakes} expertise=${s.task.expertise} (${Date.now() - t}ms)`);
for (const c of s.calls) console.log(`  call ${c.stage} ${c.model} ${c.ms}ms in=${c.inputTokens} out=${c.outputTokens}`);
for (const sl of s.slots) console.log(`  [${sl.status.padEnd(9)}] ${sl.decision?.padEnd(8)} ${sl.label}: ${sl.value ?? ""}  conf=${sl.confidence.toFixed(2)} net=${sl.score?.net.toFixed(3) ?? "-"}`);
console.log(`  stop=${JSON.stringify(s.stop)}`);
for (const q of s.pending) console.log(`  Q (${q.format}) ${q.text}\n     ${q.options.map((o) => o.label).join(" | ")}  [default: ${q.defaultLabel}]`);
