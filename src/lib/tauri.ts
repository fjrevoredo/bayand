import { invoke } from '@tauri-apps/api/core';

export interface SymptomLog {
  name: string;
  severity: number | null;
  time: string | null;
  tags: string[];
  note: string | null;
}

export interface MedicationLog {
  name: string;
  dose: number | null;
  unit: string | null;
  time: string | null;
  taken: boolean;
  note: string | null;
}

export interface Vitals {
  weight: number | null;
  temperature: number | null;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
}

export interface SleepSummary {
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality_score: number | null;
}

export interface WellbeingSummary {
  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
}

export interface HealthRecordPayload {
  title: string;
  notes_html: string;
  symptoms: SymptomLog[];
  medications: MedicationLog[];
  vitals: Vitals | null;
  sleep: SleepSummary | null;
  wellbeing: WellbeingSummary | null;
}

export interface HealthRecord extends HealthRecordPayload {
  id: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Statistics {
  total_records: number;
  records_this_week: number;
  best_streak: number;
  current_streak: number;
  days_with_symptoms: number;
  days_with_medications: number;
  avg_mood_score: number | null;
  avg_energy_score: number | null;
  avg_sleep_duration_minutes: number | null;
}

export interface ExportResult {
  records_exported: number;
  file_path: string;
}

export async function createTracker(password: string): Promise<void> {
  await invoke('create_tracker', { password });
}

export async function unlockTracker(password: string): Promise<void> {
  await invoke('unlock_tracker', { password });
}

export async function lockTracker(): Promise<void> {
  await invoke('lock_tracker');
}

export async function trackerExists(): Promise<boolean> {
  return invoke('tracker_exists');
}

export async function isTrackerUnlocked(): Promise<boolean> {
  return invoke('is_tracker_unlocked');
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await invoke('change_password', { oldPassword, newPassword });
}

export async function resetTracker(): Promise<void> {
  await invoke('reset_tracker');
}

export async function createRecord(date: string): Promise<HealthRecord> {
  return invoke('create_record', { date });
}

export async function saveRecord(id: number, payload: HealthRecordPayload): Promise<void> {
  await invoke('save_record', { id, payload });
}

export async function getRecordsForDate(date: string): Promise<HealthRecord[]> {
  return invoke('get_records_for_date', { date });
}

export async function deleteRecordIfEmpty(
  id: number,
  payload: HealthRecordPayload,
): Promise<boolean> {
  return invoke('delete_record_if_empty', { id, payload });
}

export async function deleteRecord(id: number): Promise<void> {
  await invoke('delete_record', { id });
}

export async function getAllRecordDates(): Promise<string[]> {
  return invoke('get_all_record_dates');
}

export async function navigatePreviousDay(currentDate: string): Promise<string> {
  return invoke('navigate_previous_day', { currentDate });
}

export async function navigateNextDay(currentDate: string): Promise<string> {
  return invoke('navigate_next_day', { currentDate });
}

export async function navigateToToday(): Promise<string> {
  return invoke('navigate_to_today');
}

export async function navigatePreviousMonth(currentDate: string): Promise<string> {
  return invoke('navigate_previous_month', { currentDate });
}

export async function navigateNextMonth(currentDate: string): Promise<string> {
  return invoke('navigate_next_month', { currentDate });
}

export async function getStatistics(): Promise<Statistics> {
  return invoke('get_statistics');
}

export async function exportJson(filePath: string): Promise<ExportResult> {
  return invoke('export_json', { filePath });
}
