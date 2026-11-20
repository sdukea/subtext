/**
 * Saved context ("Remember this", research/13 F9) — personal and project details reused as
 * defaults in later sessions. Stored only in this browser; sent to the server only as part of a
 * new session's request. Every access is guarded: storage can be unavailable.
 */
import { MemoryItem } from "@/engine/schema";
import { z } from "zod";

const KEY = "subtext.memory.v1";
const MAX = 30;

export function listMemory(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const r = z.array(MemoryItem).safeParse(JSON.parse(raw));
    return r.success ? r.data : [];
  } catch {
    return [];
  }
}

function write(items: MemoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* unavailable — memory is a convenience */
  }
}

/** Save or replace the remembered value for a slot. */
export function remember(input: { slotId: string; label: string; value: string; scope?: MemoryItem["scope"] }): MemoryItem[] {
  const items = listMemory().filter((m) => m.slotId !== input.slotId);
  const item: MemoryItem = {
    id: `m-${Date.now().toString(36)}`,
    slotId: input.slotId,
    label: input.label.slice(0, 80),
    value: input.value.slice(0, 1000),
    scope: input.scope ?? "personal",
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...items].slice(0, MAX);
  write(next);
  return next;
}

export function forget(id: string): MemoryItem[] {
  const next = listMemory().filter((m) => m.id !== id);
  write(next);
  return next;
}

/** Delete every SubText key in this browser: sessions, saved context and preferences. */
export function deleteAllLocalData() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("subtext.")) localStorage.removeItem(k);
  } catch {
    /* nothing to delete */
  }
}
