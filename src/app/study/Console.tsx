"use client";

/**
 * Researcher console for the Phase 0 questioning experiment (research/05 §17.2, research/14).
 *
 * - StudyList: create participant links (automated vs Wizard-of-Oz condition), export, delete.
 * - StudySession: watch a session live; in the Wizard-of-Oz condition, choose, edit or write the
 *   questions for each round (or stop). Every question records whether it came from the engine,
 *   was edited, or was written by the researcher.
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OperatorQuestion } from "@/engine/orchestrator";
import type { ConversationState, PlannedQuestion, QuestionFormat, Slot } from "@/engine/schema";
import { LIMITS } from "@/engine/schema";
import {
  OperatorError,
  createStudy,
  deleteStudy,
  download,
  getOperatorKey,
  getStudy,
  listStudies,
  publish,
  saveNote,
  setOperatorKey,
  stopQuestioning,
  type StudyRecord,
  type StudySummary,
} from "@/client/operator";

function useOperatorKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage
    setKey(getOperatorKey());
  }, []);
  return [key, (k: string) => (setOperatorKey(k), setKey(k))] as const;
}

function KeyPrompt({ onKey }: { onKey: (k: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="notice notice-warn" role="alert">
      <span>Operator access is required. Enter SUBTEXT_OPERATOR_KEY (kept in this tab only).</span>
      <span className="row">
        <input className="op-input" type="password" value={v} onChange={(e) => setV(e.target.value)} aria-label="Operator key" />
        <button className="btn btn-sm" onClick={() => onKey(v)}>
          Use key
        </button>
      </span>
    </div>
  );
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const PHASE: Record<string, string> = {
  not_started: "Not started",
  questioning: "Answering questions",
  awaiting_operator: "Waiting for you",
  ready_to_compose: "Writing spec",
  composed: "Spec ready",
};

// =============================================================================================

export function StudyList() {
  const [, setKey] = useOperatorKey();
  const [studies, setStudies] = useState<StudySummary[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [condition, setCondition] = useState<"auto" | "wizard">("wizard");
  const [participant, setParticipant] = useState("");
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listStudies()
      .then((s) => {
        setStudies(s);
        setDenied(false);
      })
      .catch((e) => (e instanceof OperatorError && e.status === 403 ? setDenied(true) : setError(e.message)));
  }, []);
  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 4000);
    return () => window.clearInterval(t);
  }, [refresh]);

  const link = (id: string) => `${window.location.origin}/?study=${id}`;

  return (
    <div className="op">
      <header className="op-head">
        <div>
          <h1>Study sessions</h1>
          <p className="lede">
            Phase 0 questioning experiment. Each link is one participant session in one condition: <strong>automated</strong> (the engine chooses questions) or <strong>Wizard-of-Oz</strong> (you choose them). Participants see the same product either way.
          </p>
        </div>
      </header>
      {denied && <KeyPrompt onKey={(k) => (setKey(k), refresh())} />}
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}

      <section className="op-card" aria-labelledby="new-study">
        <h2 id="new-study">New participant link</h2>
        <div className="op-form">
          <label>
            Participant code
            <input className="op-input" value={participant} placeholder="P07" maxLength={40} onChange={(e) => setParticipant(e.target.value)} />
          </label>
          <label>
            Condition
            <span className="segmented" role="group">
              <button type="button" aria-pressed={condition === "wizard"} onClick={() => setCondition("wizard")}>
                Wizard-of-Oz
              </button>
              <button type="button" aria-pressed={condition === "auto"} onClick={() => setCondition("auto")}>
                Automated
              </button>
            </span>
          </label>
          <label className="op-grow">
            Note (optional, researcher only)
            <input className="op-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button
            className="btn btn-primary"
            disabled={!participant.trim()}
            onClick={async () => {
              setError(null);
              try {
                const s = await createStudy(condition, participant.trim(), note);
                setCreated(s.id);
                setParticipant("");
                setNote("");
                refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Couldn't create the session.");
              }
            }}
          >
            Create link
          </button>
        </div>
        <p className="hint">Use a code, never a name or email. Counterbalance conditions across participants and tasks.</p>
        {created && (
          <p className="op-created">
            Participant link: <code>{link(created)}</code>{" "}
            <button className="link" onClick={() => void navigator.clipboard?.writeText(link(created))}>
              Copy
            </button>{" "}
            · <Link href={`/study/${created}`}>Open console</Link>
          </p>
        )}
      </section>

      <section aria-labelledby="sessions">
        <div className="op-row">
          <h2 id="sessions">Sessions</h2>
          <span className="row">
            <button className="btn btn-sm" onClick={() => void download("questions")}>
              Export questions (CSV)
            </button>
            <button className="btn btn-sm" onClick={() => void download("sessions")}>
              Export sessions (CSV)
            </button>
            <button className="btn btn-sm btn-quiet" onClick={() => void download("json")}>
              Full JSON
            </button>
          </span>
        </div>
        {!studies ? (
          <p className="hint">Loading…</p>
        ) : studies.length === 0 ? (
          <p className="hint">No sessions yet.</p>
        ) : (
          <table className="op-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Condition</th>
                <th>Task</th>
                <th>Status</th>
                <th>Questions</th>
                <th>Rated</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {studies.map((s) => (
                <tr key={s.id} className={s.phase === "awaiting_operator" ? "op-attention" : ""}>
                  <td>
                    <Link href={`/study/${s.id}`}>{s.participant}</Link>
                  </td>
                  <td>{s.condition === "wizard" ? "Wizard-of-Oz" : "Automated"}</td>
                  <td>{s.title ?? "—"}</td>
                  <td>{PHASE[s.phase] ?? s.phase}</td>
                  <td>{s.questions}</td>
                  <td>{s.surveyed ? "Yes" : "—"}</td>
                  <td>{fmtTime(s.createdAt)}</td>
                  <td className="op-actions">
                    <button className="link" onClick={() => void navigator.clipboard?.writeText(link(s.id))}>
                      Copy link
                    </button>
                    <button
                      className="link op-danger"
                      onClick={async () => {
                        if (!window.confirm(`Delete ${s.participant}'s session and everything recorded in it? This can't be undone.`)) return;
                        await deleteStudy(s.id);
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="hint">Study data is stored as files on this machine (.data/studies). Delete sessions when the study ends or when a participant asks.</p>
      </section>
    </div>
  );
}

// =============================================================================================

interface Draft {
  key: string;
  fromProposal?: string;
  slotId?: string;
  label: string;
  text: string;
  why: string;
  format: QuestionFormat;
  options: string;
}

const draftFromProposal = (q: PlannedQuestion): Draft => ({
  key: q.id,
  fromProposal: q.id,
  slotId: q.slotId,
  label: q.label,
  text: q.text,
  why: q.why ?? "",
  format: q.format,
  options: q.options.map((o) => o.label).join("\n"),
});

const draftFromSlot = (s: Slot): Draft => ({
  key: `slot-${s.id}-${Date.now()}`,
  slotId: s.id,
  label: s.label,
  text: s.question?.text ?? `What should I know about ${s.label.toLowerCase()}?`,
  why: s.question?.why ?? "",
  format: s.candidates.length >= 2 ? (s.question?.format === "multi_choice" ? "multi_choice" : "single_choice") : "free_text",
  options: s.candidates.map((c) => c.label).join("\n"),
});

const toOperatorQuestion = (d: Draft): OperatorQuestion => ({
  slotId: d.slotId,
  fromProposal: d.fromProposal,
  label: d.label.trim() || "Detail",
  text: d.text.trim(),
  why: d.why.trim() || undefined,
  format: d.format,
  options: d.format === "free_text" ? [] : d.options.split("\n").map((l) => ({ label: l.trim() })).filter((o) => o.label),
});

const SOURCE: Record<PlannedQuestion["source"], string> = {
  model: "engine",
  operator_selected: "you · engine's wording",
  operator_edited: "you · edited",
  operator_written: "you · written",
};

export function StudySession({ id }: { id: string }) {
  const [, setKey] = useOperatorKey();
  const [study, setStudy] = useState<StudyRecord | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftRound, setDraftRound] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(() => {
    getStudy(id)
      .then((s) => {
        setStudy(s);
        setDenied(false);
      })
      .catch((e) => (e instanceof OperatorError && e.status === 403 ? setDenied(true) : setError(e.message)));
  }, [id]);
  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 1500);
    return () => window.clearInterval(t);
  }, [refresh]);

  const state = study?.state ?? null;
  const awaiting = state?.phase === "awaiting_operator";

  // Seed the drafts with the engine's proposals once per waiting round.
  const roundIndex = state ? state.rounds.length : -1;
  if (awaiting && state && draftRound !== roundIndex) {
    setDraftRound(roundIndex);
    setDrafts(state.proposals.slice(0, LIMITS.maxQuestionsPerRound).map(draftFromProposal));
  }

  const update = (key: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const canAdd = drafts.length < LIMITS.maxQuestionsPerRound;

  const act = async (fn: () => Promise<StudyRecord>) => {
    setSending(true);
    setError(null);
    try {
      setStudy(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="op">
      <p className="op-back">
        <Link href="/study">← All sessions</Link>
      </p>
      {denied && <KeyPrompt onKey={(k) => (setKey(k), refresh())} />}
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      {!study ? (
        <p className="hint">Loading…</p>
      ) : (
        <>
          <header className="op-head">
            <div>
              <h1>
                {study.participant} · {study.condition === "wizard" ? "Wizard-of-Oz" : "Automated"}
              </h1>
              <p className="lede">
                {PHASE[state?.phase ?? "not_started"]}
                {study.consentedAt ? ` · consented ${fmtTime(study.consentedAt)}` : " · not yet consented"}
                {state?.mock ? " · DEVELOPMENT MOCK (no real AI)" : ""}
              </p>
            </div>
            <NoteEditor study={study} onSave={(n) => act(() => saveNote(id, n))} />
          </header>

          {!state ? (
            <p className="hint">The participant hasn’t submitted a request yet. This page updates automatically.</p>
          ) : (
            <div className="op-grid">
              <div>
                <section className="op-card">
                  <h2>Request</h2>
                  <p className="op-request">{state.request}</p>
                  <p className="hint">
                    {state.task.family} · complexity {state.task.complexity} · stakes {state.task.stakes} · expertise {state.task.expertise} · target {state.target}
                  </p>
                </section>

                {awaiting && study.condition === "wizard" && (
                  <section className="op-card op-compose" aria-labelledby="compose">
                    <h2 id="compose">Choose this round’s questions</h2>
                    <p className="hint">
                      The participant is waiting. Engine recommendation: {state.proposals.length ? `${state.proposals.length} question(s) below` : `stop (${state.stop.reasons.join(", ") || "nothing above threshold"})`}. Asked so far {state.rounds.reduce((n, r) => n + r.questions.length, 0)} of an engine budget of {state.budget.maxQuestions}. Max {LIMITS.maxQuestionsPerRound} per round. Never ask for passwords, keys or personal data.
                    </p>
                    {drafts.map((d) => (
                      <div className="op-draft" key={d.key}>
                        <div className="op-row">
                          <input className="op-input op-label" value={d.label} onChange={(e) => update(d.key, { label: e.target.value })} aria-label="Detail label" maxLength={60} />
                          <select className="op-input" value={d.format} onChange={(e) => update(d.key, { format: e.target.value as QuestionFormat })} aria-label="Format">
                            <option value="single_choice">Single choice</option>
                            <option value="multi_choice">Multiple choice</option>
                            <option value="free_text">Free text</option>
                          </select>
                          <span className="tag">{d.fromProposal ? "from engine" : d.slotId ? `slot: ${d.slotId}` : "new detail"}</span>
                          <button className="link op-danger" onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))}>
                            Remove
                          </button>
                        </div>
                        <textarea className="op-input" value={d.text} onChange={(e) => update(d.key, { text: e.target.value })} aria-label="Question" maxLength={300} rows={2} />
                        {d.format !== "free_text" && (
                          <textarea
                            className="op-input op-options"
                            value={d.options}
                            onChange={(e) => update(d.key, { options: e.target.value })}
                            aria-label="Options, one per line"
                            placeholder="One option per line (2–4). “Something else”, “You decide” and “Not sure” are added automatically."
                            rows={3}
                          />
                        )}
                      </div>
                    ))}
                    <div className="op-row">
                      <button
                        className="btn btn-sm"
                        disabled={!canAdd}
                        onClick={() => setDrafts((ds) => [...ds, { key: `new-${Date.now()}`, label: "", text: "", why: "", format: "free_text", options: "" }])}
                      >
                        Write a question
                      </button>
                      {state.proposals
                        .filter((p) => !drafts.some((d) => d.fromProposal === p.id))
                        .map((p) => (
                          <button key={p.id} className="btn btn-sm btn-quiet" disabled={!canAdd} onClick={() => setDrafts((ds) => [...ds, draftFromProposal(p)])}>
                            + {p.label}
                          </button>
                        ))}
                      <span className="spacer" />
                      <button className="btn" disabled={sending} onClick={() => void act(() => stopQuestioning(id))}>
                        Stop questioning
                      </button>
                      <button className="btn btn-primary" disabled={sending || !drafts.some((d) => d.text.trim())} onClick={() => void act(() => publish(id, drafts.filter((d) => d.text.trim()).map(toOperatorQuestion)))}>
                        Send {drafts.filter((d) => d.text.trim()).length || ""} to participant
                      </button>
                    </div>
                  </section>
                )}

                <Rounds state={state} />
                {state.survey && (
                  <section className="op-card">
                    <h2>Participant ratings</h2>
                    <p>
                      Spec fit: <strong>{state.survey.fit}/5</strong>
                      {state.survey.comment ? ` · “${state.survey.comment}”` : ""}
                    </p>
                  </section>
                )}
                {state.prompts.length > 0 && (
                  <section className="op-card">
                    <h2>Final spec ({state.prompts.at(-1)!.source})</h2>
                    <pre className="op-pre">{state.prompts.at(-1)!.text}</pre>
                  </section>
                )}
              </div>
              <SlotTable state={state} onAsk={awaiting && study.condition === "wizard" && canAdd ? (s) => setDrafts((ds) => [...ds, draftFromSlot(s)]) : undefined} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteEditor({ study, onSave }: { study: StudyRecord; onSave: (n: string) => void }) {
  const [note, setNote] = useState(study.note);
  const [synced, setSynced] = useState(study.note);
  if (synced !== study.note) {
    setSynced(study.note);
    setNote(study.note);
  }
  return (
    <label className="op-note">
      Researcher note
      <span className="row">
        <input className="op-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-sm" disabled={note === study.note} onClick={() => onSave(note)}>
          Save
        </button>
      </span>
    </label>
  );
}

function Rounds({ state }: { state: ConversationState }) {
  const answers = new Map(state.answers.map((a) => [a.questionId, a]));
  if (!state.rounds.length) return null;
  const secs = (a?: string, b?: string) => (a && b ? `${Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000)} s` : "—");
  return (
    <section className="op-card">
      <h2>Rounds</h2>
      {state.rounds.map((r) => (
        <div key={r.index} className="op-round">
          <p className="brief-group-label">
            Round {r.index + 1} · answered in {secs(r.shownAt, r.answeredAt)}
          </p>
          <ul className="op-qs">
            {r.questions.map((q) => {
              const a = answers.get(q.id);
              const rating = state.survey?.questionRatings[q.id];
              return (
                <li key={q.id}>
                  <div className="op-row">
                    <span>{q.text}</span>
                    <span className="tag">{SOURCE[q.source]}</span>
                    {rating && <span className={`tag ${rating === "useful" ? "tag-said" : ""}`}>{rating === "useful" ? "helped" : "didn't help"}</span>}
                  </div>
                  <p className="hint" style={{ margin: 0 }}>
                    → {a ? (a.kind === "option" || a.kind === "text" ? a.value : a.kind.replace("_", " ")) : "waiting"}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {state.stop.shouldStop && <p className="hint">Stopped: {state.stop.reasons.join(", ")}</p>}
    </section>
  );
}

function SlotTable({ state, onAsk }: { state: ConversationState; onAsk?: (s: Slot) => void }) {
  const f = (x?: number) => (x === undefined || !Number.isFinite(x) ? "—" : x.toFixed(2));
  return (
    <section className="op-card op-slots" aria-labelledby="slots">
      <h2 id="slots">Brief and engine scores</h2>
      <p className="hint">
        Agreement of sampled readings {f(state.stop.agreement)} · ask threshold {f(state.stop.threshold)} · critical details covered: {state.stop.criticalCovered ? "yes" : "no"}
      </p>
      <table className="op-table">
        <thead>
          <tr>
            <th>Detail</th>
            <th>Status</th>
            <th title="Consistency-based confidence from sampled interpretations">Conf.</th>
            <th>Impact</th>
            <th title="Net value of asking">Net</th>
            <th>Engine</th>
            {onAsk && <th />}
          </tr>
        </thead>
        <tbody>
          {state.slots.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>{s.label}</strong>
                {s.critical ? " *" : ""}
                <div className="hint" style={{ margin: 0 }}>
                  {s.value ?? "—"}
                </div>
              </td>
              <td>{s.status}</td>
              <td>{s.candidates.length ? f(s.confidence) : "open"}</td>
              <td>{f(s.impact)}</td>
              <td>{f(s.score?.net)}</td>
              <td>{s.decision ?? "—"}</td>
              {onAsk && (
                <td>
                  {!["stated", "answered", "edited", "removed"].includes(s.status) && (
                    <button className="link" onClick={() => onAsk(s)}>
                      Ask
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {state.contradictions.length > 0 && <p className="hint">Contradictions: {state.contradictions.map((c) => c.description).join(" · ")}</p>}
      <p className="hint">* critical detail</p>
    </section>
  );
}
