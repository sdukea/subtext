import { z } from "zod";
import { StudyNotFound, participantView, withStudy } from "@/server/study-store";

export const runtime = "nodejs";

const Body = z.object({
  questionRatings: z.record(z.string().max(200), z.enum(["useful", "not_useful"])),
  fit: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

/** Participant: the short post-session questionnaire (question usefulness + spec fit). */
export async function POST(req: Request, ctx: RouteContext<"/api/study/[id]/survey">) {
  const { id } = await ctx.params;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: { code: "invalid_input", message: "Please rate the result from 1 to 5.", retryable: false } }, { status: 400 });
  try {
    const state = await withStudy(id, async (s) => {
      if (!s.state) throw new StudyNotFound();
      const asked = new Set(s.state.rounds.flatMap((r) => r.questions.map((q) => q.id)));
      const ratings = Object.fromEntries(Object.entries(body.data.questionRatings).filter(([k]) => asked.has(k)));
      const next = { ...s.state, survey: { ...body.data, questionRatings: ratings, submittedAt: new Date().toISOString() } };
      return { study: { ...s, state: next }, result: next };
    });
    return Response.json({ state: participantView(state) });
  } catch (err) {
    if (err instanceof StudyNotFound) return Response.json({ error: { code: "not_found", message: "This study link is no longer valid.", retryable: false } }, { status: 404 });
    throw err;
  }
}
