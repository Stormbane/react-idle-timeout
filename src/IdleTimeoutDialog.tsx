import { useEffect, useRef } from 'react';
import type { IdleTimeoutDialogProps } from './types';

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Unstyled idle timeout warning dialog.
 *
 * Uses the native `<dialog>` element. Ships with no CSS — apply your own
 * styles via the `className` prop or target the CSS classes:
 *
 * - `.idle-timeout-dialog` — the `<dialog>` element
 * - `.idle-timeout-dialog__title` — the heading
 * - `.idle-timeout-dialog__message` — the description text
 * - `.idle-timeout-dialog__timer` — the countdown display
 * - `.idle-timeout-dialog__actions` — the button container
 * - `.idle-timeout-dialog__stay` — the "stay logged in" button
 * - `.idle-timeout-dialog__idle` — the "log out" button
 *
 * @example
 * ```tsx
 * const { isWarning, remainingTime, reset } = useIdleTimeout({
 *   timeout: 900000,
 *   warningDuration: 30000,
 *   onIdle: () => logout(),
 * });
 *
 * <IdleTimeoutDialog
 *   isOpen={isWarning}
 *   remainingTime={remainingTime}
 *   onStayActive={reset}
 *   onIdle={logout}
 * />
 * ```
 */
export function IdleTimeoutDialog({
  isOpen,
  remainingTime,
  onStayActive,
  onIdle,
  className,
  title = 'Session Timeout Warning',
  message = 'Your session is about to expire due to inactivity.',
  stayActiveText = 'Stay Logged In',
  idleText = 'Log Out',
}: IdleTimeoutDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onStayActiveRef = useRef(onStayActive);
  onStayActiveRef.current = onStayActive;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Use native event listener for cancel (Escape key) to work in React 16/17
  // where React's synthetic onCancel doesn't fire on <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onStayActiveRef.current();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`idle-timeout-dialog${className ? ` ${className}` : ''}`}
      aria-labelledby="idle-timeout-title"
      aria-describedby="idle-timeout-message"
    >
      <h2 id="idle-timeout-title" className="idle-timeout-dialog__title">
        {title}
      </h2>
      <p id="idle-timeout-message" className="idle-timeout-dialog__message">
        {message}
      </p>
      <p className="idle-timeout-dialog__timer" aria-live="polite" role="timer">
        {remainingTime !== null ? formatTime(remainingTime) : ''}
      </p>
      <div className="idle-timeout-dialog__actions">
        <button
          type="button"
          className="idle-timeout-dialog__stay"
          onClick={onStayActive}
        >
          {stayActiveText}
        </button>
        <button
          type="button"
          className="idle-timeout-dialog__idle"
          onClick={onIdle}
        >
          {idleText}
        </button>
      </div>
    </dialog>
  );
}
