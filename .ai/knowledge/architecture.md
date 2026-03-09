# Architecture

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Framework**: React 16.8+ (hooks)
- **Build**: tsup (esbuild-based, zero config, ESM + CJS dual output)
- **Test**: Vitest + Testing Library
- **Lint**: ESLint + Prettier
- **Package manager**: npm

## Project Structure

```
src/
  index.ts                — public API (re-exports)
  types.ts                — all public TypeScript types/interfaces
  useIdleTimeout.ts       — the core hook (consumer-facing)
  IdleTimeoutProvider.tsx  — context provider + useIdleTimeoutContext
  IdleTimeoutDialog.tsx   — unstyled default dialog component
  core/
    IdleManager.ts        — timeout scheduling, activity detection, warning logic
    TabSync.ts            — cross-tab sync (localStorage + Web Locks leader election)
    constants.ts          — default config values
```

## Design Principles

### Separation of Concerns

The architecture separates three layers:

1. **Core logic** (`core/`) — framework-agnostic. `IdleManager` and `TabSync` are plain TypeScript classes with no React dependency. They could theoretically be used with Vue, Svelte, or vanilla JS.

2. **React binding** (`useIdleTimeout`) — the hook wires core logic into React lifecycle. Manages refs, effects, and state. This is the primary public API.

3. **UI** (`IdleTimeoutDialog`) — a fully controlled, unstyled component driven by the hook's state. Zero internal state — just renders what it's told.

### Cross-Tab Architecture

Derived from the existing battle-tested implementation:

```
Tab A (leader)              Tab B (follower)           Tab C (follower)
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ IdleManager     │        │ IdleManager     │        │ IdleManager     │
│ ┌─────────────┐ │        │ ┌─────────────┐ │        │ ┌─────────────┐ │
│ │ TabSync     │◄├────────┤►│ TabSync     │◄├────────┤►│ TabSync     │ │
│ └─────────────┘ │  local │ └─────────────┘ │  local │ └─────────────┘ │
│                 │ Storage│                 │ Storage│                 │
│ Web Lock held   │        │ Web Lock queued │        │ Web Lock queued │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

**localStorage keys** (namespaced):
- `idle:lastActivity` — timestamp of last activity across all tabs
- `idle:logoutAt` — when the session expires (leader sets this)
- `idle:logoutInProgress` — flag to coordinate logout across tabs

**Web Locks API** — used for leader election:
- Leader holds the lock, handles the actual timeout/logout logic
- Followers listen for localStorage changes and sync their UI
- If leader tab closes, another tab acquires the lock automatically
- Fallback: if Web Locks unavailable, all tabs act as leader (same behaviour, slightly redundant)

**Storage event** — `window.addEventListener('storage', ...)` fires when another tab writes to localStorage. This is the cross-tab communication channel.

### Activity Detection

DOM events monitored: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`

**Throttling strategy** (two levels):
1. **Event throttle** (~1s) — ignores rapid-fire events (mousemove). Prevents CPU spikes.
2. **Storage write throttle** (~30s) — only writes to localStorage periodically. Activity resets the in-memory timer immediately but doesn't spam storage.

### Warning / Prompt Flow

```
User active ──► idle timeout starts ──► warning fires ──► timeout fires
                    │                       │                  │
                    │ (user activity)       │ (user activity) │
                    ◄───── reset ───────────◄──── reset ──────┘
                                                               │
                                                         onIdle callback
```

The warning period is subtracted from the idle timeout, not added to it.
Example: 60min timeout + 60s warning = warning fires at 59:00, logout at 60:00.

## Build Output

tsup produces:
- `dist/index.js` — CommonJS
- `dist/index.mjs` — ESM
- `dist/index.d.ts` — TypeScript declarations

Package.json uses `exports` field for dual ESM/CJS support.

## Public API Surface (minimal by design)

```typescript
// Hook
useIdleTimeout(options?: IdleTimeoutOptions): IdleTimeoutAPI

// Context
<IdleTimeoutProvider {...options}>{children}</IdleTimeoutProvider>
useIdleTimeoutContext(): IdleTimeoutAPI

// Component
<IdleTimeoutDialog
  isOpen={boolean}
  remainingTime={number}
  onStayActive={() => void}
  onIdle={() => void}
  className?: string
/>
```

That's it. Intentionally small.
