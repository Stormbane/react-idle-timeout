# TODO

## v1.0 — Initial Release

### Setup
- [ ] Initialize npm package (package.json, tsconfig, tsup config)
- [ ] ESLint + Prettier config
- [ ] Vitest setup
- [ ] GitHub repo setup + CI (GitHub Actions: lint, typecheck, test, build)

### Core
- [ ] `types.ts` — public types and interfaces
- [ ] `core/constants.ts` — default config values
- [ ] `core/TabSync.ts` — localStorage + Web Locks cross-tab sync
- [ ] `core/IdleManager.ts` — timeout scheduling + activity detection
- [ ] `useIdleTimeout.ts` — React hook wrapping core logic
- [ ] `IdleTimeoutProvider.tsx` — context provider
- [ ] `IdleTimeoutDialog.tsx` — unstyled default dialog

### Tests
- [ ] Unit tests for IdleManager (timer logic, activity detection)
- [ ] Unit tests for TabSync (localStorage read/write, leader election mock)
- [ ] Integration tests for useIdleTimeout hook
- [ ] Component tests for IdleTimeoutDialog

### Documentation
- [ ] README.md (install, quick start, API reference, examples)
- [ ] CONTRIBUTING.md
- [ ] LICENSE (MIT)

### Publish
- [ ] npm publish dry run
- [ ] First release (v1.0.0)

## Post v1.0
- [ ] Demo site / playground
- [ ] WebWorker timer option for background tab accuracy
- [ ] SSR safety (no-op on server)
- [ ] `onAction` callback
- [ ] Cross-tab messaging API
