import type { ConversationState, MemoryItem, Survey, TargetId } from "@/engine/schema";
import type { AnswerInput } from "@/engine/orchestrator";

type Study = { studyId?: string };
export type Action = Study &
  (
    | { action: "start"; request: string; target: TargetId; memory?: MemoryItem[] }
    | { action: "answer"; state: ConversationState; answers: AnswerInput[] }
    | { action: "revise"; state: ConversationState; answer: AnswerInput }
    | { action: "refine"; state: ConversationState; request: string }
    | { action: "edit"; state: ConversationState; slotId: string; value: string | null; confirmed?: boolean }
    | { action: "finish"; state: ConversationState; answers?: AnswerInput[] }
    | { action: "compose"; state: ConversationState }
    | { action: "prompts"; state: ConversationState }
  );

export class ApiError extends Error {
  constructor(public code: string, message: string, public retryable: boolean) {
    super(message);
  }
}

export async function callSession(body: Action, timeoutMs = 90_000): Promise<ConversationState> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError("offline", "You're offline. Your session is saved — try again when you're back online.", true);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    let json: { state?: ConversationState; error?: { code: string; message: string; retryable: boolean } } | undefined;
    try {
      json = await res.json();
    } catch {
      throw new ApiError("bad_response", "SubText got an unreadable response. Try again.", true);
    }
    if (!res.ok || !json?.state) {
      const e = json?.error;
      throw new ApiError(e?.code ?? "unknown", e?.message ?? "Something went wrong. Try again.", e?.retryable ?? true);
    }
    return json.state;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") throw new ApiError("timeout", "That took too long. Try again.", true);
    throw new ApiError("network", "Couldn't reach SubText. Check your connection and try again.", true);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMode(): Promise<{ mock: boolean }> {
  try {
    const res = await fetch("/api/session");
    return (await res.json()) as { mock: boolean };
  } catch {
    return { mock: false };
  }
}

// ---- study sessions (Phase 0 experiments) ----

export interface StudyView {
  studyId: string;
  consented: boolean;
  state: ConversationState | null;
}

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as (T & { error?: { code: string; message: string; retryable: boolean } }) | null;
  if (!res.ok || !body) throw new ApiError(body?.error?.code ?? "unknown", body?.error?.message ?? "Something went wrong.", body?.error?.retryable ?? true);
  return body;
}

export async function fetchStudy(id: string): Promise<StudyView> {
  return json<StudyView>(await fetch(`/api/study/${encodeURIComponent(id)}`, { cache: "no-store" }));
}

export async function giveConsent(id: string): Promise<void> {
  await json(await fetch(`/api/study/${encodeURIComponent(id)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ consent: true }) }));
}

export async function submitSurvey(id: string, survey: Omit<Survey, "submittedAt">): Promise<ConversationState> {
  const r = await json<{ state: ConversationState }>(
    await fetch(`/api/study/${encodeURIComponent(id)}/survey`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(survey) }),
  );
  return r.state;
}
