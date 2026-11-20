import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createStudy, deleteStudy, getStudy, isStudyId, listStudies, participantView, withStudy } from "./study-store";
import { isOperator } from "./operator";
import { start } from "@/engine/orchestrator";
import { MockProvider } from "@/engine/mock";

let dir: string;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "subtext-study-"));
  process.env.SUBTEXT_DATA_DIR = dir;
});
afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  delete process.env.SUBTEXT_DATA_DIR;
});

describe("study store", () => {
  it("creates, reads, lists and deletes sessions", async () => {
    const s = await createStudy("wizard", "P01", "pilot");
    expect(isStudyId(s.id)).toBe(true);
    expect((await getStudy(s.id))?.participant).toBe("P01");
    expect((await listStudies()).map((x) => x.id)).toContain(s.id);
    await deleteStudy(s.id);
    expect(await getStudy(s.id)).toBeNull();
  });

  it("rejects ids that could escape the data directory", async () => {
    expect(isStudyId("../../etc/passwd")).toBe(false);
    expect(await getStudy("../secrets")).toBeNull();
  });

  it("serialises concurrent read-modify-write on one study", async () => {
    const s = await createStudy("auto", "P02");
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => withStudy(s.id, async (st) => ({ study: { ...st, note: `${st.note}${i},` }, result: null }))),
    );
    const notes = (await getStudy(s.id))!.note.split(",").filter(Boolean);
    expect(notes).toHaveLength(10);
  });

  it("the participant view hides the engine's proposals", async () => {
    const state = await start("Build me a booking site", "app_builder", new MockProvider(), { experiment: { studyId: "st-aaaaaaaaaa", condition: "wizard" } });
    expect(state.proposals.length).toBeGreaterThan(0);
    expect(participantView(state)!.proposals).toEqual([]);
  });
});

describe("operator access", () => {
  const req = (key?: string) => new Request("http://x/api/study", { headers: key ? { "x-operator-key": key } : {} });
  it("requires the configured key", () => {
    vi.stubEnv("SUBTEXT_OPERATOR_KEY", "correct-horse");
    expect(isOperator(req("correct-horse"))).toBe(true);
    expect(isOperator(req("wrong"))).toBe(false);
    expect(isOperator(req())).toBe(false);
    vi.unstubAllEnvs();
  });
  it("without a key, allows local development but denies production", () => {
    vi.stubEnv("SUBTEXT_OPERATOR_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isOperator(req())).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(isOperator(req())).toBe(true);
    vi.unstubAllEnvs();
  });
});
