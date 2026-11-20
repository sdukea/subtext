"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerEvent, ConversationState, MemoryItem, PlannedQuestion, Slot, TargetId } from "@/engine/schema";
import { LIMITS } from "@/engine/schema";
import { editSlot } from "@/engine/orchestrator";
import { renderPrompt, TARGETS } from "@/engine/render";
import { ApiError, callSession, fetchMode, fetchStudy, giveConsent, type Action } from "@/client/api";
import { deleteSession, listSessions, loadSession, relativeTime, saveSession, type SessionSummary } from "@/client/storage";
import { deleteAllLocalData, forget, listMemory, remember } from "@/client/memory";
import { Consent, Survey } from "./components/Study";
import { QuestionCard, draftFromAnswer, emptyDraft, isAnswered, toInput, type Draft } from "./components/QuestionCard";
import { Brief } from "./components/Brief";
import { PromptView } from "./components/PromptView";

const EXAMPLES = [
  "Build a booking site for my mobile dog-grooming business",
  "Add CSV export to the orders page in my Next.js app",
  "An internal tool for our sales team to log site visits from their phones",
  "Research whether there's a market for invoice software for UK dental clinics",
];

const ANALYSE_STEPS = ["Reading your request…", "Working out what's missing…", "Choosing what's worth asking…"];
const ANSWER_STEPS = ["Taking in your answers…", "Updating the brief…", "Checking what's still missing…"];
const COMPOSE_STEPS = ["Gathering everything you've said…", "Deciding what belongs in the spec…", "Writing the spec…"];

type Busy = { steps: string[]; kind: "analyse" | "compose" | "edit" } | null;
type ErrorState = { message: string; retry?: () => void; alt?: { label: string; run: () => void } } | null;
type StudyCtx = { id: string; consented: boolean; error?: string };
const OPERATOR_STEPS = ["Working out what's missing…", "Choosing what's worth asking…"];

