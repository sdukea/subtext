import { z } from "zod";
import { isOperator, operatorDenied } from "@/server/operator";
import { Condition, createStudy, listStudies } from "@/server/study-store";

export const runtime = "nodejs";

/** Operator: list study sessions (summary only). */
export async function GET(req: Request) {
  if (!isOperator(req)) return operatorDenied();
  const studies = await listStudies();
  return Response.json({
    studies: studies.map((s) => ({
      id: s.id,
      condition: s.condition,
      participant: s.participant,
      note: s.note,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      phase: s.state?.phase ?? "not_started",
      title: s.state?.intent.title || null,
      questions: s.state?.rounds.reduce((n, r) => n + r.questions.length, 0) ?? 0,
      surveyed: !!s.state?.survey,
    })),
  });
}

const Create = z.object({
  condition: Condition,
  participant: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9 _-]+$/, "Use a code like P07, not a name."),
  note: z.string().max(500).optional(),
});

/** Operator: create a study session and get the participant link. */
export async function POST(req: Request) {
  if (!isOperator(req)) return operatorDenied();
  const body = Create.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: { code: "invalid_input", message: body.error.issues[0]?.message ?? "Invalid study.", retryable: false } }, { status: 400 });
  const s = await createStudy(body.data.condition, body.data.participant, body.data.note);
  return Response.json({ study: { id: s.id, condition: s.condition, participant: s.participant } });
}
