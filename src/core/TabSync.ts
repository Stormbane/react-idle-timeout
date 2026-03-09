import { storageKeys, LOCK_PREFIX } from './constants';

export interface TabSyncConfig {
  prefix: string;
  storageThrottle: number;
  onRemoteActivity: () => void;
  onRemoteLogout: () => void;
}

/**
 * Cross-tab synchronisation via localStorage + Web Locks API.
 *
 * - Writes activity timestamps to localStorage so other tabs can sync.
 * - Uses the Web Locks API for leader election (one tab handles logout).
 * - Falls back gracefully when Web Locks is unavailable.
 */
export class TabSync {
  private keys: ReturnType<typeof storageKeys>;
  private config: TabSyncConfig;
  private tabId: string;
  private lastStorageWrite = 0;
  private _isLeader = false;
  private releaseLock: (() => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lockPromise: Promise<any> | null = null;
  private boundOnStorage: (e: StorageEvent) => void;
  private destroyed = false;

  constructor(config: TabSyncConfig) {
    this.config = config;
    this.keys = storageKeys(config.prefix);
    this.tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    this.boundOnStorage = this.onStorage.bind(this);
  }

  get isLeader(): boolean {
    return this._isLeader;
  }

  start(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', this.boundOnStorage);
    this.acquireLock();
  }

  /**
   * Write the current activity timestamp and logoutAt to localStorage.
   * Throttled to avoid CPU spikes — force=true bypasses throttle.
   */
  writeActivity(logoutAt: number, force = false): void {
    const now = Date.now();
    if (!force && now - this.lastStorageWrite < this.config.storageThrottle) {
      return;
    }
    this.lastStorageWrite = now;
    try {
      localStorage.setItem(this.keys.lastActivity, now.toString());
      localStorage.setItem(this.keys.logoutAt, logoutAt.toString());
    } catch {
      // localStorage might be full or unavailable — fail silently
    }
  }

  /**
   * Read the logoutAt timestamp from localStorage.
   * Returns null if not set or unparseable.
   */
  readLogoutAt(): number | null {
    const val = localStorage.getItem(this.keys.logoutAt);
    if (!val) return null;
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? null : n;
  }

  /**
   * Signal all tabs to log out. Only the first tab to set the flag wins.
   * Returns true if this tab set the flag, false if another tab already did.
   */
  signalLogout(): boolean {
    const existing = localStorage.getItem(this.keys.logoutInProgress);
    if (existing) return false;

    localStorage.setItem(this.keys.logoutInProgress, this.tabId);
    // Verify we won the race
    return localStorage.getItem(this.keys.logoutInProgress) === this.tabId;
  }

  /**
   * Clean up localStorage keys.
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(this.keys.lastActivity);
      localStorage.removeItem(this.keys.logoutAt);
      localStorage.removeItem(this.keys.logoutInProgress);
    } catch {
      // fail silently
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.boundOnStorage);
    }

    if (this.releaseLock) {
      this.releaseLock();
      this.releaseLock = null;
    }

    this._isLeader = false;
    this.lockPromise = null;
  }

  private onStorage(e: StorageEvent): void {
    if (this.destroyed) return;

    if (e.key === this.keys.logoutInProgress && e.newValue) {
      this.config.onRemoteLogout();
      return;
    }

    if (e.key === this.keys.lastActivity || e.key === this.keys.logoutAt) {
      this.config.onRemoteActivity();
    }
  }

  private acquireLock(): void {
    if (this._isLeader || this.lockPromise) return;

    if (typeof navigator === 'undefined' || !navigator.locks) {
      // No Web Locks API — act as leader (standalone behaviour)
      this._isLeader = true;
      return;
    }

    const lockName = `${LOCK_PREFIX}:${this.config.prefix}`;

    try {
      this.lockPromise = navigator.locks.request(
        lockName,
        async () => {
          if (this.destroyed) return;

          this._isLeader = true;
          await new Promise<void>((resolve) => {
            this.releaseLock = () => {
              this._isLeader = false;
              resolve();
            };
          });
        }
      );
    } catch {
      // Web Locks request failed — fall back to leader mode
      this._isLeader = true;
      this.lockPromise = null;
    }
  }
}
