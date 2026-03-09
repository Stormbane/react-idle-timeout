# react-idle-timeout

Lightweight, cross-tab-aware React idle timeout with optional unstyled UI.

- **Cross-tab by default** — activity in any tab resets all tabs
- **Zero dependencies** — only peer deps on `react` and `react-dom`
- **Tiny API** — one hook, one context provider, one dialog component
- **Unstyled dialog** — uses native `<dialog>`, style it however you want
- **TypeScript** — full type definitions included

## Install

```bash
npm install react-idle-timeout
```

## Quick Start

### Hook (headless)

```tsx
import { useIdleTimeout } from 'react-idle-timeout';

function App() {
  const { isWarning, remainingTime, reset } = useIdleTimeout({
    timeout: 15 * 60 * 1000,      // 15 minutes
    warningDuration: 30 * 1000,    // 30 second warning
    onIdle: () => {
      // Session expired — log the user out
      logout();
    },
    onWarning: () => {
      console.log('User is about to be logged out');
    },
  });

  if (isWarning) {
    return (
      <div>
        <p>Session expires in {remainingTime} seconds</p>
        <button onClick={reset}>Stay Logged In</button>
      </div>
    );
  }

  return <YourApp />;
}
```

### With the built-in dialog

```tsx
import { useIdleTimeout, IdleTimeoutDialog } from 'react-idle-timeout';

function App() {
  const { isWarning, remainingTime, reset } = useIdleTimeout({
    timeout: 15 * 60 * 1000,
    warningDuration: 30 * 1000,
    onIdle: () => logout(),
  });

  return (
    <>
      <YourApp />
      <IdleTimeoutDialog
        isOpen={isWarning}
        remainingTime={remainingTime}
        onStayActive={reset}
        onIdle={() => logout()}
      />
    </>
  );
}
```

### With context provider

```tsx
import { IdleTimeoutProvider, useIdleTimeoutContext, IdleTimeoutDialog } from 'react-idle-timeout';

function Root() {
  return (
    <IdleTimeoutProvider
      timeout={15 * 60 * 1000}
      warningDuration={30 * 1000}
      onIdle={() => logout()}
    >
      <App />
      <TimeoutWarning />
    </IdleTimeoutProvider>
  );
}

function TimeoutWarning() {
  const { isWarning, remainingTime, reset } = useIdleTimeoutContext();

  return (
    <IdleTimeoutDialog
      isOpen={isWarning}
      remainingTime={remainingTime}
      onStayActive={reset}
      onIdle={() => logout()}
    />
  );
}
```

## API

### `useIdleTimeout(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `900000` (15min) | Idle timeout in milliseconds |
| `warningDuration` | `number` | `30000` (30s) | Warning period before idle. Set to `0` to disable. |
| `events` | `string[]` | `['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']` | DOM events that count as activity |
| `throttle` | `number` | `1000` | Minimum ms between processing activity events |
| `storageThrottle` | `number` | `30000` | Minimum ms between localStorage writes |
| `crossTab` | `boolean` | `true` | Enable cross-tab synchronisation |
| `storageKeyPrefix` | `string` | `'idle'` | Prefix for localStorage keys |
| `startOnMount` | `boolean` | `true` | Start timer automatically |
| `onIdle` | `() => void` | — | Called when timeout expires |
| `onWarning` | `() => void` | — | Called when warning period begins |
| `onActive` | `() => void` | — | Called when user returns from idle/warning |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isIdle` | `boolean` | Whether the timeout has expired |
| `isWarning` | `boolean` | Whether the warning period is active |
| `remainingTime` | `number \| null` | Seconds remaining until idle |
| `start()` | `() => void` | Start the timer (use with `startOnMount: false`) |
| `reset()` | `() => void` | Reset the timer as if the user just interacted |
| `pause()` | `() => void` | Pause the timer |
| `resume()` | `() => void` | Resume a paused timer |
| `destroy()` | `() => void` | Stop and clean up |

### `<IdleTimeoutProvider>`

Accepts all `useIdleTimeout` options as props, plus `children`. Provides the idle timeout API via context.

### `useIdleTimeoutContext()`

Access the idle timeout API from context. Must be used within an `<IdleTimeoutProvider>`.

### `<IdleTimeoutDialog>`

Unstyled dialog component using the native `<dialog>` element.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Whether the dialog is open |
| `remainingTime` | `number \| null` | — | Seconds remaining |
| `onStayActive` | `() => void` | — | Called when user clicks "Stay Logged In" |
| `onIdle` | `() => void` | — | Called when user clicks "Log Out" |
| `className` | `string` | — | Additional CSS class |
| `title` | `string` | `'Session Timeout Warning'` | Dialog title |
| `message` | `string` | `'Your session is about to expire due to inactivity.'` | Dialog message |
| `stayActiveText` | `string` | `'Stay Logged In'` | Stay button text |
| `idleText` | `string` | `'Log Out'` | Idle button text |

**CSS classes for styling:**

```css
.idle-timeout-dialog          /* the <dialog> element */
.idle-timeout-dialog__title   /* the heading */
.idle-timeout-dialog__message /* the description */
.idle-timeout-dialog__timer   /* the countdown */
.idle-timeout-dialog__actions /* button container */
.idle-timeout-dialog__stay    /* "Stay Logged In" button */
.idle-timeout-dialog__idle    /* "Log Out" button */
```

## Example

A full working example is in the [`example/`](./example) directory. It demonstrates:

- Hook usage with the built-in dialog
- Event logging
- Manual reset, pause, and resume controls
- Cross-tab sync (open in multiple tabs to see it)

To run it:

```bash
# From the repo root
npm run build               # Build the library first
cd example
npm install
npm run dev                 # Opens at http://localhost:5173
```

The example uses a 10-second timeout with a 5-second warning so you can see the behaviour quickly.

## How Cross-Tab Works

Activity detection and timeout synchronisation happen across all tabs on the same origin:

1. **Activity broadcast** — when a user interacts with any tab, the activity timestamp is written to `localStorage`. Other tabs pick this up via the `storage` event and reset their timers.

2. **Leader election** — the [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) ensures only one tab (the "leader") handles the actual logout. If the leader tab closes, another tab automatically takes over.

3. **Graceful fallback** — if Web Locks is unavailable, all tabs act independently (same behaviour, slightly redundant). The `localStorage` coordination still prevents multiple simultaneous logouts.

## Browser Support

Works in all modern browsers. The Web Locks API is supported in Chrome 69+, Firefox 96+, Safari 15.4+, and Edge 79+. Older browsers fall back gracefully to single-tab behaviour.

## License

MIT
