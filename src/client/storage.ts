/**
 * Per-browser session history (research/07 S7). Content stays on this device; nothing is synced.
 * Every access is guarded: storage can be unavailable (private mode, blocked site data).
 */
import { ConversationState } from "@/engine/schema";

const KEY = "subtext.sessions.v1";
const MAX = 30;

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  phase: ConversationState["phase"];
}

function readAll(): Record<string, ConversationState> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, ConversationState> = {};
    for (const [id, v] of Object.entries(parsed)) {
      const r = ConversationState.safeParse(v);
      if (r.success) out[id] = r.data; // silently drop corrupted / outdated entries
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, ConversationState>) {
  try {
    const sorted = Object.values(all).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(sorted.map((s) => [s.id, s]))));
  } catch {
    /* storage full or unavailable — history is a convenience */
  }
}

export function saveSession(s: ConversationState) {
  const all = readAll();
  all[s.id] = s;
  writeAll(all);
}

export function loadSession(id: string): ConversationState | undefined {
  return readAll()[id];
}

export function deleteSession(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

export function listSessions(): SessionSummary[] {
  return Object.values(readAll())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => ({ id: s.id, title: s.intent.title || s.request.slice(0, 60), updatedAt: s.updatedAt, phase: s.phase }));
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
