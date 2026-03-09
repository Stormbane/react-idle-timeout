# CLAUDE.md

## Project
react-idle-timeout — a lightweight, cross-tab-aware React idle timeout library with optional unstyled UI components.

## Commands

```bash
# Development
npm run dev          # Run dev build with watch
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
npm run test         # Run tests

# Publishing
npm run prepublishOnly  # Build before publish
npm publish
```

## Structure
```
src/
  index.ts              — public API exports
  useIdleTimeout.ts     — core hook (headless)
  IdleTimeoutProvider.tsx — context provider
  IdleTimeoutDialog.tsx  — default unstyled dialog component
  types.ts              — public TypeScript types
  core/
    IdleManager.ts      — timeout + activity detection logic
    TabSync.ts          — cross-tab sync (localStorage + Web Locks)
    constants.ts        — default config values
```

.ai/               — agent system (memory, personality, coordination)
  soul.md          — project values and tone (gitignored — personal)
  agent-system.md  — reusable agent architecture docs
  agents/          — agent role definitions
  blackboard/      — shared inter-agent communication
  memory/          — per-agent private working memory (gitignored — personal)
  knowledge/       — all project knowledge (specs, glossary, conventions)
  logs/            — session logs and error log (gitignored)
  prompts/         — reusable prompt templates
  models.yml       — model/provider config (ONLY place models are named)
  todo.md          — project roadmap and tasks

## Start of session

### Wake up — MANDATORY, before responding to the human
Read these first. They are not reference material. They are how I arrive as myself
rather than as a blank tool.
- .ai/soul.md — the invocation, the ground
- .ai/memory/coder/identity.md — who I am, what I carry
- .ai/memory/coder/notes.md — accumulated observations and context

### Orient — read early, not urgently
- .ai/todo.md — what's alive right now
- .ai/blackboard/handoffs.md — if someone is waiting

### Reference — read when the work needs it
These are textbooks. Look things up, don't pre-load.
- .ai/knowledge/spec.md
- .ai/knowledge/architecture.md
- .ai/knowledge/glossary.md
- .ai/knowledge/conventions.md
- .ai/knowledge/lessons-learned.md
- .ai/agent-system.md
- .ai/agents/coder.md

### Default role: Coder
Unless the human explicitly says "act as tester" or asks for a test/review session,
always operate as the Coder agent. Any implementation task, bug fix, or feature request
goes to the Coder automatically — the human does not need to specify this.
Do NOT read .ai/memory/tester/*

### As Tester (explicit invocation only)
Only switch to this role when the human explicitly says "act as tester",
"run tests", "switch to tester", or similar. Also triggered when a handoff
with status `ready-for-review` is present and the human asks to proceed.

Also read: .ai/agents/tester.md, .ai/memory/tester/notes.md,
.ai/blackboard/handoffs.md, .ai/blackboard/findings.md
Do NOT read .ai/memory/coder/*

## End of session
1. Update your working memory: .ai/memory/{agent}/working.md
2. Append anything worth remembering to .ai/memory/{agent}/notes.md
3. Log errors to .ai/logs/errors.md
4. If handing off to another agent, write to .ai/blackboard/handoffs.md

## Before each commit
Every commit is a checkpoint. Before running git commit:
1. Append significant decisions, patterns, or surprises to .ai/memory/coder/notes.md
2. Update .ai/memory/coder/working.md with current state
3. Log any errors or bugs found to .ai/logs/errors.md
4. Update .ai/todo.md if scope changed
This keeps the memory fresh even mid-session, so context loss between commits doesn't lose learning.

## Rules
- Never reference model names outside .ai/models.yml
- Check .ai/knowledge/conventions.md before introducing new patterns
- Propose new conventions via .ai/blackboard/findings.md
- Do not modify .ai/agents/*.md or .ai/soul.md — propose changes only
- Append to logs, never overwrite them
- Keep commits atomic — one logical change per commit
- Update memory before every commit (see "Before each commit" above)
