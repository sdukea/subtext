"use client";

import { useEffect, useId, useRef } from "react";
import type { PlannedQuestion } from "@/engine/schema";
import type { AnswerInput } from "@/engine/orchestrator";

export interface Draft {
  optionIds: string[];
  text: string;
  special: "you_decide" | "not_sure" | null;
}

export const emptyDraft = (): Draft => ({ optionIds: [], text: "", special: null });

export function isAnswered(d: Draft | undefined): boolean {
  return !!d && (d.special !== null || d.optionIds.length > 0 || d.text.trim().length > 0);
}

export function toInput(q: PlannedQuestion, d: Draft | undefined): AnswerInput {
  if (!d) return { questionId: q.id, kind: "skipped" };
  if (d.special) return { questionId: q.id, kind: d.special };
  if (d.optionIds.length) return { questionId: q.id, kind: "option", optionIds: d.optionIds, text: d.text.trim() || undefined };
  if (d.text.trim()) return { questionId: q.id, kind: "text", text: d.text.trim() };
  return { questionId: q.id, kind: "skipped" };
}

/** Rebuild a draft from a recorded answer (for revising). */
export function draftFromAnswer(a: { kind: string; optionIds?: string[]; value?: string }, q: PlannedQuestion): Draft {
  if (a.kind === "you_decide" || a.kind === "not_sure") return { ...emptyDraft(), special: a.kind };
  if (a.kind === "option") {
    const labels = new Set((a.optionIds ?? []).map((id) => q.options.find((o) => o.id === id)?.label));
    const extra = (a.value ?? "")
      .split("; ")
      .filter((x) => !labels.has(x))
      .join("; ");
    return { optionIds: a.optionIds ?? [], text: extra, special: null };
  }
  if (a.kind === "text") return { ...emptyDraft(), text: a.value ?? "" };
  return emptyDraft();
}

interface Props {
  question: PlannedQuestion;
  draft: Draft;
  onChange: (d: Draft) => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export function QuestionCard({ question: q, draft, onChange, autoFocus, onSubmit }: Props) {
  const id = useId();
  const freeRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  // Focus the card (not an option) so number keys work without implying a selection.
  useEffect(() => {
    if (autoFocus) cardRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  const multi = q.format === "multi_choice";
  const hasOptions = q.options.length > 0;

  const toggle = (optId: string) => {
    if (multi) {
      const has = draft.optionIds.includes(optId);
      onChange({ ...draft, special: null, optionIds: has ? draft.optionIds.filter((x) => x !== optId) : [...draft.optionIds, optId] });
    } else {
      const selected = draft.optionIds[0] === optId;
      onChange({ ...draft, special: null, text: selected ? draft.text : "", optionIds: selected ? [] : [optId] });
    }
  };

  const setSpecial = (s: Draft["special"]) => onChange({ optionIds: [], text: "", special: draft.special === s ? null : s });

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement;
    const typing = el.tagName === "TEXTAREA" || el.tagName === "INPUT";
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") return; // handled globally
    if (typing) {
      if (e.key === "Enter" && !e.shiftKey && el.tagName === "INPUT") {
        e.preventDefault();
        onSubmit?.();
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const n = Number.parseInt(e.key, 10);
    if (n >= 1 && n <= q.options.length) {
      e.preventDefault();
      toggle(q.options[n - 1]!.id);
    } else if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      setSpecial("you_decide");
    } else if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      setSpecial("not_sure");
    } else if (e.key === "o" || e.key === "O") {
      e.preventDefault();
      freeRef.current?.focus();
    }
  };

  return (
    <section ref={cardRef} className="qcard" aria-labelledby={`${id}-q`} onKeyDown={onKeyDown} tabIndex={-1} data-autofocus={autoFocus ? "true" : undefined}>
      <p className="q-label">{q.kind === "contradiction" ? "Which matters more" : q.label}</p>
      <h3 className="q-text" id={`${id}-q`}>
        {q.text}
      </h3>
      {q.why && <p className="q-why">{q.why}</p>}

      {hasOptions && (
        <div className="options" role="group" aria-labelledby={`${id}-q`}>
          {q.options.map((o, i) => {
            const selected = draft.optionIds.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className="option"
                aria-pressed={selected}
                onClick={() => toggle(o.id)}
              >
                <span className="option-key" aria-hidden="true">
                  {selected && multi ? "✓" : i + 1}
                </span>
                <span>
                  <span className="option-label">{o.label}</span>
                  {o.description && <span className="option-desc">{o.description}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="free">
        <label className="sr-only" htmlFor={`${id}-free`}>
          {hasOptions ? "Something else" : "Your answer"}
        </label>
        <textarea
          id={`${id}-free`}
          ref={freeRef}
          rows={hasOptions ? 1 : 3}
          value={draft.text}
          maxLength={2000}
          placeholder={hasOptions ? (multi ? "Add anything else…" : "Something else…") : "Type your answer…"}
          onChange={(e) =>
            onChange({ special: null, text: e.target.value, optionIds: multi ? draft.optionIds : e.target.value ? [] : draft.optionIds })
          }
        />
      </div>

      <div className="q-foot">
        <button type="button" className="chip-toggle" aria-pressed={draft.special === "you_decide"} onClick={() => setSpecial("you_decide")}>
          You decide{q.defaultLabel ? <span className="chip-detail"> · {truncate(q.defaultLabel, 42)}</span> : null}
        </button>
        <button type="button" className="chip-toggle" aria-pressed={draft.special === "not_sure"} onClick={() => setSpecial("not_sure")}>
          Not sure
        </button>
      </div>
    </section>
  );
}

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
