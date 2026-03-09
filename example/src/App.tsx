import { useState, useCallback } from 'react';
import { useIdleTimeout, IdleTimeoutDialog } from 'react-idle-timeout';

export function App() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [events, setEvents] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    setEvents((prev) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 50));
  }, []);

  const handleLogout = useCallback(() => {
    log('Session expired — logged out');
    setLoggedIn(false);
  }, [log]);

  const { isWarning, remainingTime, reset, pause, resume, isIdle } = useIdleTimeout({
    timeout: 10 * 1000,          // 10 seconds (short for demo)
    warningDuration: 5 * 1000,   // 5 second warning
    crossTab: true,
    startOnMount: loggedIn,
    onWarning: () => log('Warning: session about to expire'),
    onIdle: handleLogout,
    onActive: () => log('User returned — timer reset'),
  });

  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>Logged Out</h1>
          <p>Your session expired due to inactivity.</p>
          <button
            style={styles.button}
            onClick={() => {
              setLoggedIn(true);
              setEvents([]);
              // The hook will restart on next render since startOnMount is tied to loggedIn
              window.location.reload();
            }}
          >
            Log Back In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>react-idle-timeout</h1>
        <p style={styles.subtitle}>
          Move your mouse, click, or press keys to stay active.
          <br />
          Stop interacting for <strong>10 seconds</strong> to trigger the timeout.
        </p>

        <div style={styles.status}>
          <div>
            <strong>Status:</strong>{' '}
            {isIdle ? '🔴 Idle' : isWarning ? '🟡 Warning' : '🟢 Active'}
          </div>
          {remainingTime !== null && (
            <div>
              <strong>Time remaining:</strong> {remainingTime}s
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button style={styles.button} onClick={() => { reset(); log('Manual reset'); }}>
            Reset Timer
          </button>
          <button style={styles.buttonSecondary} onClick={() => { pause(); log('Timer paused'); }}>
            Pause
          </button>
          <button style={styles.buttonSecondary} onClick={() => { resume(); log('Timer resumed'); }}>
            Resume
          </button>
        </div>

        <div style={styles.eventLog}>
          <h3>Event Log</h3>
          {events.length === 0 && <p style={styles.muted}>No events yet...</p>}
          {events.map((e, i) => (
            <div key={i} style={styles.event}>{e}</div>
          ))}
        </div>
      </div>

      <IdleTimeoutDialog
        isOpen={isWarning}
        remainingTime={remainingTime}
        onStayActive={() => { reset(); log('User clicked Stay Logged In'); }}
        onIdle={handleLogout}
      />

      <p style={styles.hint}>
        Open this page in multiple tabs to see cross-tab sync in action.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 600,
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 24,
    background: '#fff',
  },
  subtitle: {
    color: '#666',
    lineHeight: 1.5,
  },
  status: {
    display: 'flex',
    gap: 24,
    padding: '12px 16px',
    background: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 16,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
  },
  buttonSecondary: {
    padding: '8px 16px',
    background: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
  },
  eventLog: {
    maxHeight: 200,
    overflowY: 'auto' as const,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    padding: 12,
  },
  event: {
    fontSize: 13,
    fontFamily: 'monospace',
    padding: '2px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  muted: {
    color: '#999',
    fontStyle: 'italic',
  },
  hint: {
    textAlign: 'center' as const,
    color: '#999',
    marginTop: 16,
    fontSize: 14,
  },
};
