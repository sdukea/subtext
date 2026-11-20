import { z } from "zod";
import { EngineError, operatorStop, publishRound } from "@/engine/orchestrator";
import { ConversationState, LIMITS, QuestionFormat } from "@/engine/schema";
import { isOperator, operatorDenied } from "@/server/operator";
import { StudyNotFound, withStudy } from "@/server/study-store";

export const runtime = "nodejs";

const OperatorQuestion = z.object({
  slotId: z.string().max(100).optional(),
  label: z.string().max(60),
  text: z.string().min(1).max(300),
  why: z.string().max(200).optional(),
  format: QuestionFormat,
  options: z.array(z.object({ id: z.string().max(60).optional(), label: z.string().max(80), description: z.string().max(160).optional() })).max(LIMITS.maxOptions),
  fromProposal: z.string().max(200).optional(),
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish"), questions: z.array(OperatorQuestion).min(1).max(LIMITS.maxQuestionsPerRound) }),
  z.object({ action: z.literal("stop") }),
  z.object({ action: z.literal("note"), note: z.string().max(500) }),
]);

/** Operator actions on a Wizard-of-Oz session: publish a round, stop questioning, or annotate. */
export async function POST(req: Request, ctx: RouteContext<"/api/study/[id]/operator">) {
  if (!isOperator(req)) return operatorDenied();
  const { id } = await ctx.params;
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: { code: "invalid_input", message: body.error.issues[0]?.message ?? "Invalid action.", retryable: false } }, { status: 400 });
  try {
    const study = await withStudy(id, async (s) => {
      if (body.data.action === "note") return { study: { ...s, note: body.data.note }, result: { ...s, note: body.data.note } };
      if (!s.state) throw new EngineError("invalid_state", "The participant hasn't started yet.");
      const state = body.data.action === "publish" ? publishRound(s.state, body.data.questions) : operatorStop(s.state);
      ConversationState.parse(state);
      const next = { ...s, state };
      return { study: next, result: next };
    });
    return Response.json({ study });
  } catch (err) {
    if (err instanceof StudyNotFound) return Response.json({ error: { code: "not_found", message: err.message, retryable: false } }, { status: 404 });
    if (err instanceof EngineError) return Response.json({ error: { code: err.code, message: err.message, retryable: false } }, { status: 409 });
    console.error("[subtext] operator action failed", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: { code: "internal", message: "Operator action failed.", retryable: true } }, { status: 500 });
  }
}
