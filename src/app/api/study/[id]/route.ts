import { isOperator, operatorDenied } from "@/server/operator";
import { deleteStudy, getStudy, participantView, withStudy } from "@/server/study-store";

export const runtime = "nodejs";

/**
 * GET: participant view (state without engine proposals) for polling while the operator works.
 * With operator access and ?operator=1: the full study record.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/study/[id]">) {
  const { id } = await ctx.params;
  const s = await getStudy(id);
  if (!s) return Response.json({ error: { code: "not_found", message: "This study link is no longer valid.", retryable: false } }, { status: 404 });
  if (new URL(req.url).searchParams.get("operator") === "1") {
    if (!isOperator(req)) return operatorDenied();
    return Response.json({ study: s });
  }
  return Response.json({ studyId: s.id, consented: !!s.consentedAt, state: participantView(s.state) });
}

/** POST {consent: true}: participant confirms they are 18+ and agree to take part. */
export async function POST(req: Request, ctx: RouteContext<"/api/study/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { consent?: unknown } | null;
  if (body?.consent !== true) return Response.json({ error: { code: "invalid_input", message: "Consent is required.", retryable: false } }, { status: 400 });
  if (!(await getStudy(id))) return Response.json({ error: { code: "not_found", message: "This study link is no longer valid.", retryable: false } }, { status: 404 });
  await withStudy(id, async (s) => ({ study: { ...s, consentedAt: s.consentedAt ?? new Date().toISOString() }, result: null }));
  return Response.json({ ok: true });
}

/** Operator: delete the study and everything recorded in it. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/study/[id]">) {
  if (!isOperator(req)) return operatorDenied();
  const { id } = await ctx.params;
  await deleteStudy(id);
  return Response.json({ ok: true });
}
