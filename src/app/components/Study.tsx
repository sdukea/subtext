"use client";

import { useState } from "react";
import type { ConversationState } from "@/engine/schema";
import { ApiError, submitSurvey } from "@/client/api";

/**
 * Participant-facing pieces of a study session (Phase 0 experiments). The disclosure is honest
 * about researcher assistance without saying which condition this session is in.
 */
export function Consent({ onAgree }: { onAgree: () => Promise<void> }) {
  const [adult, setAdult] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="home consent">
      <h1>Before you start</h1>
      <p className="lede">You’re trying a research prototype of SubText, a tool that helps you turn a rough idea into a clear brief before you hand it to an AI app builder, coding agent or assistant.</p>
      <ul className="consent-list">
        <li>Bring a real task you’re about to give an AI. Describe it, answer any questions you like, then copy the spec it writes.</li>
        <li>
          <strong>In some sessions, a member of the research team helps choose the questions you’re asked.</strong> The questions may come from SubText, from a researcher, or both.
        </li>
        <li>We record your request, your answers, the questions, how long each step took, the final spec and your ratings. We don’t record your name.</li>
        <li>Your text is processed by Anthropic’s API. Don’t include passwords, keys, personal data or confidential information.</li>
        <li>You can stop at any time, and you can ask the researcher to delete your session.</li>
      </ul>
      <label className="check">
        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /> I’m 18 or older.
      </label>
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I understand the above and agree to take part.
      </label>
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        <button
          className="btn btn-primary"
          disabled={!adult || !agree || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onAgree();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Couldn't continue. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}

const FIT = ["Not at all", "Slightly", "Partly", "Mostly", "Exactly"];

export function Survey({ studyId, state, onDone }: { studyId: string; state: ConversationState; onDone: (s: ConversationState) => void }) {
  const questions = state.rounds.flatMap((r) => r.questions);
  const [ratings, setRatings] = useState<Record<string, "useful" | "not_useful">>({});
  const [fit, setFit] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="survey" aria-labelledby="survey-title">
      <h2 id="survey-title">Two quick questions for the research team</h2>
      <fieldset className="survey-fit">
        <legend>How well does this spec capture what you meant?</legend>
        <div className="segmented" role="radiogroup">
          {FIT.map((label, i) => (
            <button key={label} type="button" role="radio" aria-checked={fit === i + 1} onClick={() => setFit(i + 1)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {questions.length > 0 && (
        <fieldset>
          <legend>Which questions helped?</legend>
          <ul className="survey-questions">
            {questions.map((q) => (
              <li key={q.id}>
                <span>{q.text}</span>
                <span className="row">
                  {(["useful", "not_useful"] as const).map((v) => (
                    <button key={v} type="button" className={`chip-toggle`} aria-pressed={ratings[q.id] === v} onClick={() => setRatings((r) => ({ ...r, [q.id]: v }))}>
                      {v === "useful" ? "Helped" : "Didn’t help"}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <label className="sr-only" htmlFor="survey-comment">
        Anything else?
      </label>
      <textarea id="survey-comment" placeholder="Anything else? (optional)" value={comment} maxLength={2000} onChange={(e) => setComment(e.target.value)} />
      {error && (
        <div className="notice notice-error" role="alert">
          {error}
        </div>
      )}
      <div className="row">
        <button
          className="btn btn-primary btn-sm"
          disabled={fit === null || busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              onDone(await submitSurvey(studyId, { questionRatings: ratings, fit: fit!, comment: comment.trim() || undefined }));
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Couldn't send your answers. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Send
        </button>
      </div>
    </section>
  );
}
