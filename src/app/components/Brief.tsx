"use client";

import { useEffect, useRef, useState } from "react";
import type { ConversationState, Slot, SlotGroup } from "@/engine/schema";
import { resolvedDecisions } from "@/engine/derive";

const GROUPS: { id: SlotGroup; label: string }[] = [
  { id: "goal", label: "Goal" },
  { id: "audience", label: "Audience" },
  { id: "scope", label: "Features & scope" },
  { id: "constraints", label: "Constraints" },
  { id: "format", label: "Success & output" },
  { id: "context", label: "Context" },
  { id: "style", label: "Look & tone" },
];

const TAG: Record<Slot["status"], { text: string; cls: string }> = {
  stated: { text: "you said", cls: "tag-said" },
  answered: { text: "you said", cls: "tag-said" },
  edited: { text: "edited", cls: "tag-said" },
  assumed: { text: "assumed", cls: "tag-assumed" },
  delegated: { text: "AI decides", cls: "tag-ai" },
  inferred: { text: "default", cls: "tag-assumed" },
  removed: { text: "removed", cls: "" },
  remembered: { text: "remembered", cls: "tag-mem" },
};

const KNOWN = new Set(["stated", "answered", "edited", "remembered"]);
const SOFT = new Set(["assumed", "inferred", "delegated"]);

interface Props {
  state: ConversationState;
  onEdit: (slotId: string, value: string | null, opts?: { confirmed?: boolean }) => void;
  /** Save a detail for future sessions. Omitted in study sessions. */
  onRemember?: (slot: Slot, value: string) => void;
  /** Slot ids already saved in this browser's memory. */
  remembered?: Set<string>;
  disabled?: boolean;
}

