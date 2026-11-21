import { NextResponse } from "next/server";
import { z } from "zod";
import { AnswerKind, ConversationState, LIMITS, MemoryItem, TargetId } from "@/engine/schema";
import { EngineError, answer, compose, editSlot, finish, refine, revise, start } from "@/engine/orchestrator";
import { StudyNotFound, getStudy, isStudyId, participantView, withStudy } from "@/server/study-store";
import { getProvider } from "@/server/provider";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const Answer = z.object({
  questionId: z.string().max(200),
  kind: AnswerKind,
  optionIds: z.array(z.string().max(100)).max(8).optional(),
  text: z.string().max(LIMITS.answerMaxChars).optional(),
});

const study = { studyId: z.string().max(40).optional() };
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), request: z.string().max(LIMITS.requestMaxChars), target: TargetId, memory: z.array(MemoryItem).max(30).optional(), ...study }),
  z.object({ action: z.literal("answer"), state: ConversationState, answers: z.array(Answer).max(LIMITS.maxQuestionsPerRound + 2), ...study }),
  z.object({ action: z.literal("revise"), state: ConversationState, answer: Answer, ...study }),
  z.object({ action: z.literal("refine"), state: ConversationState, request: z.string().max(LIMITS.requestMaxChars), ...study }),
  z.object({ action: z.literal("edit"), state: ConversationState, slotId: z.string().max(100), value: z.string().max(LIMITS.editMaxChars).nullable(), confirmed: z.boolean().optional(), ...study }),
  z.object({ action: z.literal("finish"), state: ConversationState, answers: z.array(Answer).max(8).optional(), ...study }),
  z.object({ action: z.literal("compose"), state: ConversationState, ...study }),
  // Study sessions only: persist client-side prompt edits and target switches (no model call).
  z.object({ action: z.literal("prompts"), state: ConversationState, ...study }),
]);

type Body = z.infer<typeof Body>;

const STATUS: Record<EngineError["code"], number> = {
  invalid_input: 400,
  invalid_state: 409,
  rate_limited: 429,
  provider_unavailable: 503,
  provider_failed: 502,
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: { code: "rate_limited", message: "Too many requests. Wait a minute and try again.", retryable: true } }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "invalid_input", message: "Malformed request.", retryable: false } }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_input", message: "SubText couldn't read that request. If this keeps happening, start a new session.", retryable: false } },
      { status: 400 },
    );
  }

  const provider = getProvider();
  const body = parsed.data;
  try {
    let state: ConversationState;
    if (body.studyId) {
      state = await runStudyAction(body, body.studyId, provider);
    } else {
      state = await runAction(body, provider);
    }
    // Validate our own output before it leaves the server.
    const checked = ConversationState.safeParse(state);
    if (!checked.success) {
      console.error("[subtext] produced invalid state", checked.error.issues.slice(0, 5));
      return NextResponse.json({ error: { code: "internal", message: "Something went wrong on our side. Try again.", retryable: true } }, { status: 500 });
    }
    return NextResponse.json({ state: body.studyId ? participantView(checked.data) : checked.data });
  } catch (err) {
    if (err instanceof StudyNotFound) {
      return NextResponse.json({ error: { code: "not_found", message: "This study link is no longer valid.", retryable: false } }, { status: 404 });
    }
    if (err instanceof EngineError) {
      return NextResponse.json({ error: { code: err.code, message: err.message, retryable: err.retryable } }, { status: STATUS[err.code] });
    }
    console.error("[subtext] unexpected error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: { code: "internal", message: "Something went wrong on our side. Try again.", retryable: true } }, { status: 500 });
  }
}

/**
 * Study sessions: the stored state is authoritative (the operator may have changed it), so the
 * client's copy is ignored except for prompt edits. Each action runs under the study's lock.
 */
async function runStudyAction(body: Body, studyId: string, provider: ReturnType<typeof getProvider>): Promise<ConversationState> {
  if (!isStudyId(studyId) || !(await getStudy(studyId))) throw new StudyNotFound();
  return withStudy(studyId, async (study) => {
    let state: ConversationState;
    if (body.action === "start") {
      // One session per study link; a reload returns the existing session.
      state = study.state ?? (await start(body.request, body.target, provider, { experiment: { studyId, condition: study.condition } }));
    } else {
      if (!study.state) throw new EngineError("invalid_state", "This study session hasn't started yet.");
      if (body.action === "prompts") {
        state = { ...study.state, prompts: body.state.prompts, target: body.state.target, updatedAt: new Date().toISOString() };
      } else {
        state = await runAction({ ...body, state: study.state }, provider);
      }
    }
    return { study: { ...study, state }, result: state };
  });
}

async function runAction(body: Body, provider: ReturnType<typeof getProvider>): Promise<ConversationState> {
  let state: ConversationState;
    switch (body.action) {
      case "start":
        state = await start(body.request, body.target, provider, { memory: body.memory });
        break;
      case "answer":
        state = await answer(body.state, body.answers, provider);
        break;
      case "revise":
        state = await revise(body.state, body.answer, provider);
        break;
      case "refine":
        state = await refine(body.state, body.request, provider);
        break;
      case "edit":
        state = editSlot(body.state, body.slotId, body.value, { confirmed: body.confirmed });
        break;
      case "finish":
        state = finish(body.state, body.answers);
        break;
      case "compose":
        state = await compose(body.state, provider);
        break;
      case "prompts":
        state = body.state;
        break;
    }
  return state;
}

export async function GET() {
  const p = getProvider();
  return NextResponse.json({ mock: p.mock });
}
