export const DEFAULTS = {
  timeout: 15 * 60 * 1000,        // 15 minutes
  warningDuration: 30 * 1000,     // 30 seconds
  throttle: 1000,                 // 1 second
  storageThrottle: 30 * 1000,     // 30 seconds
  storageKeyPrefix: 'idle',
  events: [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
  ] as const,
} as const;

export function storageKeys(prefix: string) {
  return {
    lastActivity: `${prefix}:lastActivity`,
    logoutAt: `${prefix}:logoutAt`,
    logoutInProgress: `${prefix}:logoutInProgress`,
  } as const;
}

export const LOCK_PREFIX = 'idle:leader_lock';
