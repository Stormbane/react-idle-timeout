# Glossary

**idle** — the user has not interacted with the page for longer than the configured timeout. The session is considered expired.

**warning** / **prompt** — the period before idle fires, giving the user a chance to extend their session. "Warning" is our term; react-idle-timer calls it "prompt." We use "warning" because it's clearer.

**active** — the user is interacting with the page. Any monitored DOM event resets the idle timer.

**leader** — the tab that holds the Web Lock and is responsible for coordinating logout. Only one tab is leader at a time. If the leader tab closes, another tab acquires the lock.

**follower** — any tab that does not hold the Web Lock. Followers sync their UI state from localStorage but defer the logout action to the leader.

**cross-tab sync** — the mechanism by which activity in one tab resets the idle timer in all tabs. Implemented via localStorage `storage` events.

**activity throttle** — rate limiting on DOM event handlers to prevent CPU spikes. A mousemove fires hundreds of times per second; the throttle reduces this to ~1 per second.

**storage write throttle** — rate limiting on localStorage writes. Activity resets the in-memory timer immediately but only writes to localStorage every ~30 seconds to avoid performance issues.

**headless** — using the hook without any UI component. The consumer builds their own warning dialog or handles idle state however they want.

**unstyled** — the default dialog component ships with semantic HTML and CSS class hooks but no visual styling. Consumers apply their own CSS.
