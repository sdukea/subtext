import "server-only";
/**
 * Study store for the Phase 0 experiments (Wizard-of-Oz vs automated questioning).
 *
 * One JSON file per study session under SUBTEXT_DATA_DIR (default: ./.data/studies). This is a
 * researcher-run prototype on one machine, not production storage: no database, no accounts.
 * Files contain participants' requests and answers, so the directory is git-ignored and every
 * study can be deleted from the operator console. Writes are atomic (temp file + rename) and
 * serialised per study so an operator action can't interleave with a participant action.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { ConversationState } from "@/engine/schema";

export const Condition = z.enum(["auto", "wizard"]);
export type Condition = z.infer<typeof Condition>;

export const Study = z.object({
  id: z.string(),
  condition: Condition,
  /** Researcher-assigned code such as "P07". Never a name or email. */
  participant: z.string().max(40),
  note: z.string().max(500).default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  consentedAt: z.string().optional(),
  state: ConversationState.nullable(),
});
export type Study = z.infer<typeof Study>;

const ID = /^st-[a-z0-9]{10}$/;
export const isStudyId = (id: string) => ID.test(id);

function dir() {
  return process.env.SUBTEXT_DATA_DIR ? path.resolve(process.env.SUBTEXT_DATA_DIR, "studies") : path.join(process.cwd(), ".data", "studies");
}
const file = (id: string) => {
  if (!isStudyId(id)) throw new Error("bad study id");
  return path.join(dir(), `${id}.json`);
};

const chains = new Map<string, Promise<void>>();
/** Serialise read-modify-write per study. */
export async function withStudy<T>(id: string, fn: (s: Study) => Promise<{ study: Study; result: T }>): Promise<T> {
  const prev = chains.get(id) ?? Promise.resolve();
  let release!: () => void;
  const done = new Promise<void>((r) => (release = r));
  const next = prev.then(() => done);
  chains.set(id, next);
  await prev;
  try {
    const s = await getStudy(id);
    if (!s) throw new StudyNotFound();
    const { study, result } = await fn(s);
    await write({ ...study, updatedAt: new Date().toISOString() });
    return result;
  } finally {
    release();
    if (chains.get(id) === next) chains.delete(id);
  }
}

export class StudyNotFound extends Error {
  constructor() {
    super("Study session not found");
  }
}

async function write(s: Study) {
  await fs.mkdir(dir(), { recursive: true });
  const f = file(s.id);
  const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2), "utf8");
  await fs.rename(tmp, f);
}

export async function createStudy(condition: Condition, participant: string, note = ""): Promise<Study> {
  const now = new Date().toISOString();
  const id = `st-${crypto.randomBytes(8).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").padEnd(10, "0").slice(0, 10)}`;
  const s: Study = { id, condition, participant: participant.trim().slice(0, 40), note: note.trim().slice(0, 500), createdAt: now, updatedAt: now, state: null };
  await write(s);
  return s;
}

export async function getStudy(id: string): Promise<Study | null> {
  if (!isStudyId(id)) return null;
  try {
    const raw = JSON.parse(await fs.readFile(file(id), "utf8"));
    const r = Study.safeParse(raw);
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export async function listStudies(): Promise<Study[]> {
  let names: string[] = [];
  try {
    names = await fs.readdir(dir());
  } catch {
    return [];
  }
  const out: Study[] = [];
  for (const n of names) {
    if (!n.endsWith(".json")) continue;
    const s = await getStudy(n.slice(0, -5));
    if (s) out.push(s);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteStudy(id: string): Promise<void> {
  await fs.rm(file(id), { force: true });
}

/** What a participant's browser may see: no engine proposals, no researcher note. */
export function participantView(state: ConversationState | null): ConversationState | null {
  return state ? { ...state, proposals: [] } : null;
}
