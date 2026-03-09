import type { IdleTimeoutOptions } from '../types';
import { DEFAULTS } from './constants';
import { TabSync } from './TabSync';

export type IdleState = 'active' | 'warning' | 'idle' | 'paused' | 'stopped';

export interface IdleManagerCallbacks {
  onStateChange: (state: IdleState, remainingMs: number | null) => void;
}

/**
 * Core idle timeout manager. Framework-agnostic.
 *
 * Handles:
 * - Activity event detection with throttling
 * - Timeout scheduling (active → warning → idle)
 * - Cross-tab sync via TabSync
 * - Pause/resume
 */
export class IdleManager {
  private options: Required<
    Pick<
      IdleTimeoutOptions,
      'timeout' | 'warningDuration' | 'events' | 'throttle' | 'storageThrottle' | 'crossTab' | 'storageKeyPrefix'
    >
  > & Pick<IdleTimeoutOptions, 'onIdle' | 'onWarning' | 'onActive'>;

  private callbacks: IdleManagerCallbacks;
  private tabSync: TabSync | null = null;

  private state: IdleState = 'stopped';
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private countdownId: ReturnType<typeof setInterval> | null = null;
  private lastActivity = 0;
  private logoutAt = 0;
  private pausedRemaining: number | null = null;

  private boundOnActivity: () => void;

  constructor(options: IdleTimeoutOptions, callbacks: IdleManagerCallbacks) {
    this.options = {
      timeout: options.timeout ?? DEFAULTS.timeout,
      warningDuration: options.warningDuration ?? DEFAULTS.warningDuration,
      events: options.events ?? [...DEFAULTS.events],
      throttle: options.throttle ?? DEFAULTS.throttle,
      storageThrottle: options.storageThrottle ?? DEFAULTS.storageThrottle,
      crossTab: options.crossTab ?? true,
      storageKeyPrefix: options.storageKeyPrefix ?? DEFAULTS.storageKeyPrefix,
      onIdle: options.onIdle,
      onWarning: options.onWarning,
      onActive: options.onActive,
    };

    if (this.options.timeout <= 0) {
      throw new Error('react-idle-timeout: timeout must be greater than 0');
    }
    if (this.options.warningDuration < 0) {
      throw new Error('react-idle-timeout: warningDuration must be >= 0');
    }
    if (this.options.warningDuration >= this.options.timeout) {
      throw new Error('react-idle-timeout: warningDuration must be less than timeout');
    }

    this.callbacks = callbacks;
    this.boundOnActivity = this.onActivity.bind(this);
  }

  getState(): IdleState {
    return this.state;
  }

  getRemainingMs(): number | null {
    if (this.state === 'stopped' || this.state === 'idle') return null;
    if (this.state === 'paused') return this.pausedRemaining;
    const remaining = this.logoutAt - Date.now();
    return Math.max(0, remaining);
  }

  start(): void {
    if (this.state === 'active' || this.state === 'warning') return;

    if (this.options.crossTab) {
      this.tabSync = new TabSync({
        prefix: this.options.storageKeyPrefix,
        storageThrottle: this.options.storageThrottle,
        onRemoteActivity: () => this.syncFromStorage(),
        onRemoteLogout: () => this.handleRemoteLogout(),
      });
      this.tabSync.start();

      // Clear any stale logout flag from a previous session
      try {
        localStorage.removeItem(
          `${this.options.storageKeyPrefix}:logoutInProgress`
        );
      } catch {
        // fail silently
      }
    }

    this.addEventListeners();
    this.resetTimer(true);
  }

  reset(): void {
    if (this.state === 'stopped' || this.state === 'paused') return;

    const wasWarningOrIdle = this.state === 'warning' || this.state === 'idle';
    this.resetTimer(true);

    if (wasWarningOrIdle) {
      this.options.onActive?.();
    }
  }

