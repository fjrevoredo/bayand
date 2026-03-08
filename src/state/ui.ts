import { createSignal } from 'solid-js';
import { getTodayString } from '../lib/dates';

const [selectedDate, setSelectedDate] = createSignal<string>(getTodayString());
const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal(true);
const [isGoToDateOpen, setIsGoToDateOpen] = createSignal(false);
const [isPreferencesOpen, setIsPreferencesOpen] = createSignal(false);
const [isStatsOpen, setIsStatsOpen] = createSignal(false);
const [isExportOpen, setIsExportOpen] = createSignal(false);
const [isAboutOpen, setIsAboutOpen] = createSignal(false);

export function resetUiState(): void {
  setSelectedDate(getTodayString());
  setIsSidebarCollapsed(true);
  setIsGoToDateOpen(false);
  setIsPreferencesOpen(false);
  setIsStatsOpen(false);
  setIsExportOpen(false);
  setIsAboutOpen(false);
}

export {
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
  setIsAboutOpen,
};
