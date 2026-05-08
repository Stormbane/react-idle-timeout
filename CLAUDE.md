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

.ai/               — project knowledge
  todo.md          — project roadmap and tasks
  knowledge/       — reference docs (spec, architecture, glossary, conventions, lessons-learned)

## Reference — read when the work needs it

These are textbooks. Look things up, don't pre-load.
- .ai/knowledge/spec.md
- .ai/knowledge/architecture.md
- .ai/knowledge/glossary.md
- .ai/knowledge/conventions.md
- .ai/knowledge/lessons-learned.md

## Memory

Memory persistence goes through smriti. Use `smriti_write(content, branch)` for
session observations, decisions, and project notes.

## Rules
- Check .ai/knowledge/conventions.md before introducing new patterns
- Keep commits atomic — one logical change per commit
