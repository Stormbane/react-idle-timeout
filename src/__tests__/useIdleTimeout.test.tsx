import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from '../useIdleTimeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts active with remaining time', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({ timeout: 5000, warningDuration: 2000, crossTab: false })
    );

    expect(result.current.isIdle).toBe(false);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.remainingTime).toBeGreaterThan(0);
  });

  it('sets isWarning when warning period begins', () => {
    const onWarning = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
        onWarning,
      })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isWarning).toBe(true);
    expect(onWarning).toHaveBeenCalledOnce();
  });

  it('sets isIdle when timeout expires', () => {
    const onIdle = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
        onIdle,
      })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.isIdle).toBe(true);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('resets on reset()', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(3500); // in warning
    });
    expect(result.current.isWarning).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isIdle).toBe(false);
  });

  it('does not start when startOnMount is false', () => {
    const onWarning = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
        startOnMount: false,
        onWarning,
      })
    );

    // Should not be running
    expect(result.current.isIdle).toBe(false);
    expect(result.current.isWarning).toBe(false);

    // Advancing time should do nothing
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onWarning).not.toHaveBeenCalled();

    // Now start it
    act(() => {
      result.current.start();
    });

    // Advance into warning zone
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.isWarning).toBe(true);
    expect(onWarning).toHaveBeenCalledOnce();
  });

  it('cleans up on unmount', () => {
    const onIdle = vi.fn();
    const { unmount } = renderHook(() =>
      useIdleTimeout({
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
        onIdle,
      })
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onIdle).not.toHaveBeenCalled();
  });
});