export default function Page() {
  const [mock, setMock] = useState(false);
  const [session, setSession] = useState<ConversationState | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<ErrorState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recent, setRecent] = useState<SessionSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [reviewing, setReviewing] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [memory, setMemory] = useState<MemoryItem[]>([]);
  const [study, setStudy] = useState<StudyCtx | null>(null);

  // ---- boot: mode + session recovery (or a study session from the server) ----
  useEffect(() => {
    void fetchMode().then((m) => setMock(m.mock));
    const params = new URLSearchParams(window.location.search);
    const studyId = params.get("study");
    if (studyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
      setStudy({ id: studyId, consented: false });
      fetchStudy(studyId)
        .then((v) => {
          setStudy({ id: studyId, consented: v.consented });
          if (v.state) {
            setSession(v.state);
            setSelectedVersion(v.state.prompts.at(-1)?.id ?? "");
          }
        })
        .catch((e) => setStudy({ id: studyId, consented: false, error: e instanceof ApiError ? e.message : "This study link couldn't be opened." }));
      return;
    }
    const id = params.get("s");
    const restored = id ? loadSession(id) : undefined;
    setRecent(listSessions());
    setMemory(listMemory());
    if (restored) setSession(restored);
  }, []);

  // ---- persist + URL (study sessions live on the server, not in this browser) ----
  useEffect(() => {
    if (study) return;
    const url = new URL(window.location.href);
    if (session) {
      saveSession(session);
      url.searchParams.set("s", session.id);
    } else {
      url.searchParams.delete("s");
    }
    window.history.replaceState(null, "", url);
  }, [session, study]);

  // Each new round / view starts at the top (avoids landing mid-page after a long round).
  const viewKey = session ? `${session.id}:${session.phase}:${session.rounds.length}:${session.prompts.length > 0}:${reviewing}` : "home";
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [viewKey]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  // ---- server calls ----
  async function run(body: Action, steps: string[], kind: NonNullable<Busy>["kind"], opts: { onError?: (e: ApiError) => ErrorState } = {}) {
    setBusy({ steps, kind });
    setError(null);
    try {
      const next = await callSession(study ? { ...body, studyId: study.id } : body);
      setSession(next);
      return next;
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError("unknown", "Something went wrong.", true);
      setError(opts.onError?.(e) ?? { message: e.message, retry: e.retryable ? () => void run(body, steps, kind, opts) : undefined });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function composeNow(s: ConversationState) {
    const next = await run({ action: "compose", state: s }, COMPOSE_STEPS, "compose");
    if (next) {
      setSelectedVersion(next.prompts.at(-1)!.id);
      setReviewing(false);
    }
  }

  function afterAnalysis(next: ConversationState | null) {
    if (!next) return;
    setDrafts({});
    if (next.phase === "ready_to_compose" && (next.prompts.length === 0 || !next.promptStale)) void composeNow(next);
  }
  const afterRef = useRef(afterAnalysis);
  afterRef.current = afterAnalysis;

  // Wizard-of-Oz: while a researcher chooses the questions, poll for the published round.
  const awaiting = session?.phase === "awaiting_operator";
  useEffect(() => {
    if (!study || !awaiting || busy) return;
    const t = window.setInterval(() => {
      fetchStudy(study.id)
        .then((v) => {
          if (v.state && v.state.phase !== "awaiting_operator") {
            setSession(v.state);
            afterRef.current(v.state);
          }
        })
        .catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(t);
  }, [study, awaiting, busy]);

  const start = async (request: string, target: TargetId, justWrite: boolean) => {
    const next = await run({ action: "start", request, target, ...(study ? {} : { memory }) }, ANALYSE_STEPS, "analyse");
    if (!next) return;
    if (justWrite && (next.phase === "questioning" || next.phase === "awaiting_operator")) {
      const done = await run({ action: "finish", state: next }, ["Skipping questions…"], "analyse");
      if (done) void composeNow(done);
      return;
    }
    afterAnalysis(next);
  };

  const submitRound = async () => {
    if (!session) return;
    const answers = session.pending.map((q) => toInput(q, drafts[q.id]));
    const body: Action = { action: "answer", state: session, answers };
    const next = await run(body, ANSWER_STEPS, "analyse", {
      onError: (e) => ({
        message: e.code === "offline" ? e.message : "Couldn't load the next questions.",
        retry: () => void submitRound(),
        alt: { label: "Write the spec without more questions", run: () => void writeNow() },
      }),
    });
    afterAnalysis(next);
  };

  const writeNow = async () => {
    if (!session) return;
    const answers = session.pending.filter((q) => isAnswered(drafts[q.id])).map((q) => toInput(q, drafts[q.id]));
    const next = await run({ action: "finish", state: session, answers }, ["Wrapping up…"], "analyse");
    if (next) {
      setDrafts({});
      void composeNow(next);
    }
  };

  const skipRound = async () => {
    if (!session) return;
    const next = await run(
      { action: "answer", state: session, answers: session.pending.map((q) => ({ questionId: q.id, kind: "skipped" as const })) },
      ANSWER_STEPS,
      "analyse",
    );
    afterAnalysis(next);
  };

  const revise = async (questionId: string, draft: Draft, q: PlannedQuestion) => {
    if (!session) return;
    const next = await run({ action: "revise", state: session, answer: toInput(q, draft) }, ANSWER_STEPS, "analyse");
    if (next) {
      setDrafts({});
      if (next.phase === "ready_to_compose" && next.prompts.length === 0) void composeNow(next);
    }
  };

  const refine = async (request: string) => {
    if (!session) return;
    const next = await run({ action: "refine", state: session, request }, ANALYSE_STEPS, "analyse");
    if (next) {
      setReviewing(true);
      afterAnalysis(next);
    }
  };

  const editBrief = (slotId: string, value: string | null, opts: { confirmed?: boolean } = {}) => {
    if (!session) return;
    try {
      const next = editSlot(session, slotId, value, opts); // deterministic, instant
      setSession(next);
      if (opts.confirmed) showToast("Kept — this will be stated as a requirement");
      if (study) {
        // The server's copy is authoritative for study sessions; persist the same edit there.
        callSession({ action: "edit", state: session, slotId, value, confirmed: opts.confirmed, studyId: study.id }).then(setSession).catch(() => showToast("Couldn't save that change. Try again."));
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't change that.");
    }
  };

  const rememberSlot = (slot: Slot, value: string) => {
    setMemory(remember({ slotId: slot.id, label: slot.label, value }));
    showToast("Saved in this browser — SubText will use it next time");
  };

  /** Study sessions: persist prompt edits and target switches to the server copy. */
  const syncPrompts = (next: ConversationState) => {
    if (study) void callSession({ action: "prompts", state: next, studyId: study.id }).catch(() => undefined);
  };

  const changeTarget = (t: TargetId) => {
    if (!session) return;
    const base = [...session.prompts].reverse().find((p) => p.ir);
    if (!base?.ir) return;
    const text = renderPrompt(base.ir, t, session.task.family);
    const v = { ...base, id: crypto.randomUUID(), createdAt: new Date().toISOString(), target: t, text, source: base.source === "edited" ? ("composed" as const) : base.source };
    const next = { ...session, target: t, prompts: [...session.prompts, v].slice(-20), updatedAt: new Date().toISOString() };
    setSession(next);
    syncPrompts(next);
    setSelectedVersion(v.id);
    showToast(`Restructured for ${TARGETS[t].label.toLowerCase()}`);
  };

  const saveText = (text: string) => {
    if (!session) return;
    const cur = session.prompts.find((p) => p.id === selectedVersion) ?? session.prompts.at(-1)!;
    if (cur.text === text) return;
    const v = { ...cur, id: crypto.randomUUID(), createdAt: new Date().toISOString(), text: text.slice(0, LIMITS.promptMaxChars), source: "edited" as const, warnings: [] };
    const next = { ...session, prompts: [...session.prompts, v].slice(-20), updatedAt: new Date().toISOString() };
    setSession(next);
    syncPrompts(next);
    setSelectedVersion(v.id);
  };

  const newSession = () => {
    setSession(null);
    setDrafts({});
    setError(null);
    setReviewing(false);
    setRecent(listSessions());
  };

  // ---- global shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!session || busy) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && session.phase === "questioning" && session.pending.length) {
        e.preventDefault();
        void submitRound();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- view ----
  if (study && (study.error || !study.consented)) {
    return (
      <div className="shell">
        <header className="topbar">
          <span className="wordmark">SubText</span>
        </header>
        <main>
          {study.error ? (
            <div className="home">
              <h1>This link isn’t available</h1>
              <p className="lede">{study.error}</p>
            </div>
          ) : (
            <Consent
              onAgree={async () => {
                await giveConsent(study.id);
                setStudy({ ...study, consented: true });
              }}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button className="wordmark" onClick={study ? undefined : newSession} aria-label={study ? "SubText" : "SubText — start over"}>
          SubText<span> · brief before you build</span>
        </button>
        <div className="topbar-actions">
          {session && !study && (
            <button className="btn btn-quiet btn-sm" onClick={newSession}>
              New
            </button>
          )}
        </div>
      </header>
      {(mock || session?.mock) && (
        <div className="mock-banner" role="note">
          <strong>Development mock</strong>
          <span>No API key is configured, so questions and specs come from keyword templates — not AI. Set ANTHROPIC_API_KEY to use the real engine.</span>
        </div>
      )}
      <main>
        {!session ? (
          <Home
            busy={busy}
            error={error}
            recent={study ? [] : recent}
            studyMode={!!study}
            memory={memory}
            onForget={(id) => setMemory(forget(id))}
            onDeleteAll={() => {
              deleteAllLocalData();
              setMemory([]);
              setRecent([]);
              showToast("Deleted everything SubText stored in this browser");
            }}
            onStart={start}
            onOpen={(id) => {
              const s = loadSession(id);
              if (s) {
                setSession(s);
                setSelectedVersion(s.prompts.at(-1)?.id ?? "");
              }
            }}
            onDelete={(id) => {
              deleteSession(id);
              setRecent(listSessions());
            }}
          />
        ) : (
          <div className="session">
            <div className="session-main">
              <RequestBlock state={session} disabled={!!busy} onRefine={refine} />
              {session.safety.injectionSuspected && (
                <div className="notice notice-info" role="note">
                  Part of your request reads like instructions to an AI. SubText treats it as text to pass along, not as commands.
                </div>
              )}
              {error && <ErrorNotice error={error} onDismiss={() => setError(null)} />}
              <SessionBody
                state={session}
                studyId={study?.id}
                onSurveyed={setSession}
                busy={busy}
                drafts={drafts}
                setDrafts={setDrafts}
                reviewing={reviewing}
                setReviewing={setReviewing}
                selectedVersion={selectedVersion}
                setSelectedVersion={setSelectedVersion}
                onSubmit={submitRound}
                onSkip={skipRound}
                onWriteNow={writeNow}
                onRevise={revise}
                onCompose={() => void composeNow(session)}
                onTarget={changeTarget}
                onSaveText={saveText}
                onNew={newSession}
                onToast={showToast}
              />
            </div>
            <Brief
              state={session}
              onEdit={editBrief}
              onRemember={study ? undefined : rememberSlot}
              remembered={new Set(memory.map((m) => m.slotId ?? ""))}
              disabled={!!busy || session.phase === "awaiting_operator"}
            />
          </div>
        )}
      </main>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

// =============================================================================================

function useCyclingStatus(steps: string[] | undefined) {
  const [i, setI] = useState(0);
  const [prevSteps, setPrevSteps] = useState(steps);
  if (prevSteps !== steps) {
    setPrevSteps(steps);
    setI(0);
  }
  useEffect(() => {
    if (!steps) return;
    const t = window.setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 1700);
    return () => window.clearInterval(t);
  }, [steps]);
  return steps?.[i];
}

function Status({ busy }: { busy: Busy }) {
  const text = useCyclingStatus(busy?.steps);
  if (!busy) return null;
  return (
    <div className="status" role="status" aria-live="polite">
      <span className="pulse" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function ErrorNotice({ error, onDismiss }: { error: NonNullable<ErrorState>; onDismiss: () => void }) {
  return (
    <div className="notice notice-error" role="alert">
      <span>{error.message}</span>
      <span className="row">
        {error.retry && (
          <button className="btn btn-sm" onClick={error.retry}>
            Try again
          </button>
        )}
        {error.alt && (
          <button className="btn btn-sm" onClick={error.alt.run}>
            {error.alt.label}
          </button>
        )}
        <button className="btn btn-quiet btn-sm" onClick={onDismiss} aria-label="Dismiss">
          Dismiss
        </button>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function Home(props: {
  busy: Busy;
  error: ErrorState;
  recent: SessionSummary[];
  studyMode: boolean;
  memory: MemoryItem[];
  onForget: (id: string) => void;
  onDeleteAll: () => void;
  onStart: (request: string, target: TargetId, justWrite: boolean) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<TargetId>("generic");
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const over = text.length > LIMITS.requestMaxChars;
  const submit = (justWrite: boolean) => {
    if (!trimmed || over || props.busy) return;
    props.onStart(trimmed, target, justWrite);
  };

  return (
    <div className="home">
      <h1>What are you about to build or ask an AI to do?</h1>
      <p className="lede">Describe it in your own words — rough is fine. Before you spend credits on an AI app builder or coding agent, SubText drafts a brief, asks only the few questions that would change the result, and compiles a spec you can paste into the tool.</p>

      {props.error && <ErrorNotice error={props.error} onDismiss={() => undefined} />}

      <div className="composer">
        <label htmlFor="request" className="sr-only">
          Describe what you want
        </label>
        <textarea
          id="request"
          ref={ref}
          autoFocus
          value={text}
          disabled={!!props.busy}
          placeholder="e.g. I want to build a simple site where clients can book a grooming slot for their dog…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
              e.preventDefault();
              submit(false);
            } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit(true);
            }
          }}
        />
        <div className="composer-bar">
          <div className="row">
            <span className="segmented-label" id="target-label">
              For
            </span>
            <div className="segmented" role="group" aria-labelledby="target-label">
              {(Object.keys(TARGETS) as TargetId[]).map((t) => (
                <button key={t} type="button" aria-pressed={target === t} onClick={() => setTarget(t)} title={TARGETS[t].description}>
                  {TARGETS[t].short}
                </button>
              ))}
            </div>
          </div>
          <div className="composer-actions">
            <button className="btn btn-quiet" onClick={() => submit(true)} disabled={!trimmed || over || !!props.busy} title="Skip questions and write the spec from what you've written">
              Just write it <span className="kbd">⌘↵</span>
            </button>
            <button className="btn btn-primary" onClick={() => submit(false)} disabled={!trimmed || over || !!props.busy}>
              Continue <span className="kbd">↵</span>
            </button>
          </div>
        </div>
      </div>
      {over ? (
        <p className="hint" style={{ color: "var(--danger)" }}>
          That’s {text.length.toLocaleString()} characters — keep it under {LIMITS.requestMaxChars.toLocaleString()}.
        </p>
      ) : props.busy ? (
        <Status busy={props.busy} />
      ) : (
        <p className="hint">Shift+Enter for a new line. SubText never runs your task — it only helps you describe it. Don’t include passwords, keys or personal data.</p>
      )}

      {!props.studyMode && (
      <div className="examples">
        <p className="section-label">Try one</p>
        <div className="example-list">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="example"
              onClick={() => {
                setText(ex);
                ref.current?.focus();
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
      )}

      {props.memory.length > 0 && (
        <div className="recent">
          <p className="section-label">Saved context · used as defaults in new sessions</p>
          <ul>
            {props.memory.map((m) => (
              <li key={m.id}>
                <span className="recent-open" style={{ cursor: "default" }}>
                  <span className="recent-title">{m.label}</span>
                  <span className="recent-meta">{m.value}</span>
                </span>
                <button className="btn btn-quiet btn-sm recent-delete" onClick={() => props.onForget(m.id)} aria-label={`Forget ${m.label}`}>
                  Forget
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {props.recent.length > 0 && (
        <div className="recent">
          <p className="section-label">Recent</p>
          <ul>
            {props.recent.slice(0, 8).map((r) => (
              <li key={r.id}>
                <button className="recent-open" onClick={() => props.onOpen(r.id)}>
                  <span className="recent-title">{r.title}</span>
                  <span className="recent-meta">
                    {r.phase === "composed" ? "Spec ready" : "In progress"} · {relativeTime(r.updatedAt)}
                  </span>
                </button>
                <button className="btn btn-quiet btn-sm recent-delete" onClick={() => props.onDelete(r.id)} aria-label={`Delete ${r.title}`}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="privacy">
        <p>
          <strong>For adults (18+).</strong> Your request and answers are sent to SubText’s server and to Anthropic’s API to analyse them and write the spec. Under Anthropic’s commercial terms, API data isn’t used to train models by default. SubText keeps no copy on its server{props.studyMode ? " except in research sessions, which the research team stores and deletes on request" : ""}; your sessions and saved context stay in this browser.
        </p>
        {!props.studyMode && (
          <button
            className="link"
            onClick={() => {
              if (window.confirm("Delete all sessions and saved context stored by SubText in this browser? This can't be undone.")) props.onDeleteAll();
            }}
          >
            Delete all my SubText data in this browser
          </button>
        )}
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function RequestBlock({ state, disabled, onRefine }: { state: ConversationState; disabled: boolean; onRefine: (r: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(state.request);
  return (
    <section className="request" aria-label="Your request">
      <div className="request-head">
        <span className="section-label" style={{ margin: 0 }}>
          Your request
        </span>
        {!editing && (
          <button
            className="link"
            onClick={() => {
              setText(state.request);
              setEditing(true);
            }}
            disabled={disabled}
            style={{ fontSize: 13 }}
          >
            Refine
          </button>
        )}
      </div>
      {editing ? (
        <>
          <label htmlFor="refine" className="sr-only">
            Refine your request
          </label>
          <textarea id="refine" autoFocus value={text} maxLength={LIMITS.requestMaxChars} onChange={(e) => setText(e.target.value)} />
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              disabled={!text.trim() || text.trim() === state.request}
              onClick={() => {
                setEditing(false);
                onRefine(text);
              }}
            >
              Update
            </button>
            <button className="btn btn-quiet btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <span className="hint" style={{ margin: 0 }}>
              Your answers are kept.
            </span>
          </div>
        </>
      ) : (
        <p className="request-text">{state.request}</p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------

interface BodyProps {
  state: ConversationState;
  studyId?: string;
  onSurveyed: (s: ConversationState) => void;
  busy: Busy;
  drafts: Record<string, Draft>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, Draft>>>;
  reviewing: boolean;
  setReviewing: (b: boolean) => void;
  selectedVersion: string;
  setSelectedVersion: (id: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onWriteNow: () => void;
  onRevise: (questionId: string, d: Draft, q: PlannedQuestion) => void;
  onCompose: () => void;
  onTarget: (t: TargetId) => void;
  onSaveText: (t: string) => void;
  onNew: () => void;
  onToast: (m: string) => void;
}

function SessionBody(p: BodyProps) {
  const { state, busy } = p;
  const hasPrompt = state.prompts.length > 0;

  if (state.phase === "awaiting_operator" && !busy) {
    // Wizard-of-Oz: identical to the automated experience from the participant's side.
    return (
      <>
        <AnsweredList state={state} busy={busy} onRevise={p.onRevise} />
        <Status busy={{ steps: OPERATOR_STEPS, kind: "analyse" }} />
        <div className="skeleton" aria-hidden="true" />
        <div className="actions-bar">
          <span className="spacer" />
          <button className="btn" onClick={p.onWriteNow}>
            Write it now
          </button>
        </div>
      </>
    );
  }

  if (busy?.kind === "compose") {
    return (
      <>
        <AnsweredList state={state} busy={busy} onRevise={p.onRevise} />
        <Status busy={busy} />
        <div className="skeleton" aria-hidden="true" style={{ height: 320 }} />
      </>
    );
  }

  if (state.phase === "questioning" && state.pending.length) {
    const firstRound = state.rounds.length === 1;
    // A detail the user already settled in the Brief doesn't need answering (the edit wins anyway).
    const setInBrief = new Set(state.edits.map((e) => e.slotId));
    const answeredHere = state.pending.filter((q) => isAnswered(p.drafts[q.id])).length;
    return (
      <>
        <AnsweredList state={state} busy={busy} onRevise={p.onRevise} />
        {busy ? (
          <>
            <Status busy={busy} />
            <div className="skeleton" aria-hidden="true" />
          </>
        ) : (
          <>
            <p className="intro">
              {firstRound
                ? `${state.pending.length === 1 ? "One detail" : "A few details"} will change the result. Answer what you can — skip anything.`
                : "Thanks — just a little more."}
            </p>
            <div className="round">
              {state.pending.map((q, i) =>
                setInBrief.has(q.slotId) ? (
                  <p key={q.id} className="settled">
                    <span className="a-label">{q.label}</span> — set in the brief, no need to answer
                  </p>
                ) : (
                <QuestionCard
                  key={q.id}
                  question={q}
                  draft={p.drafts[q.id] ?? emptyDraft()}
                  autoFocus={i === 0}
                  onChange={(d) => p.setDrafts((x) => ({ ...x, [q.id]: d }))}
                  onSubmit={p.onSubmit}
                />
                ),
              )}
            </div>
            <div className="actions-bar">
              <button className="btn btn-quiet" onClick={p.onSkip}>
                Skip these
              </button>
              <span className="spacer" />
              <button className="btn" onClick={p.onWriteNow}>
                Write it now
              </button>
              <button className="btn btn-primary" onClick={p.onSubmit}>
                {answeredHere === 0 ? "Continue" : "Continue"} <span className="kbd">⌘↵</span>
              </button>
            </div>
            <div className="shortcuts" aria-hidden="true">
              <span>1–4 choose</span>
              <span>D you decide</span>
              <span>N not sure</span>
              <span>O something else</span>
              <span>⌘↵ continue</span>
            </div>
          </>
        )}
      </>
    );
  }

  if (hasPrompt && !p.reviewing) {
    return (
      <>
        {busy && <Status busy={busy} />}
        <PromptView
          state={state}
          busy={!!busy}
          selectedId={p.selectedVersion || state.prompts.at(-1)!.id}
          onSelectVersion={p.setSelectedVersion}
          onRegenerate={p.onCompose}
          onTarget={p.onTarget}
          onSaveText={p.onSaveText}
          onBackToQuestions={() => p.setReviewing(true)}
          onNew={p.studyId ? undefined : p.onNew}
          onToast={p.onToast}
        />
        {p.studyId && !state.survey && <Survey studyId={p.studyId} state={state} onDone={p.onSurveyed} />}
        {p.studyId && state.survey && <p className="hint">Thanks — your feedback was recorded. You can still copy the spec above.</p>}
      </>
    );
  }

  // Ready to compose (e.g. after reviewing answers, or a failed compose) — or still analysing.
  return (
    <>
      <AnsweredList state={state} busy={busy} onRevise={p.onRevise} />
      {busy ? (
        <>
          <Status busy={busy} />
          <div className="skeleton" aria-hidden="true" />
        </>
      ) : (
        <>
          <p className="intro">
            {state.stop.reasons.includes("fast_path")
              ? "Your request was specific enough — no questions needed."
              : state.answers.length
                ? "Change any answer above, or edit the brief. Then write the spec."
                : "Edit the brief if anything looks off, then write the spec."}
          </p>
          <div className="actions-bar">
            {hasPrompt && (
              <button className="btn btn-quiet" onClick={() => p.setReviewing(false)}>
                Back to prompt
              </button>
            )}
            <span className="spacer" />
            <button className="btn btn-primary" onClick={p.onCompose}>
              {hasPrompt ? "Regenerate spec" : "Write the spec"}
            </button>
          </div>
        </>
      )}
    </>
  );
}

function AnsweredList({ state, busy, onRevise }: { state: ConversationState; busy: Busy; onRevise: BodyProps["onRevise"] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  if (!state.answers.length) return null;
  const questions = new Map(state.rounds.flatMap((r) => r.questions).map((q) => [q.id, q]));
  return (
    <>
      <p className="section-label">Your answers</p>
      <ul className="answered">
        {state.answers.map((a) => {
          const q = questions.get(a.questionId);
          if (editingId === a.questionId && q) {
            return (
              <li key={a.questionId} style={{ display: "block" }}>
                <QuestionCard question={q} draft={draft} onChange={setDraft} autoFocus onSubmit={() => undefined} />
                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!!busy}
                    onClick={() => {
                      setEditingId(null);
                      onRevise(a.questionId, draft, q);
                    }}
                  >
                    Save answer
                  </button>
                  <button className="btn btn-quiet btn-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </li>
            );
          }
          return (
            <li key={a.questionId}>
              <span className="a-label">{a.label}</span>
              <span className={`a-value${a.kind === "option" || a.kind === "text" ? "" : " soft"}`}>{answerText(a)}</span>
              {q && (
                <button
                  className="link"
                  style={{ fontSize: 13 }}
                  disabled={!!busy}
                  onClick={() => {
                    setDraft(draftFromAnswer(a, q));
                    setEditingId(a.questionId);
                  }}
                  aria-label={`Change answer to: ${a.question}`}
                >
                  Change
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function answerText(a: AnswerEvent) {
  switch (a.kind) {
    case "you_decide":
      return "You decide";
    case "not_sure":
      return "Not sure";
    case "skipped":
      return "Skipped";
    default:
      return a.value ?? "";
  }
}
