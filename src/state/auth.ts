import { createSignal } from 'solid-js';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import * as tauri from '../lib/tauri';
import { setRecordDates, executeCleanupCallbacks } from './records';
import { createLogger } from '../lib/logger';
import { mapTauriError } from '../lib/errors';
import { resetSessionState } from './session';

const log = createLogger('Auth');

export type AuthState = 'checking' | 'no-tracker' | 'locked' | 'unlocked';

const [authState, setAuthState] = createSignal<AuthState>('checking');
const [error, setError] = createSignal<string | null>(null);

export function resetAuthTransientState(): void {
  setError(null);
}

function resetForLockedSession(): void {
  resetSessionState();
  resetAuthTransientState();
  setAuthState('locked');
}

function prepareUnlockedSession(): void {
  resetSessionState();
  resetAuthTransientState();
  setAuthState('unlocked');
}

export async function refreshAuthState(): Promise<void> {
  try {
    const exists = await tauri.trackerExists();
    if (!exists) {
      resetSessionState();
      resetAuthTransientState();
      setAuthState('no-tracker');
      return;
    }

    const unlocked = await tauri.isTrackerUnlocked();
    if (unlocked) {
      setAuthState('unlocked');
    } else {
      resetForLockedSession();
    }
  } catch (err) {
    log.error('Failed to refresh auth state:', err);
    resetSessionState();
    setError('Failed to check tracker status');
    setAuthState('locked');
  }
}

export async function initializeAuth(): Promise<void> {
  await refreshAuthState();
}

export async function createTracker(password: string): Promise<void> {
  try {
    setError(null);
    await tauri.createTracker(password);
    prepareUnlockedSession();
    setRecordDates(await tauri.getAllRecordDates());
  } catch (err) {
    const message = mapTauriError(err);
    setError(message);
    throw new Error(message, { cause: err });
  }
}

export async function unlockTracker(password: string): Promise<void> {
  try {
    setError(null);
    await tauri.unlockTracker(password);
    prepareUnlockedSession();
    setRecordDates(await tauri.getAllRecordDates());
  } catch (err) {
    const message = mapTauriError(err);
    setError(message);
    throw new Error(message, { cause: err });
  }
}

export async function lockTracker(): Promise<void> {
  try {
    setError(null);
    await executeCleanupCallbacks();
    await tauri.lockTracker();
    resetForLockedSession();
  } catch (err) {
    const message = mapTauriError(err);
    setError(message);
    throw new Error(message, { cause: err });
  }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  try {
    setError(null);
    await tauri.changePassword(oldPassword, newPassword);
  } catch (err) {
    const message = mapTauriError(err);
    setError(message);
    throw new Error(message, { cause: err });
  }
}

export async function resetTracker(): Promise<void> {
  try {
    setError(null);
    await tauri.resetTracker();
    resetSessionState();
    setAuthState('no-tracker');
  } catch (err) {
    const message = mapTauriError(err);
    setError(message);
    throw new Error(message, { cause: err });
  }
}

export async function setupAuthEventListeners(): Promise<() => void> {
  const unlistenTrackerLocking: UnlistenFn = await listen<string>(
    'tracker-locking',
    async () => {
      await executeCleanupCallbacks();
    },
  );

  const unlistenTrackerLocked: UnlistenFn = await listen<{ reason?: string }>(
    'tracker-locked',
    () => {
      resetForLockedSession();
    },
  );

  return () => {
    unlistenTrackerLocking();
    unlistenTrackerLocked();
  };
}

export { authState, error };
