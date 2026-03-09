# Project Specification

## Vision

react-idle-timeout is a lightweight, cross-tab-aware React idle timeout library. It detects user inactivity, synchronises state across browser tabs, and provides both a headless hook and an optional unstyled dialog component for session timeout warnings.

The library exists because cross-tab idle detection is the hardest part of session timeout — and the dominant library in this space (react-idle-timer) is effectively unmaintained since June 2023 with 42 open issues, many related to cross-tab bugs.

## Users

React developers who need session timeout functionality — particularly those building apps where users have multiple tabs open (dashboards, admin panels, SaaS products, healthcare systems).

## Core Value Proposition

- **Cross-tab by default** — not an afterthought. Activity in any tab resets all tabs.
- **Lightweight** — zero runtime dependencies, small bundle, small API surface.
- **Works out of the box** — sensible defaults, unstyled dialog component included.
- **Headless when you want it** — the hook gives full control for custom UI.

## Features

### v1.0

- `useIdleTimeout` hook — core headless API
  - Configurable idle timeout duration
  - Configurable warning duration (prompt before idle)
  - Activity event detection (mouse, keyboard, touch, scroll, click)
  - Activity throttling (avoid CPU spikes on mousemove)
  - `onIdle` callback — fired when timeout expires
  - `onWarning` callback — fired when warning period begins
  - `onActive` callback — fired when user returns from idle/warning
  - `start()`, `reset()`, `pause()`, `resume()`, `destroy()` methods
  - `isIdle`, `isWarning`, `remainingTime` state
  - Cross-tab sync via localStorage (activity broadcast)
  - Leader election via Web Locks API (single tab handles logout)
  - Fallback for browsers without Web Locks (all tabs act independently)

- `IdleTimeoutProvider` — React context provider wrapping the hook
  - Provides idle state to any descendant via `useIdleTimeoutContext()`

- `IdleTimeoutDialog` — unstyled default dialog component
  - Semantic HTML (`<dialog>` element)
  - Countdown timer display
  - "Stay logged in" / "Log out" actions
  - CSS class hooks for consumer styling
  - Fully controlled — no internal state, driven by hook

### Future (post v1.0)
- `onAction` callback for activity events (analytics use case)
- Immediate idle events (e.g., close tab triggers immediate idle)
- Cross-tab messaging (arbitrary messages between tabs)
- `isLeader` exposed for consumer use
- WebWorker timer option for background tab accuracy
- SSR-safe (no-op on server)

## Non-Goals

- Not a full activity tracking / analytics library
- Not a session management library (no token refresh, no auth integration)
- No opinionated styling — the dialog is unstyled by design
- No class component HOC (hooks only — React 16.8+)

## Package

- **Name**: react-idle-timeout
- **License**: MIT
- **Peer deps**: react >=16.8, react-dom >=16.8
- **Runtime deps**: none
- **Min React**: 16.8 (hooks)
