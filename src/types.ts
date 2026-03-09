/**
 * Configuration options for the idle timeout.
 */
export interface IdleTimeoutOptions {
  /**
   * Time in milliseconds before the user is considered idle.
   * @default 900000 (15 minutes)
   */
  timeout?: number;

  /**
   * Time in milliseconds before idle to show a warning.
   * Set to 0 to disable the warning phase.
   * @default 30000 (30 seconds)
   */
  warningDuration?: number;

  /**
   * DOM events that count as user activity.
   * @default ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
   */
  events?: string[];

  /**
   * Minimum time in milliseconds between processing activity events.
   * Prevents CPU spikes from rapid events like mousemove.
   * @default 1000
   */
  throttle?: number;

  /**
   * Minimum time in milliseconds between localStorage writes.
   * Activity resets the in-memory timer immediately but only
   * writes to storage at this interval.
   * @default 30000
   */
  storageThrottle?: number;

  /**
   * Enable cross-tab synchronisation via localStorage.
   * @default true
   */
  crossTab?: boolean;

  /**
   * Prefix for localStorage keys. Useful if multiple instances
   * need to coexist on the same origin.
   * @default 'idle'
   */
  storageKeyPrefix?: string;

  /**
   * Start the timer automatically on mount.
   * @default true
   */
  startOnMount?: boolean;

  /**
   * Called when the idle timeout expires.
   */
  onIdle?: () => void;

  /**
   * Called when the warning period begins.
   */
  onWarning?: () => void;

  /**
   * Called when the user becomes active after being idle or in warning state.
   */
  onActive?: () => void;
}

/**
 * The API returned by useIdleTimeout.
 */
export interface IdleTimeoutAPI {
  /** Whether the user is currently idle (timeout has expired). */
  isIdle: boolean;

  /** Whether the warning dialog should be shown. */
  isWarning: boolean;

  /** Seconds remaining until idle. Null when not running. */
  remainingTime: number | null;

  /** Start the idle timer. No-op if already running. */
  start: () => void;

  /** Reset the idle timer as if the user just interacted. */
  reset: () => void;

  /** Pause the idle timer. Preserves remaining time. */
  pause: () => void;

  /** Resume a paused timer. */
  resume: () => void;

  /** Stop and clean up the idle timer. */
  destroy: () => void;
}

/**
 * Props for the IdleTimeoutDialog component.
 */
export interface IdleTimeoutDialogProps {
  /** Whether the dialog is open. */
  isOpen: boolean;

  /** Seconds remaining until idle. */
  remainingTime: number | null;

  /** Called when the user wants to stay active. */
  onStayActive: () => void;

  /** Called when the user wants to log out immediately. */
  onIdle: () => void;

  /** Optional CSS class name for the dialog element. */
  className?: string;

  /** Optional title text. @default "Session Timeout Warning" */
  title?: string;

  /** Optional message text. @default "Your session is about to expire due to inactivity." */
  message?: string;

  /** Optional stay active button text. @default "Stay Logged In" */
  stayActiveText?: string;

  /** Optional idle/logout button text. @default "Log Out" */
  idleText?: string;
}
