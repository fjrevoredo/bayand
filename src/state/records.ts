import { createSignal } from 'solid-js';
import type { HealthRecord, HealthRecordPayload } from '../lib/tauri';

const [currentRecord, setCurrentRecord] = createSignal<HealthRecord | null>(null);
const [dayRecords, setDayRecords] = createSignal<HealthRecord[]>([]);
const [recordDates, setRecordDates] = createSignal<string[]>([]);
const [isLoading, setIsLoading] = createSignal(false);
const [isSaving, setIsSaving] = createSignal(false);

const [cleanupCallbacks, setCleanupCallbacks] = createSignal<(() => void | Promise<void>)[]>([]);

export function createEmptyPayload(): HealthRecordPayload {
  return {
    title: '',
    notes_html: '',
    symptoms: [],
    medications: [],
    vitals: null,
    sleep: null,
    wellbeing: null,
  };
}

export function payloadFromRecord(record: HealthRecord | null): HealthRecordPayload {
  if (!record) return createEmptyPayload();
  return {
    title: record.title,
    notes_html: record.notes_html,
    symptoms: record.symptoms,
    medications: record.medications,
    vitals: record.vitals,
    sleep: record.sleep,
    wellbeing: record.wellbeing,
  };
}

export function resetRecordsState(): void {
  setCurrentRecord(null);
  setDayRecords([]);
  setRecordDates([]);
  setIsLoading(false);
  setIsSaving(false);
  setCleanupCallbacks([]);
}

export function registerCleanupCallback(callback: () => void | Promise<void>): () => void {
  setCleanupCallbacks((prev: (() => void | Promise<void>)[]) => [...prev, callback]);
  return () =>
    setCleanupCallbacks((prev: (() => void | Promise<void>)[]) =>
      prev.filter((cb) => cb !== callback),
    );
}

export async function executeCleanupCallbacks(): Promise<void> {
  for (const callback of cleanupCallbacks()) {
    await callback();
  }
}

export {
  currentRecord,
  setCurrentRecord,
  dayRecords,
  setDayRecords,
  recordDates,
  setRecordDates,
  isLoading,
  setIsLoading,
  isSaving,
  setIsSaving,
};
