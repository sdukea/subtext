import { isOperator, operatorDenied } from "@/server/operator";
import { listStudies, type Study } from "@/server/study-store";

export const runtime = "nodejs";

const csv = (rows: (string | number | boolean | null | undefined)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";

const secs = (a?: string, b?: string) => (a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 100) / 10 : "");

/** One row per question asked: the unit of the human-vs-model questioning comparison. */
function questionRows(studies: Study[]) {
  const rows: (string | number | boolean | null | undefined)[][] = [
    ["study_id", "participant", "condition", "family", "target", "round", "round_seconds", "question_id", "source", "kind", "slot_id", "label", "format", "options", "question", "engine_net", "answer_kind", "answer", "rated"],
  ];
  for (const s of studies) {
    const st = s.state;
    if (!st) continue;
    const answers = new Map(st.answers.map((a) => [a.questionId, a]));
    for (const r of st.rounds) {
      for (const q of r.questions) {
        const a = answers.get(q.id);
        rows.push([
          s.id, s.participant, s.condition, st.task.family, st.target, r.index, secs(r.shownAt, r.answeredAt), q.id, q.source, q.kind, q.slotId, q.label, q.format,
          q.options.map((o) => o.label).join(" | "), q.text, Number.isFinite(q.net) ? q.net.toFixed(3) : "", a?.kind ?? "unanswered", a?.value ?? "", st.survey?.questionRatings[q.id] ?? "",
        ]);
      }
    }
  }
  return rows;
}

/** One row per session: effort, stopping and outcome measures. */
function sessionRows(studies: Study[]) {
  const rows: (string | number | boolean | null | undefined)[][] = [
    ["study_id", "participant", "condition", "created_at", "phase", "family", "target", "questions", "rounds", "answered", "you_decide", "not_sure", "skipped", "questioning_seconds", "stop_reasons", "brief_from_user", "brief_assumed", "brief_edits", "brief_kept", "prompt_versions", "prompt_words", "prompt_edited", "fit_1_5", "questions_helped", "questions_not_helped", "comment", "request"],
  ];
  for (const s of studies) {
    const st = s.state;
    if (!st) {
      rows.push([s.id, s.participant, s.condition, s.createdAt, "not_started"]);
      continue;
    }
    const kinds = (k: string) => st.answers.filter((a) => a.kind === k).length;
    const first = st.rounds[0]?.shownAt;
    const last = st.rounds.at(-1)?.answeredAt;
    const ratings = Object.values(st.survey?.questionRatings ?? {});
    const prompt = st.prompts.at(-1);
    rows.push([
      s.id, s.participant, s.condition, s.createdAt, st.phase, st.task.family, st.target,
      st.rounds.reduce((n, r) => n + r.questions.length, 0), st.rounds.length, kinds("option") + kinds("text"), kinds("you_decide"), kinds("not_sure"), kinds("skipped"),
      secs(first, last), st.stop.reasons.join(" "),
      st.slots.filter((x) => ["stated", "answered", "edited", "remembered"].includes(x.status)).length,
      st.slots.filter((x) => ["assumed", "delegated"].includes(x.status)).length,
      st.edits.filter((e) => !e.confirmed).length, st.edits.filter((e) => e.confirmed).length,
      st.prompts.length, prompt ? prompt.text.split(/\s+/).filter(Boolean).length : "", st.prompts.some((p) => p.source === "edited"),
      st.survey?.fit ?? "", ratings.filter((r) => r === "useful").length, ratings.filter((r) => r === "not_useful").length, st.survey?.comment ?? "", st.request,
    ]);
  }
  return rows;
}

/** Operator: export all study data as JSON (everything) or CSV (questions / sessions). */
export async function GET(req: Request) {
  if (!isOperator(req)) return operatorDenied();
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const studies = await listStudies();
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "questions" || format === "sessions") {
    return new Response(csv(format === "questions" ? questionRows(studies) : sessionRows(studies)), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="subtext-study-${format}-${stamp}.csv"` },
    });
  }
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), evidence: "human participants (Phase 0 study prototype)", studies }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="subtext-study-${stamp}.json"` },
  });
}
