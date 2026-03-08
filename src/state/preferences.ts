import { createSignal } from 'solid-js';
import { createLogger } from '../lib/logger';
import { setTheme, type ThemePreference } from '../lib/theme';

const log = createLogger('Preferences');

export type EscAction = 'none' | 'quit';

export interface Preferences {
  allowFutureRecords: boolean;
  firstDayOfWeek: number | null;
  hideTitles: boolean;
  enableSpellcheck: boolean;
  theme: ThemePreference;
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  advancedToolbar: boolean;
  escAction: EscAction;
}

const DEFAULT_PREFERENCES: Preferences = {
  allowFutureRecords: false,
  firstDayOfWeek: null,
  hideTitles: false,
  enableSpellcheck: true,
  theme: 'auto',
  autoLockEnabled: false,
  autoLockTimeout: 300,
  advancedToolbar: false,
  escAction: 'none',
};

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem('preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    log.warn('Failed to load preferences:', error);
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: Preferences): void {
  try {
    localStorage.setItem('preferences', JSON.stringify(prefs));
  } catch (error) {
    log.warn('Failed to save preferences:', error);
  }
}

const [preferences, setPreferencesSignal] = createSignal<Preferences>(loadPreferences());

export function setPreferences(updates: Partial<Preferences>): void {
  setPreferencesSignal((prev: Preferences) => {
    const updated = { ...prev, ...updates };
    savePreferences(updated);
    if (updates.theme) {
      setTheme(updates.theme);
    }
    return updated;
  });
}

export function resetPreferences(): void {
  savePreferences(DEFAULT_PREFERENCES);
  setTheme(DEFAULT_PREFERENCES.theme);
  setPreferencesSignal(DEFAULT_PREFERENCES);
}

export { preferences };
