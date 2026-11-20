/** Researcher (operator) API client for the study console. The key, if any, lives in sessionStorage. */
import type { OperatorQuestion } from "@/engine/orchestrator";
import type { ConversationState } from "@/engine/schema";

const KEY = "subtext.operatorKey";

export function getOperatorKey(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
export function setOperatorKey(k: string) {
  try {
    sessionStorage.setItem(KEY, k);
  } catch {
    /* ignore */
  }
}

export class OperatorError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", "x-operator-key": getOperatorKey(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new OperatorError(res.status, body?.error?.message ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface StudySummary {
  id: string;
  condition: "auto" | "wizard";
  participant: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  phase: string;
  title: string | null;
  questions: number;
  surveyed: boolean;
}

export interface StudyRecord {
  id: string;
  condition: "auto" | "wizard";
  participant: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  consentedAt?: string;
  state: ConversationState | null;
}

export const listStudies = () => call<{ studies: StudySummary[] }>("/api/study").then((r) => r.studies);
export const createStudy = (condition: "auto" | "wizard", participant: string, note: string) =>
  call<{ study: { id: string } }>("/api/study", { method: "POST", body: JSON.stringify({ condition, participant, note }) }).then((r) => r.study);
export const getStudy = (id: string) => call<{ study: StudyRecord }>(`/api/study/${id}?operator=1`).then((r) => r.study);
export const deleteStudy = (id: string) => call<{ ok: true }>(`/api/study/${id}`, { method: "DELETE" });
export const publish = (id: string, questions: OperatorQuestion[]) =>
  call<{ study: StudyRecord }>(`/api/study/${id}/operator`, { method: "POST", body: JSON.stringify({ action: "publish", questions }) }).then((r) => r.study);
export const stopQuestioning = (id: string) => call<{ study: StudyRecord }>(`/api/study/${id}/operator`, { method: "POST", body: JSON.stringify({ action: "stop" }) }).then((r) => r.study);
export const saveNote = (id: string, note: string) => call<{ study: StudyRecord }>(`/api/study/${id}/operator`, { method: "POST", body: JSON.stringify({ action: "note", note }) }).then((r) => r.study);

export async function download(format: "json" | "questions" | "sessions") {
  const res = await fetch(`/api/study/export?format=${format}`, { headers: { "x-operator-key": getOperatorKey() }, cache: "no-store" });
  if (!res.ok) throw new OperatorError(res.status, "Export failed");
  const blob = await res.blob();
  const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `subtext-study.${format === "json" ? "json" : "csv"}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
