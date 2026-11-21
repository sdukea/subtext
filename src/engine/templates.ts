/**
 * Task-family slot templates — curated priors (research/06 §C, research/04 §8).
 *
 * v1 families follow research/13 R-QE2 (web/app build, coding-agent task, research brief,
 * long-form writing) plus a "general" fallback. Impact values are hypotheses to be calibrated
 * from outcome data (research/06 §D.4); they are the knobs the evaluation harness tunes.
 */
import type { FamilyId, QuestionFormat, SlotGroup } from "./schema";

export interface SlotTemplate {
  id: string;
  label: string;
  group: SlotGroup;
  /** 0–1: how much output quality hinges on this slot. */
  impact: number;
  /** Must be answered, shown as an assumption or delegated before stopping. */
  critical: boolean;
  /** Technical choice a novice usually can't judge — delegate rather than ask (research/06 §H.9). */
  technical: boolean;
  /** Forking question: its answer changes which other details matter (research/06 §E.1). */
  root: boolean;
  /** Describes the slot to the analysis model. */
  hint: string;
  format: QuestionFormat;
  /** Default assumption when the slot is never answered. */
  fallback: string;
  /** Development-mock only: keywords that suggest the slot is already stated. */
  mockKeywords: string[];
  /** Development-mock only: canned options. */
  mockOptions: string[];
}

export interface FamilyTemplate {
  id: FamilyId;
  label: string;
  description: string;
  slots: SlotTemplate[];
}

const s = (t: Omit<SlotTemplate, "technical" | "root" | "mockKeywords" | "mockOptions"> & Partial<SlotTemplate>): SlotTemplate => ({
  technical: false,
  root: false,
  mockKeywords: [],
  mockOptions: [],
  ...t,
});

