import { Match, Switch, createEffect, onCleanup, onMount } from 'solid-js';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { authState, initializeAuth, lockTracker, setupAuthEventListeners } from './state/auth';
import { initializeTheme, setTheme } from './lib/theme';
import { createLogger } from './lib/logger';
import { preferences } from './state/preferences';
import { isAboutOpen, setIsAboutOpen } from './state/ui';
import PasswordCreation from './components/auth/PasswordCreation';
import PasswordPrompt from './components/auth/PasswordPrompt';
import MainLayout from './components/layout/MainLayout';
import AboutOverlay from './components/overlays/AboutOverlay';

const log = createLogger('App');

function App() {
  const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const { autoLockEnabled, autoLockTimeout } = preferences();
    const state = authState();

    if (!autoLockEnabled || state !== 'unlocked') return;

    function handleActivity() {
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void lockTracker(), autoLockTimeout * 1000);
    }

    handleActivity();
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }));

    onCleanup(() => {
      if (idleTimer !== null) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, handleActivity));
    });
  });

  onMount(() => {
    void initializeAuth();
    initializeTheme();
    setTheme(preferences().theme);

    let cleanupAuthListeners: (() => void) | undefined;
    void setupAuthEventListeners()
      .then((cleanup) => {
        cleanupAuthListeners = cleanup;
      })
      .catch((error) => {
        log.error('Failed to setup auth event listeners:', error);
      });

    let unlistenAbout: UnlistenFn | undefined;
    void listen('menu-about', () => setIsAboutOpen(true)).then((fn: UnlistenFn) => {
      unlistenAbout = fn;
    });

    onCleanup(() => {
      cleanupAuthListeners?.();
      unlistenAbout?.();
    });
  });

  return (
    <>
      <Switch>
        <Match when={authState() === 'checking'}>
          <div class="flex min-h-screen items-center justify-center bg-gray-50">
            <div class="text-center">
              <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p class="text-gray-600">Loading Bayand...</p>
            </div>
          </div>
        </Match>

        <Match when={authState() === 'no-tracker'}>
          <PasswordCreation />
        </Match>

        <Match when={authState() === 'locked'}>
          <PasswordPrompt />
        </Match>

        <Match when={authState() === 'unlocked'}>
          <MainLayout />
        </Match>
      </Switch>
      <AboutOverlay isOpen={isAboutOpen()} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}

export default App;
