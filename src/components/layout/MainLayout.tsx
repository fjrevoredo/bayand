import { onMount, onCleanup } from 'solid-js';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createLogger } from '../../lib/logger';
import Header from './Header';
import Sidebar from './Sidebar';
import RecordPanel from './RecordPanel';
import GoToDateOverlay from '../overlays/GoToDateOverlay';
import PreferencesOverlay from '../overlays/PreferencesOverlay';
import StatsOverlay from '../overlays/StatsOverlay';
import ExportOverlay from '../overlays/ExportOverlay';
import {
  selectedDate,
  setSelectedDate,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isGoToDateOpen,
  setIsGoToDateOpen,
  isPreferencesOpen,
  setIsPreferencesOpen,
  isStatsOpen,
  setIsStatsOpen,
  isExportOpen,
  setIsExportOpen,
  isAboutOpen,
} from '../../state/ui';
import {
  navigatePreviousDay,
  navigateNextDay,
  navigateToToday,
  navigatePreviousMonth,
  navigateNextMonth,
} from '../../lib/tauri';
import { preferences } from '../../state/preferences';
import { getTodayString } from '../../lib/dates';
import { lockTracker } from '../../state/auth';

const log = createLogger('MainLayout');

export default function MainLayout() {
  const unlisteners: UnlistenFn[] = [];

  const handleGlobalEsc = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (
      isGoToDateOpen() ||
      isPreferencesOpen() ||
      isStatsOpen() ||
      isExportOpen() ||
      isAboutOpen()
    ) {
      return;
    }
    if (preferences().escAction === 'quit') {
      void getCurrentWindow().close().catch((err) => log.error('Failed to close window:', err));
    }
  };

  onMount(async () => {
    document.addEventListener('keydown', handleGlobalEsc);

    unlisteners.push(
      await listen('menu-navigate-previous-day', async () => {
        setSelectedDate(await navigatePreviousDay(selectedDate()));
      }),
    );

    unlisteners.push(
      await listen('menu-navigate-next-day', async () => {
        const next = await navigateNextDay(selectedDate());
        const today = getTodayString();
        const finalDate = !preferences().allowFutureRecords && next > today ? today : next;
        setSelectedDate(finalDate);
      }),
    );

    unlisteners.push(
      await listen('menu-navigate-to-today', async () => {
        setSelectedDate(await navigateToToday());
      }),
    );

    unlisteners.push(await listen('menu-go-to-date', () => setIsGoToDateOpen(true)));
    unlisteners.push(await listen('menu-preferences', () => setIsPreferencesOpen(true)));
    unlisteners.push(await listen('menu-statistics', () => setIsStatsOpen(true)));
    unlisteners.push(await listen('menu-export', () => setIsExportOpen(true)));
    unlisteners.push(await listen('menu-lock', () => void lockTracker()));

    unlisteners.push(
      await listen('menu-navigate-previous-month', async () => {
        setSelectedDate(await navigatePreviousMonth(selectedDate()));
      }),
    );

    unlisteners.push(
      await listen('menu-navigate-next-month', async () => {
        const next = await navigateNextMonth(selectedDate());
        const today = getTodayString();
        const finalDate = !preferences().allowFutureRecords && next > today ? today : next;
        setSelectedDate(finalDate);
      }),
    );
  });

  onCleanup(() => {
    unlisteners.forEach((unlisten) => unlisten());
    document.removeEventListener('keydown', handleGlobalEsc);
  });

  return (
    <div class="flex h-screen overflow-hidden bg-secondary">
      <Sidebar isCollapsed={isSidebarCollapsed()} onClose={() => setIsSidebarCollapsed(true)} />

      <div class="flex flex-1 flex-col">
        <Header showMenu onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed())} />
        <main class="flex-1 overflow-hidden">
          <RecordPanel />
        </main>
      </div>

      <GoToDateOverlay />
      <PreferencesOverlay
        isOpen={isPreferencesOpen()}
        onClose={() => setIsPreferencesOpen(false)}
      />
      <StatsOverlay isOpen={isStatsOpen()} onClose={() => setIsStatsOpen(false)} />
      <ExportOverlay isOpen={isExportOpen()} onClose={() => setIsExportOpen(false)} />
    </div>
  );
}