  pause(): void {
    if (this.state !== 'active' && this.state !== 'warning') return;

    this.pausedRemaining = this.getRemainingMs();
    this.clearTimers();
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused' || this.pausedRemaining === null) return;

    const now = Date.now();
    this.logoutAt = now + this.pausedRemaining;
    this.pausedRemaining = null;

    this.scheduleFromLogoutAt();
  }

  destroy(): void {
    this.clearTimers();
    this.removeEventListeners();
    this.tabSync?.destroy();
    this.tabSync = null;
    this.setState('stopped');
  }

  // --- Private ---

  private resetTimer(force = false): void {
    this.lastActivity = Date.now();
    this.logoutAt = this.lastActivity + this.options.timeout;

    this.clearTimers();

    if (this.tabSync) {
      this.tabSync.writeActivity(this.logoutAt, force);
    }

    this.scheduleFromLogoutAt();
  }

  private scheduleFromLogoutAt(): void {
    const remaining = this.logoutAt - Date.now();

    if (remaining <= 0) {
      this.handleIdle();
      return;
    }

    // Schedule the idle timeout
    const delay = this.tabSync
      ? this.tabSync.isLeader
        ? remaining
        : remaining + 2000 // followers wait slightly longer
      : remaining;

    this.timeoutId = setTimeout(() => this.handleIdle(), delay);

    // Schedule warning
    const { warningDuration } = this.options;
    if (warningDuration > 0) {
      const warningDelay = remaining - warningDuration;
      if (warningDelay > 0) {
        this.warningId = setTimeout(() => this.handleWarning(), warningDelay);
        this.setState('active');
      } else {
        // Already in warning zone
        this.handleWarning();
      }
    } else {
      this.setState('active');
    }

    // Start the countdown interval so remainingTime updates every second
    this.startCountdown();
  }

  private handleWarning(): void {
    if (this.state === 'warning' || this.state === 'stopped') return;

    this.setState('warning');
    this.options.onWarning?.();
  }

  private handleIdle(): void {
    if (this.state === 'stopped') return;

    this.clearTimers();

    if (this.tabSync) {
      const won = this.tabSync.signalLogout();
      if (won) {
        this.tabSync.clearStorage();
      }
    }

    this.setState('idle');
    this.options.onIdle?.();
  }

  private handleRemoteLogout(): void {
    this.clearTimers();
    this.removeEventListeners();
    this.tabSync?.destroy();
    this.tabSync = null;
    this.setState('idle');
    this.options.onIdle?.();
  }

  private syncFromStorage(): void {
    if (this.state === 'stopped' || this.state === 'paused') return;
    if (!this.tabSync) return;

    const logoutAt = this.tabSync.readLogoutAt();
    if (!logoutAt) return;

    // Another tab extended the session
    this.logoutAt = logoutAt;
    this.clearTimers();

    const wasWarning = this.state === 'warning';
    this.scheduleFromLogoutAt();

    if (wasWarning && this.state === 'active') {
      this.options.onActive?.();
    }
  }

  private onActivity(): void {
    if (this.state === 'stopped' || this.state === 'paused') return;

    const now = Date.now();
    if (now - this.lastActivity < this.options.throttle) return;

    this.reset();
  }

  private addEventListeners(): void {
    if (typeof document === 'undefined') return;
    this.options.events.forEach((event) => {
      document.addEventListener(event, this.boundOnActivity, { passive: true });
    });
  }

  private removeEventListeners(): void {
    if (typeof document === 'undefined') return;
    this.options.events.forEach((event) => {
      document.removeEventListener(event, this.boundOnActivity);
    });
  }

  private clearTimers(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId !== null) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
    this.clearCountdown();
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdownId = setInterval(() => {
      const remaining = this.getRemainingMs();
      if (remaining !== null && remaining <= 0) {
        this.clearCountdown();
      }
      this.emitState();
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownId !== null) {
      clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }

  private setState(state: IdleState): void {
    this.state = state;
    this.emitState();
  }

  private emitState(): void {
    this.callbacks.onStateChange(this.state, this.getRemainingMs());
  }
}
