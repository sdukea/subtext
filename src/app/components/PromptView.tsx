"use client";

import { useEffect, useMemo, useState } from "react";
import type { ConversationState, PromptVersion, TargetId } from "@/engine/schema";
import { TARGETS } from "@/engine/render";

interface Props {
  state: ConversationState;
  busy: boolean;
  onRegenerate: () => void;
  onTarget: (t: TargetId) => void;
  onSaveText: (text: string) => void;
  onSelectVersion: (id: string) => void;
  selectedId: string;
  onBackToQuestions: () => void;
  /** Omitted in study sessions (one session per participant link). */
  onNew?: () => void;
  onToast: (msg: string) => void;
}

const SOURCE_LABEL: Record<PromptVersion["source"], string> = {
  composed: "Written by SubText",
  edited: "Your edit",
  fallback: "Assembled directly from your brief",
  mock: "Development mock — assembled from template, not AI",
};

export function PromptView({ state, busy, onRegenerate, onTarget, onSaveText, onSelectVersion, selectedId, onBackToQuestions, onNew, onToast }: Props) {
  const version = state.prompts.find((p) => p.id === selectedId) ?? state.prompts.at(-1)!;
  const [text, setText] = useState(version.text);
  const [copied, setCopied] = useState(false);
  const [syncedId, setSyncedId] = useState(version.id);

  // Reset the editor when a different version is shown.
  if (syncedId !== version.id) {
    setSyncedId(version.id);
    setText(version.text);
  }

  const dirty = text !== version.text;
  const words = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);

  const copy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      onToast("Spec copied — paste it into your AI tool");
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast("Couldn't access the clipboard. Select the text and copy it manually.");
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(state.intent.title || "prompt").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "prompt"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const answeredCount = state.answers.filter((a) => a.kind === "option" || a.kind === "text").length;

  return (
    <div>
      <div className="prompt-head">
        <div>
          <h2>Your spec is ready</h2>
          <p>
            {answeredCount > 0
              ? `Built from your request and ${answeredCount} answer${answeredCount > 1 ? "s" : ""}. `
              : "Built from your request. "}
            Review it, edit anything, then copy it into {TARGETS[state.target].description}.
          </p>
        </div>
      </div>

      {state.promptStale && (
        <div className="notice notice-info" role="status">
          <span>Your brief changed since this spec was written.</span>
          <button className="btn btn-sm btn-primary" onClick={onRegenerate} disabled={busy}>
            Regenerate
          </button>
        </div>
      )}
      {version.warnings.map((w) => (
        <div className="notice notice-warn" role="status" key={w}>
          <span>{w}</span>
        </div>
      ))}

      <div className="artifact">
        <div className="artifact-bar">
          <div className="artifact-title">
            <label className="sr-only" htmlFor="target-select">
              Spec for
            </label>
            <select id="target-select" className="select" value={state.target} onChange={(e) => onTarget(e.target.value as TargetId)} disabled={busy}>
              {(Object.keys(TARGETS) as TargetId[]).map((t) => (
                <option key={t} value={t}>
                  For: {TARGETS[t].label}
                </option>
              ))}
            </select>
            {state.prompts.length > 1 && (
              <>
                <label className="sr-only" htmlFor="version-select">
                  Version
                </label>
                <select id="version-select" className="select" value={version.id} onChange={(e) => onSelectVersion(e.target.value)}>
                  {state.prompts.map((p, i) => (
                    <option key={p.id} value={p.id}>
                      v{i + 1} · {p.source === "edited" ? "edited" : TARGETS[p.target].short}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="row">
            <button className="btn btn-quiet btn-sm" onClick={onRegenerate} disabled={busy} title="Write a fresh version from the brief">
              Regenerate
            </button>
            <button className="btn btn-quiet btn-sm" onClick={download}>
              Download .md
            </button>
            <button className="btn btn-primary btn-sm" onClick={copy} aria-live="polite">
              {copied ? "Copied" : "Copy spec"} <span className="kbd">⌘⇧C</span>
            </button>
          </div>
        </div>
        <label className="sr-only" htmlFor="prompt-text">
          Generated spec (editable)
        </label>
        <textarea
          id="prompt-text"
          value={text}
          spellCheck={false}
          maxLength={40000}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => dirty && onSaveText(text)}
        />
        <div className="artifact-foot">
          <span>
            {SOURCE_LABEL[version.source]} · {words} words{dirty ? " · unsaved edits" : ""}
          </span>
          {dirty && (
            <span className="row">
              <button className="link" onClick={() => setText(version.text)}>
                Revert
              </button>
              <button className="link" onClick={() => onSaveText(text)}>
                Save as new version
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="actions-bar static">
        <button className="btn btn-quiet" onClick={onBackToQuestions} disabled={busy}>
          Review answers
        </button>
        <span className="spacer" />
        {onNew && (
          <button className="btn" onClick={onNew}>
            New brief
          </button>
        )}
        <button className="btn btn-primary" onClick={copy}>
          {copied ? "Copied" : "Copy spec"}
        </button>
      </div>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