export function Brief({ state, onEdit, onRemember, remembered, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const updated = useUpdatedPulse(state.slots);

  const visible = state.slots.filter((s) => s.status !== "inferred");
  const quiet = state.slots.filter((s) => s.status === "inferred");
  const assumedCount = state.slots.filter((s) => s.status === "assumed" || s.status === "delegated").length;
  const confirmed = new Set(state.edits.filter((e) => e.confirmed).map((e) => e.slotId));
  const known = state.slots.filter((s) => KNOWN.has(s.status)).length;

  const item = (s: Slot) => (
    <BriefItem
      key={s.id}
      slot={s}
      pulsing={updated.has(s.id)}
      editing={editing === s.id}
      disabled={disabled}
      confirmed={confirmed.has(s.id)}
      saved={!!remembered?.has(s.id)}
      onStartEdit={() => setEditing(s.id)}
      onDone={() => setEditing(null)}
      onEdit={onEdit}
      onRemember={onRemember}
    />
  );

  return (
    <aside className="session-aside" aria-label="Brief">
      <div className="session-aside-inner">
        <button type="button" className="brief-toggle" aria-expanded={open} aria-controls="brief-body" onClick={() => setOpen((o) => !o)}>
          <span>
            <strong>Brief</strong>
            <span style={{ color: "var(--muted)" }}>
              {" "}
              · {known} from you · {assumedCount} assumed
            </span>
          </span>
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>
            {open ? "Hide" : "Show"}
          </span>
        </button>
        <div className="brief-body" id="brief-body" data-open={open}>
          {!state.slots.length ? (
            <p className="brief-empty">Your brief will appear here as SubText understands your request.</p>
          ) : (
            <>
              <h2 className="brief-title">{state.intent.title || "Brief"}</h2>
              {state.intent.goal && <p className="brief-goal">{state.intent.goal}</p>}
              <p className="brief-meta">
                {known} from you · {assumedCount} assumed · select a detail to change it
              </p>
              {resolvedDecisions(state).length > 0 && (
                <div className="brief-group">
                  <p className="brief-group-label">Decided</p>
                  <ul className="brief-items">
                    {resolvedDecisions(state).map((d) => (
                      <li className="brief-item" key={d.questionId}>
                        <div className="brief-item-head">
                          <span className="brief-item-label">{d.question}</span>
                          <span className="tag tag-said">you said</span>
                        </div>
                        <p className="brief-decided">{d.decision}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {state.intent.successCriteria.length > 0 && (
                <div className="brief-group">
                  <p className="brief-group-label">Success looks like</p>
                  <ul className="brief-criteria">
                    {state.intent.successCriteria.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {GROUPS.map((g) => {
                const items = visible.filter((s) => s.group === g.id);
                if (!items.length) return null;
                return (
                  <div className="brief-group" key={g.id}>
                    <p className="brief-group-label">{g.label}</p>
                    <ul className="brief-items">{items.map(item)}</ul>
                  </div>
                );
              })}
              {quiet.length > 0 && (
                <details className="brief-group">
                  <summary className="brief-group-label" style={{ cursor: "pointer" }}>
                    {quiet.length} minor default{quiet.length > 1 ? "s" : ""} (left out of the prompt)
                  </summary>
                  <ul className="brief-items">{quiet.map(item)}</ul>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function useUpdatedPulse(slots: Slot[]): Set<string> {
  const [updated, setUpdated] = useState<Set<string>>(new Set());
  const prev = useRef<Map<string, string | undefined> | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = new Map(slots.map((s) => [s.id, `${s.status}:${s.value}`]));
    if (!before) return;
    const changed = new Set(slots.filter((s) => before.has(s.id) && before.get(s.id) !== `${s.status}:${s.value}`).map((s) => s.id));
    if (!changed.size) return;
    setUpdated(changed);
    const t = setTimeout(() => setUpdated(new Set()), 1600);
    return () => clearTimeout(t);
  }, [slots]);
  return updated;
}

interface ItemProps {
  slot: Slot;
  pulsing: boolean;
  editing: boolean;
  disabled?: boolean;
  confirmed: boolean;
  saved: boolean;
  onStartEdit: () => void;
  onDone: () => void;
  onEdit: Props["onEdit"];
  onRemember?: Props["onRemember"];
}

function BriefItem({ slot, pulsing, editing, disabled, confirmed, saved, onStartEdit, onDone, onEdit, onRemember }: ItemProps) {
  const tag = slot.status === "edited" && confirmed ? { text: "you confirmed", cls: "tag-said" } : TAG[slot.status];
  const canKeep = (slot.status === "assumed" || slot.status === "inferred") && !!slot.value;
  const display =
    slot.status === "delegated"
      ? `AI decides${slot.value ? ` (likely: ${slot.value})` : ""}`
      : slot.status === "removed"
        ? "Not applicable"
        : slot.value || "—";
  const soft = SOFT.has(slot.status);
  return (
    <li className={`brief-item${pulsing ? " updated" : ""}`}>
      <div className="brief-item-head">
        <span className="brief-item-label">{slot.label}</span>
        <span className="brief-item-tags">
          {saved && slot.status !== "remembered" && <span className="tag tag-mem">saved</span>}
          <span className={`tag ${tag.cls}`}>{tag.text}</span>
        </span>
      </div>
      {editing ? (
        <BriefEditor slot={slot} onDone={onDone} onEdit={onEdit} onRemember={onRemember} saved={saved} />
      ) : (
        <>
        <button
          type="button"
          className={`brief-value${soft ? " is-assumed" : ""}${slot.status === "removed" ? " is-removed" : ""}`}
          onClick={onStartEdit}
          disabled={disabled}
          aria-label={`${slot.label}: ${display}. Change`}
        >
          {display}
        </button>
        {canKeep && !disabled && (
          <button type="button" className="keep" onClick={() => onEdit(slot.id, slot.value!, { confirmed: true })} aria-label={`Keep the assumption for ${slot.label}: ${slot.value}`}>
            Keep
          </button>
        )}
        </>
      )}
    </li>
  );
}

function BriefEditor({ slot, onDone, onEdit, onRemember, saved }: { slot: Slot; onDone: () => void; onEdit: Props["onEdit"]; onRemember?: Props["onRemember"]; saved: boolean }) {
  const [value, setValue] = useState(slot.status === "removed" || slot.status === "delegated" ? "" : (slot.value ?? ""));
  const [remember, setRemember] = useState(false);
  const save = () => {
    const v = value.trim();
    if (v && v !== slot.value) onEdit(slot.id, v);
    if (v && remember) onRemember?.(slot, v);
    onDone();
  };
  return (
    <div className="brief-edit">
      <label className="sr-only" htmlFor={`edit-${slot.id}`}>
        {slot.label}
      </label>
      <textarea
        id={`edit-${slot.id}`}
        autoFocus
        value={value}
        maxLength={1000}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDone();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
        }}
      />
      {slot.candidates.length > 0 && (
        <div className="suggestions">
          {slot.candidates.map((c) => (
            <button key={c.id} type="button" className="example" onClick={() => setValue(c.label)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      {onRemember && (
        <label className="remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {saved ? "Update what SubText remembers" : "Remember for future sessions"}
          <span className="hint" style={{ margin: 0 }}>
            Saved only in this browser
          </span>
        </label>
      )}
      <div className="row">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!value.trim()}>
          Save
        </button>
        {slot.status !== "removed" && (
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              onEdit(slot.id, null);
              onDone();
            }}
          >
            Not applicable
          </button>
        )}
        <button type="button" className="btn btn-quiet btn-sm" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
