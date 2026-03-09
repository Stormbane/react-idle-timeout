import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdleManager } from '../core/IdleManager';

describe('IdleManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createManager(
    overrides: Record<string, unknown> = {},
    callbacks: Record<string, unknown> = {}
  ) {
    const onStateChange = vi.fn();
    const onIdle = vi.fn();
    const onWarning = vi.fn();
    const onActive = vi.fn();

    const manager = new IdleManager(
      {
        timeout: 5000,
        warningDuration: 2000,
        crossTab: false,
        onIdle,
        onWarning,
        onActive,
        ...overrides,
      },
      { onStateChange, ...callbacks }
    );

    return { manager, onStateChange, onIdle, onWarning, onActive };
  }

  it('starts in stopped state', () => {
    const { manager } = createManager();
    expect(manager.getState()).toBe('stopped');
  });

  it('transitions to active on start', () => {
    const { manager, onStateChange } = createManager();
    manager.start();
    expect(manager.getState()).toBe('active');
    expect(onStateChange).toHaveBeenCalledWith('active', expect.any(Number));
    manager.destroy();
  });

  it('fires onWarning when warning period begins', () => {
    const { manager, onWarning } = createManager();
    manager.start();

    // Advance to warning time (timeout - warningDuration = 3000ms)
    vi.advanceTimersByTime(3000);
    expect(manager.getState()).toBe('warning');
    expect(onWarning).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('fires onIdle when timeout expires', () => {
    const { manager, onIdle } = createManager();
    manager.start();

    vi.advanceTimersByTime(5000);
    expect(manager.getState()).toBe('idle');
    expect(onIdle).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('resets the timer on reset()', () => {
    const { manager, onIdle } = createManager();
    manager.start();

    // Advance 4 seconds (past warning, near idle)
    vi.advanceTimersByTime(4000);
    expect(manager.getState()).toBe('warning');

    manager.reset();
    expect(manager.getState()).toBe('active');

    // Should not fire idle at original time
    vi.advanceTimersByTime(2000);
    expect(onIdle).not.toHaveBeenCalled();
    expect(manager.getState()).toBe('active');

    // Should fire at new timeout
    vi.advanceTimersByTime(3000);
    expect(onIdle).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('fires onActive when reset during warning', () => {
    const { manager, onActive } = createManager();
    manager.start();

    vi.advanceTimersByTime(3500); // in warning zone
    expect(manager.getState()).toBe('warning');

    manager.reset();
    expect(onActive).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('supports pause and resume', () => {
    const { manager, onIdle } = createManager();
    manager.start();

    vi.advanceTimersByTime(2000);
    manager.pause();
    expect(manager.getState()).toBe('paused');

    // Advance a long time while paused — should not fire
    vi.advanceTimersByTime(10000);
    expect(onIdle).not.toHaveBeenCalled();

    manager.resume();
    expect(manager.getState()).not.toBe('paused');

    // Should fire after remaining time
    vi.advanceTimersByTime(3000);
    expect(onIdle).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('does not start twice', () => {
    const { manager, onStateChange } = createManager();
    manager.start();
    const callCount = onStateChange.mock.calls.length;

    manager.start(); // second call should be no-op
    expect(onStateChange.mock.calls.length).toBe(callCount);
    manager.destroy();
  });

  it('works with warningDuration = 0 (no warning)', () => {
    const { manager, onWarning, onIdle } = createManager({
      warningDuration: 0,
    });
    manager.start();

    vi.advanceTimersByTime(5000);
    expect(onWarning).not.toHaveBeenCalled();
    expect(onIdle).toHaveBeenCalledOnce();
    manager.destroy();
  });

  it('cleans up on destroy', () => {
    const { manager } = createManager();
    manager.start();
    manager.destroy();
    expect(manager.getState()).toBe('stopped');
  });

  it('reports remaining time in ms', () => {
    const { manager } = createManager();
    manager.start();

    const remaining = manager.getRemainingMs();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(5000);
    manager.destroy();
  });
});
