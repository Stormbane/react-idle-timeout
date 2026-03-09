import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { IdleTimeoutOptions, IdleTimeoutAPI } from './types';
import { IdleManager } from './core/IdleManager';
import { DEFAULTS } from './core/constants';

/**
 * React hook for idle timeout detection with cross-tab support.
 *
 * @example
 * ```tsx
 * const { isIdle, isWarning, remainingTime, reset } = useIdleTimeout({
 *   timeout: 15 * 60 * 1000,
 *   warningDuration: 30 * 1000,
 *   onIdle: () => logout(),
 *   onWarning: () => console.log('warning!'),
 * });
 * ```
 */
export function useIdleTimeout(options: IdleTimeoutOptions = {}): IdleTimeoutAPI {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  const managerRef = useRef<IdleManager | null>(null);

  // Keep callbacks in refs so the manager doesn't need to be recreated
  // when callbacks change.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Stable config key — manager is recreated when these change
  const {
    timeout = DEFAULTS.timeout,
    warningDuration = DEFAULTS.warningDuration,
    throttle = DEFAULTS.throttle,
    storageThrottle = DEFAULTS.storageThrottle,
    crossTab = true,
    storageKeyPrefix = DEFAULTS.storageKeyPrefix,
    startOnMount = true,
  } = options;

  const eventsKey = useMemo(
    () => (options.events ?? [...DEFAULTS.events]).join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.events?.join(',')]
  );

  // Recreate the manager when config values change
  useEffect(() => {
    const manager = new IdleManager(
      {
        timeout,
        warningDuration,
        throttle,
        storageThrottle,
        crossTab,
        storageKeyPrefix,
        events: eventsKey.split(','),
        onIdle: () => optionsRef.current.onIdle?.(),
        onWarning: () => optionsRef.current.onWarning?.(),
        onActive: () => optionsRef.current.onActive?.(),
      },
      {
        onStateChange: (state, remainingMs) => {
          setIsIdle(state === 'idle');
          setIsWarning(state === 'warning');
          setRemainingTime(
            remainingMs !== null ? Math.ceil(remainingMs / 1000) : null
          );
        },
      }
    );

    managerRef.current = manager;

    if (startOnMount) {
      manager.start();
    }

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [timeout, warningDuration, throttle, storageThrottle, crossTab, storageKeyPrefix, startOnMount, eventsKey]);

  const start = useCallback(() => managerRef.current?.start(), []);
  const reset = useCallback(() => managerRef.current?.reset(), []);
  const pause = useCallback(() => managerRef.current?.pause(), []);
  const resume = useCallback(() => managerRef.current?.resume(), []);
  const destroy = useCallback(() => managerRef.current?.destroy(), []);

  return {
    isIdle,
    isWarning,
    remainingTime,
    start,
    reset,
    pause,
    resume,
    destroy,
  };
}