export const FAMILIES: Record<FamilyId, FamilyTemplate> = {
  app_build: {
    id: "app_build",
    label: "App or website build",
    description: "Building an app, website, tool or prototype — often with an AI app builder (Lovable, Bolt, v0, Replit) or coding agent.",
    slots: [
      s({ id: "app_purpose", label: "What it's for", group: "goal", impact: 0.95, critical: true, root: true, format: "single_choice",
        hint: "The core job the app does for its users (e.g. take bookings, sell products, track habits).",
        fallback: "A simple tool focused on one core job", mockKeywords: ["booking", "shop", "store", "tracker", "portfolio", "dashboard"],
        mockOptions: ["Show information about something", "Let people book or sign up", "Sell products", "Track or manage data"] }),
      s({ id: "core_features", label: "Core features", group: "scope", impact: 0.9, critical: true, format: "free_text",
        hint: "The 2–5 things a user must be able to do in the first version.",
        fallback: "The builder proposes a minimal feature set and lists it before building", mockKeywords: ["feature", "should let", "users can"] }),
      s({ id: "audience", label: "Who uses it", group: "audience", impact: 0.7, critical: false, format: "single_choice",
        hint: "Who the end users are and in what context they use it.",
        fallback: "Members of the public on their phones", mockKeywords: ["customers", "users", "clients", "team", "students"],
        mockOptions: ["Customers of a small business", "Just me", "My team at work", "The general public"] }),
      s({ id: "accounts_data", label: "Accounts & data", group: "constraints", impact: 0.75, critical: true, format: "single_choice",
        hint: "Whether it needs logins, stored data, payments or integrations — consequences the user can judge, not technology names.",
        fallback: "No accounts or payments in the first version", mockKeywords: ["login", "account", "payment", "stripe", "database", "sign in"],
        mockOptions: ["No accounts, nothing stored", "Users sign in and save things", "Takes payments", "Admin manages content"] }),
      s({ id: "scope_level", label: "Ambition", group: "scope", impact: 0.7, critical: true, format: "single_choice",
        hint: "Quick prototype to test an idea vs. something real people will use soon.",
        fallback: "A working first version (MVP), with deferred features listed", mockKeywords: ["prototype", "mvp", "production", "launch"],
        mockOptions: ["Quick prototype to try the idea", "First version real people will use", "Polished and launch-ready"] }),
      s({ id: "starting_point", label: "Starting point", group: "context", impact: 0.6, critical: false, format: "single_choice",
        hint: "New project from scratch vs. changing an existing project (and what must not change).",
        fallback: "A new project from scratch", mockKeywords: ["existing", "already have", "current app", "add to"],
        mockOptions: ["Brand new project", "Changing an existing project"] }),
      s({ id: "design_direction", label: "Look & feel", group: "style", impact: 0.5, critical: false, format: "single_choice",
        hint: "Visual direction in plain words (2–3 adjectives or a reference).",
        fallback: "Clean, simple and mobile-friendly", mockKeywords: ["minimal", "playful", "style", "design", "look"],
        mockOptions: ["Clean and minimal", "Warm and friendly", "Bold and modern", "Match an existing brand"] }),
      s({ id: "platform", label: "Platform", group: "constraints", impact: 0.5, critical: false, format: "single_choice",
        hint: "Web, mobile app, desktop — where people will use it.",
        fallback: "Responsive web app", mockKeywords: ["ios", "android", "mobile app", "web", "desktop"],
        mockOptions: ["Website / web app", "Phone app", "Both"] }),
      s({ id: "tech_stack", label: "Tech stack", group: "constraints", impact: 0.4, critical: false, technical: true, format: "single_choice",
        hint: "Frameworks, languages, hosting. Usually delegate to the builder for non-technical users.",
        fallback: "Builder picks a mainstream, low-maintenance stack and states its choice", mockKeywords: ["react", "next", "supabase", "python", "vue"] }),
      s({ id: "done_when", label: "Done when", group: "format", impact: 0.45, critical: false, format: "free_text",
        hint: "How the user will know the first version works.",
        fallback: "Each core feature works end to end on mobile and desktop", mockKeywords: ["done when", "success"] }),
    ],
  },
  coding_task: {
    id: "coding_task",
    label: "Coding task",
    description: "A change to existing code for a coding agent (Cursor, Claude Code, Codex): a feature, a bug fix, a refactor.",
    slots: [
      s({ id: "task_kind", label: "Kind of change", group: "goal", impact: 0.85, critical: true, root: true, format: "single_choice",
        hint: "New feature, bug fix, refactor, or review.", fallback: "A focused change",
        mockKeywords: ["bug", "fix", "crash", "error", "refactor", "add", "feature"], mockOptions: ["New feature", "Fix a bug", "Refactor / clean up", "Review code"] }),
      s({ id: "change", label: "The change", group: "scope", impact: 0.95, critical: true, format: "free_text",
        hint: "Exactly what should be different afterwards (for bugs: actual vs. expected behaviour).",
        fallback: "Ask the agent to restate the change before editing", mockKeywords: ["should", "instead", "expected"] }),
      s({ id: "codebase", label: "Codebase & stack", group: "context", impact: 0.75, critical: true, format: "free_text",
        hint: "Language, framework, relevant files or modules the agent should look at.",
        fallback: "Agent explores the repository first and follows existing patterns", mockKeywords: ["react", "python", "typescript", "file", "repo", ".py", ".ts"] }),
      s({ id: "evidence", label: "Errors & evidence", group: "context", impact: 0.65, critical: false, format: "free_text",
        hint: "Error messages, logs, stack traces or reproduction steps (verbatim). Mainly for bugs.",
        fallback: "Agent reproduces the problem before fixing it", mockKeywords: ["traceback", "error:", "stack", "exception"] }),
      s({ id: "preserve", label: "Must not change", group: "constraints", impact: 0.6, critical: false, format: "free_text",
        hint: "Behaviour, APIs, styling or files that must stay untouched.",
        fallback: "Keep existing behaviour and public interfaces unchanged", mockKeywords: ["don't change", "keep", "without breaking"] }),
      s({ id: "latitude", label: "Latitude", group: "constraints", impact: 0.5, critical: false, format: "single_choice",
        hint: "Minimal, surgical change vs. freedom to restructure nearby code.",
        fallback: "Minimal, scoped change", mockKeywords: ["minimal", "rewrite", "clean up"],
        mockOptions: ["Smallest possible change", "Tidy nearby code if it helps", "Free to restructure"] }),
      s({ id: "verification", label: "How to verify", group: "format", impact: 0.6, critical: false, format: "single_choice",
        hint: "Tests to run or add, manual checks, definition of done.",
        fallback: "Add or update tests that cover the change and run the existing suite", mockKeywords: ["test", "verify", "ci"],
        mockOptions: ["Add tests and run the suite", "Run existing tests only", "Describe a manual check"] }),
    ],
  },
  research: {
    id: "research",
    label: "Research brief",
    description: "Market research, literature review, comparisons, deep-research runs.",
    slots: [
      s({ id: "research_question", label: "Research question", group: "goal", impact: 0.9, critical: true, root: true, format: "free_text",
        hint: "The specific question the research must answer.", fallback: "Answer the request as stated, noting interpretation",
        mockKeywords: ["whether", "how many", "which", "compare"] }),
      s({ id: "decision", label: "Decision it informs", group: "goal", impact: 0.8, critical: true, format: "single_choice",
        hint: "What the user will decide or do with the result.", fallback: "General understanding, no specific decision",
        mockKeywords: ["decide", "decision", "invest", "launch", "choose"], mockOptions: ["Whether to pursue an idea", "Choosing between options", "Pitching / fundraising", "General understanding"] }),
      s({ id: "scope", label: "Scope", group: "scope", impact: 0.75, critical: true, format: "free_text",
        hint: "Market, segment, geography, time period.", fallback: "Global, most recent available data",
        mockKeywords: ["uk", "us", "europe", "india", "market", "2025", "2026"] }),
      s({ id: "evidence_standard", label: "Evidence standard", group: "constraints", impact: 0.6, critical: false, format: "single_choice",
        hint: "Citations, data recency, how to treat estimates.", fallback: "Cite sources with links; label estimates; note data dates",
        mockKeywords: ["cite", "sources", "peer-reviewed"], mockOptions: ["Cited sources with links", "Peer-reviewed only", "Rough estimates are fine"] }),
      s({ id: "deliverable", label: "Deliverable", group: "format", impact: 0.6, critical: false, format: "single_choice",
        hint: "Memo, table, slide outline, report; length.", fallback: "A short decision memo with key findings and risks",
        mockKeywords: ["memo", "report", "table", "slides"], mockOptions: ["Short decision memo", "Detailed report", "Comparison table", "Bullet summary"] }),
      s({ id: "known_context", label: "What you know already", group: "context", impact: 0.45, critical: false, format: "free_text",
        hint: "Existing knowledge, competitors already known, sources to include or avoid.", fallback: "Starting from scratch",
        mockKeywords: ["already know", "competitors like"] }),
    ],
  },
  writing: {
    id: "writing",
    label: "Writing",
    description: "Emails, documents, articles, marketing copy, essays.",
    slots: [
      s({ id: "piece", label: "Kind of piece", group: "goal", impact: 0.8, critical: true, root: true, format: "single_choice",
        hint: "Email, article, landing page, report, essay…", fallback: "As described in the request",
        mockKeywords: ["email", "article", "post", "essay", "copy", "letter", "report"], mockOptions: ["Email or message", "Article or blog post", "Marketing copy", "Report or document"] }),
      s({ id: "purpose", label: "Purpose", group: "goal", impact: 0.9, critical: true, format: "single_choice",
        hint: "What the reader should think, feel or do afterwards.", fallback: "Inform the reader clearly",
        mockKeywords: ["convince", "ask", "request", "announce", "explain"], mockOptions: ["Get them to take an action", "Inform or explain", "Persuade", "Apologise or repair"] }),
      s({ id: "reader", label: "Reader", group: "audience", impact: 0.85, critical: true, format: "single_choice",
        hint: "Who reads it and their relationship to the writer.", fallback: "An informed general reader",
        mockKeywords: ["manager", "client", "investor", "customer", "team", "landlord"], mockOptions: ["Someone I work with", "A client or customer", "Someone I haven't met", "The general public"] }),
      s({ id: "key_points", label: "Key facts", group: "context", impact: 0.85, critical: true, format: "free_text",
        hint: "Facts, details or points that must be included — cannot be inferred.", fallback: "Use clearly marked [placeholders] for specific facts",
        mockKeywords: [] }),
      s({ id: "tone", label: "Tone", group: "style", impact: 0.5, critical: false, format: "single_choice",
        hint: "Formal, warm, firm, playful…", fallback: "Professional, warm and concise",
        mockKeywords: ["formal", "casual", "friendly", "firm", "professional"], mockOptions: ["Warm and professional", "Formal", "Firm but polite", "Casual"] }),
      s({ id: "length", label: "Length", group: "format", impact: 0.45, critical: false, format: "single_choice",
        hint: "Word count or length band.", fallback: "As short as it can be while complete",
        mockKeywords: ["words", "short", "page", "long"], mockOptions: ["Short (under 150 words)", "Medium (300–600 words)", "Long-form (1,000+ words)"] }),
    ],
  },
  general: {
    id: "general",
    label: "General task",
    description: "Anything else: learning, planning, analysis, advice, ideation.",
    slots: [
      s({ id: "objective", label: "Objective", group: "goal", impact: 0.9, critical: true, root: true, format: "free_text",
        hint: "What the user is ultimately trying to achieve.", fallback: "As stated in the request", mockKeywords: [] }),
      s({ id: "situation", label: "Situation", group: "context", impact: 0.7, critical: false, format: "free_text",
        hint: "Relevant background the AI cannot see.", fallback: "No special background", mockKeywords: ["i am", "i'm", "my"] }),
      s({ id: "audience", label: "Who it's for", group: "audience", impact: 0.5, critical: false, format: "single_choice",
        hint: "Who will use the result and their level.", fallback: "The user themselves, intermediate level",
        mockKeywords: ["for my", "beginner", "expert"], mockOptions: ["Just me", "A beginner", "An expert audience", "My team"] }),
      s({ id: "output_format", label: "Output", group: "format", impact: 0.55, critical: false, format: "single_choice",
        hint: "Shape of the answer: plan, list, table, explanation, code.", fallback: "A clear, structured answer",
        mockKeywords: ["list", "table", "plan", "step"], mockOptions: ["Step-by-step plan", "Short explanation", "Table or comparison", "Checklist"] }),
      s({ id: "constraints", label: "Constraints", group: "constraints", impact: 0.45, critical: false, format: "free_text",
        hint: "Budget, time, tools, things to avoid.", fallback: "No special constraints", mockKeywords: ["budget", "deadline", "hours", "without"] }),
    ],
  },
};

export function familyTemplate(id: FamilyId): FamilyTemplate {
  return FAMILIES[id];
}

export function slotTemplate(family: FamilyId, slotId: string): SlotTemplate | undefined {
  return FAMILIES[family].slots.find((x) => x.id === slotId);
}
