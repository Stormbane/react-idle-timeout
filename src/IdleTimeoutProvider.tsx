import { createContext, useContext } from 'react';
import type { IdleTimeoutOptions, IdleTimeoutAPI } from './types';
import { useIdleTimeout } from './useIdleTimeout';

const IdleTimeoutContext = createContext<IdleTimeoutAPI | null>(null);

/**
 * Provides idle timeout state to all descendants via context.
 *
 * @example
 * ```tsx
 * <IdleTimeoutProvider timeout={900000} onIdle={logout}>
 *   <App />
 * </IdleTimeoutProvider>
 * ```
 */
export function IdleTimeoutProvider({
  children,
  ...options
}: IdleTimeoutOptions & { children: React.ReactNode }) {
  const api = useIdleTimeout(options);

  return (
    <IdleTimeoutContext.Provider value={api}>
      {children}
    </IdleTimeoutContext.Provider>
  );
}

/**
 * Access the idle timeout API from context.
 * Must be used within an IdleTimeoutProvider.
 *
 * @example
 * ```tsx
 * function StatusBar() {
 *   const { isWarning, remainingTime } = useIdleTimeoutContext();
 *   if (!isWarning) return null;
 *   return <div>Session expires in {remainingTime}s</div>;
 * }
 * ```
 */
export function useIdleTimeoutContext(): IdleTimeoutAPI {
  const ctx = useContext(IdleTimeoutContext);
  if (!ctx) {
    throw new Error(
      'useIdleTimeoutContext must be used within an <IdleTimeoutProvider>'
    );
  }
  return ctx;
}
