import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TabSync } from '../core/TabSync';

describe('TabSync', () => {
  let sync: TabSync;
  const onRemoteActivity = vi.fn();
  const onRemoteLogout = vi.fn();

  beforeEach(() => {
    sync = new TabSync({
      prefix: 'test',
      storageThrottle: 100,
      onRemoteActivity,
      onRemoteLogout,
    });
  });

  afterEach(() => {
    sync.destroy();
  });

  it('becomes leader when Web Locks is unavailable', () => {
    // jsdom doesn't have navigator.locks
    sync.start();
    expect(sync.isLeader).toBe(true);
  });

  it('writes activity to localStorage', () => {
    sync.start();
    const logoutAt = Date.now() + 60000;
    sync.writeActivity(logoutAt, true);

    expect(localStorage.getItem('test:lastActivity')).toBeTruthy();
    expect(localStorage.getItem('test:logoutAt')).toBe(logoutAt.toString());
  });

  it('throttles storage writes', () => {
    sync.start();
    const logoutAt = Date.now() + 60000;

    sync.writeActivity(logoutAt, true); // forced
    const firstWrite = localStorage.getItem('test:lastActivity');

    sync.writeActivity(logoutAt + 1000); // throttled — should not write
    expect(localStorage.getItem('test:lastActivity')).toBe(firstWrite);
  });

  it('reads logoutAt from localStorage', () => {
    const logoutAt = Date.now() + 60000;
    localStorage.setItem('test:logoutAt', logoutAt.toString());

    expect(sync.readLogoutAt()).toBe(logoutAt);
  });

  it('returns null for missing logoutAt', () => {
    expect(sync.readLogoutAt()).toBeNull();
  });

  it('signals logout and wins race', () => {
    sync.start();
    const result = sync.signalLogout();
    expect(result).toBe(true);
    expect(localStorage.getItem('test:logoutInProgress')).toBeTruthy();
  });

  it('does not signal logout if already in progress', () => {
    localStorage.setItem('test:logoutInProgress', 'other-tab');
    sync.start();
    const result = sync.signalLogout();
    expect(result).toBe(false);
  });

  it('clears storage on clearStorage()', () => {
    sync.start();
    sync.writeActivity(Date.now() + 60000, true);
    sync.clearStorage();

    expect(localStorage.getItem('test:lastActivity')).toBeNull();
    expect(localStorage.getItem('test:logoutAt')).toBeNull();
    expect(localStorage.getItem('test:logoutInProgress')).toBeNull();
  });

  it('calls onRemoteActivity on storage event for lastActivity', () => {
    sync.start();

    // Simulate storage event from another tab
    const event = new StorageEvent('storage', {
      key: 'test:lastActivity',
      newValue: Date.now().toString(),
    });
    window.dispatchEvent(event);

    expect(onRemoteActivity).toHaveBeenCalledOnce();
  });

  it('calls onRemoteLogout on storage event for logoutInProgress', () => {
    sync.start();

    const event = new StorageEvent('storage', {
      key: 'test:logoutInProgress',
      newValue: 'other-tab-id',
    });
    window.dispatchEvent(event);

    expect(onRemoteLogout).toHaveBeenCalledOnce();
  });

  it('stops listening after destroy', () => {
    // Use a fresh callback to isolate from other tests
    const freshOnRemoteActivity = vi.fn();
    const freshSync = new TabSync({
      prefix: 'test-destroy',
      storageThrottle: 100,
      onRemoteActivity: freshOnRemoteActivity,
      onRemoteLogout: vi.fn(),
    });

    freshSync.start();
    freshSync.destroy();

    const event = new StorageEvent('storage', {
      key: 'test-destroy:lastActivity',
      newValue: Date.now().toString(),
    });
    window.dispatchEvent(event);

    expect(freshOnRemoteActivity).not.toHaveBeenCalled();
  });
});
