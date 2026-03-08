import { render, waitFor } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainLayout from './MainLayout';
import {
  isPreferencesOpen,
  resetUiState,
  selectedDate,
  setSelectedDate,
} from '../../state/ui';
import { resetPreferences } from '../../state/preferences';

const {
  eventHandlers,
  listenMock,
  navigatePreviousDayMock,
  navigateNextDayMock,
  navigateToTodayMock,
  navigatePreviousMonthMock,
  navigateNextMonthMock,
  lockTrackerMock,
  closeMock,
} = vi.hoisted(() => {
  const eventHandlers = new Map<string, () => void | Promise<void>>();

  return {
    eventHandlers,
    listenMock: vi.fn(async (event: string, callback: () => void | Promise<void>) => {
      eventHandlers.set(event, callback);
      return () => {
        eventHandlers.delete(event);
      };
    }),
    navigatePreviousDayMock: vi.fn(async () => '2026-03-05'),
    navigateNextDayMock: vi.fn(async () => '2026-03-09'),
    navigateToTodayMock: vi.fn(async () => '2026-03-08'),
    navigatePreviousMonthMock: vi.fn(async () => '2026-02-08'),
    navigateNextMonthMock: vi.fn(async () => '2026-04-08'),
    lockTrackerMock: vi.fn(async () => {}),
    closeMock: vi.fn(async () => {}),
  };
});

vi.mock('@tauri-apps/api/event', () => ({
  listen: listenMock,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: closeMock,
  }),
}));

vi.mock('../../lib/tauri', () => ({
  navigatePreviousDay: navigatePreviousDayMock,
  navigateNextDay: navigateNextDayMock,
  navigateToToday: navigateToTodayMock,
  navigatePreviousMonth: navigatePreviousMonthMock,
  navigateNextMonth: navigateNextMonthMock,
}));

vi.mock('../../state/auth', () => ({
  lockTracker: lockTrackerMock,
}));

vi.mock('./Header', () => ({
  default: () => <div data-testid="header-stub" />,
}));

vi.mock('./Sidebar', () => ({
  default: () => <div data-testid="sidebar-stub" />,
}));

vi.mock('./RecordPanel', () => ({
  default: () => <div data-testid="record-panel-stub" />,
}));

vi.mock('../overlays/GoToDateOverlay', () => ({
  default: () => <div data-testid="goto-overlay-stub" />,
}));

vi.mock('../overlays/PreferencesOverlay', () => ({
  default: (props: { isOpen: boolean }) => (
    <div data-testid="preferences-overlay-state">{String(props.isOpen)}</div>
  ),
}));

vi.mock('../overlays/StatsOverlay', () => ({
  default: () => <div data-testid="stats-overlay-stub" />,
}));

vi.mock('../overlays/ExportOverlay', () => ({
  default: () => <div data-testid="export-overlay-stub" />,
}));

describe('MainLayout', () => {
  beforeEach(() => {
    eventHandlers.clear();
    listenMock.mockClear();
    navigatePreviousDayMock.mockClear();
    navigateNextDayMock.mockClear();
    navigateToTodayMock.mockClear();
    navigatePreviousMonthMock.mockClear();
    navigateNextMonthMock.mockClear();
    lockTrackerMock.mockClear();
    closeMock.mockClear();
    resetUiState();
    resetPreferences();
    setSelectedDate('2026-03-08');
  });

  it('updates the selected date when the previous-day menu event fires', async () => {
    render(() => <MainLayout />);

    await waitFor(() => {
      expect(eventHandlers.has('menu-navigate-previous-day')).toBe(true);
    });

    await eventHandlers.get('menu-navigate-previous-day')?.();

    await waitFor(() => {
      expect(navigatePreviousDayMock).toHaveBeenCalledWith('2026-03-08');
      expect(selectedDate()).toBe('2026-03-05');
    });
  });

  it('opens the preferences overlay when the menu event fires', async () => {
    render(() => <MainLayout />);

    await waitFor(() => {
      expect(eventHandlers.has('menu-preferences')).toBe(true);
    });

    await eventHandlers.get('menu-preferences')?.();

    await waitFor(() => {
      expect(isPreferencesOpen()).toBe(true);
    });
  });
});
