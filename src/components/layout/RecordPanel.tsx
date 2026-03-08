import { confirm } from '@tauri-apps/plugin-dialog';
import { Editor } from '@tiptap/core';
import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import {
  createRecord,
  deleteRecord,
  deleteRecordIfEmpty,
  getAllRecordDates,
  getRecordsForDate,
  saveRecord,
  type HealthRecord,
  type HealthRecordPayload,
  type MedicationLog,
  type SymptomLog,
} from '../../lib/tauri';
import { debounce } from '../../lib/debounce';
import { createLogger } from '../../lib/logger';
import { preferences } from '../../state/preferences';
import {
  dayRecords,
  isSaving,
  registerCleanupCallback,
  setCurrentRecord,
  setDayRecords,
  setIsSaving,
  setRecordDates,
} from '../../state/records';
import { selectedDate } from '../../state/ui';
import NotesEditor from '../editor/NotesEditor';
import RecordNavigator from '../editor/RecordNavigator';
import RecordTitle from '../editor/RecordTitle';

const log = createLogger('RecordPanel');

function emptyPayload(): HealthRecordPayload {
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

function recordToPayload(record: HealthRecord): HealthRecordPayload {
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

function payloadIsEmpty(payload: HealthRecordPayload, editor: Editor | null): boolean {
  const notesEmpty = editor ? editor.isEmpty || editor.getText().trim() === '' : payload.notes_html.trim() === '';
  const vitalsEmpty =
    payload.vitals === null ||
    Object.values(payload.vitals).every((value) => value === null);
  const sleepEmpty =
    payload.sleep === null || Object.values(payload.sleep).every((value) => value === null);
  const wellbeingEmpty =
    payload.wellbeing === null || Object.values(payload.wellbeing).every((value) => value === null);

  return (
    payload.title.trim() === '' &&
    notesEmpty &&
    payload.symptoms.length === 0 &&
    payload.medications.length === 0 &&
    vitalsEmpty &&
    sleepEmpty &&
    wellbeingEmpty
  );
}

function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function RecordPanel() {
  const [draft, setDraft] = createSignal<HealthRecordPayload>(emptyPayload());
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [pendingRecordId, setPendingRecordId] = createSignal<number | null>(null);
  const [_isLoadingRecord, setIsLoadingRecord] = createSignal(false);
  const [isCreatingRecord, setIsCreatingRecord] = createSignal(false);
  const [editorInstance, setEditorInstance] = createSignal<Editor | null>(null);

  let isDisposed = false;
  let loadRequestId = 0;
  let saveRequestId = 0;

  const fetchRecordsOrdered = async (date: string): Promise<HealthRecord[]> => {
    const records = await getRecordsForDate(date);
    return records.slice().reverse();
  };

  const refreshRecordDates = async () => {
    setRecordDates(await getAllRecordDates());
  };

  const saveCurrentById = async (recordId: number, payload: HealthRecordPayload) => {
    if (isDisposed) return;
    const requestId = ++saveRequestId;

    if (payloadIsEmpty(payload, editorInstance())) {
      try {
        await deleteRecordIfEmpty(recordId, payload);
        if (isDisposed || requestId !== saveRequestId) return;
        setDayRecords(dayRecords().filter((record) => record.id !== recordId));
        setCurrentRecord(null);
        setPendingRecordId(null);
        setDraft(emptyPayload());
        await refreshRecordDates();
      } catch (error) {
        log.error('Failed to delete empty record:', error);
      }
      return;
    }

    try {
      setIsSaving(true);
      await saveRecord(recordId, payload);
      if (isDisposed || requestId !== saveRequestId) return;
      await refreshRecordDates();
    } catch (error) {
      log.error('Failed to save record:', error);
    } finally {
      if (!isDisposed && requestId === saveRequestId) {
        setIsSaving(false);
      }
    }
  };

  const debouncedSave = debounce((recordId: number, payload: HealthRecordPayload) => {
    void saveCurrentById(recordId, payload);
  }, 500);

  const loadRecordsForDate = async (date: string) => {
    const requestId = ++loadRequestId;
    setIsLoadingRecord(true);

    try {
      const records = await fetchRecordsOrdered(date);
      if (isDisposed || requestId !== loadRequestId) return;

      setDayRecords(records);
      if (records.length === 0) {
        setCurrentIndex(0);
        setCurrentRecord(null);
        setPendingRecordId(null);
        setDraft(emptyPayload());
        return;
      }

      const index = records.length - 1;
      const record = records[index];
      setCurrentIndex(index);
      setCurrentRecord(record);
      setPendingRecordId(record.id);
      setDraft(recordToPayload(record));
    } catch (error) {
      log.error('Failed to load records:', error);
    } finally {
      if (!isDisposed && requestId === loadRequestId) {
        setIsLoadingRecord(false);
      }
    }
  };

  const persistDraft = (nextPayload: HealthRecordPayload) => {
    setDraft(nextPayload);
    const recordId = pendingRecordId();
    if (recordId !== null) {
      debouncedSave(recordId, nextPayload);
      return;
    }

    if (payloadIsEmpty(nextPayload, editorInstance()) || isCreatingRecord()) {
      return;
    }

    setIsCreatingRecord(true);
    void (async () => {
      try {
        const record = await createRecord(selectedDate());
        if (isDisposed) return;
        setPendingRecordId(record.id);
        setCurrentRecord(record);
        setDayRecords(await fetchRecordsOrdered(selectedDate()));
        debouncedSave(record.id, nextPayload);
      } catch (error) {
        log.error('Failed to create record:', error);
      } finally {
        setIsCreatingRecord(false);
      }
    })();
  };

  const updateSymptom = (index: number, updates: Partial<SymptomLog>) => {
    persistDraft({
      ...draft(),
      symptoms: draft().symptoms.map((symptom, symptomIndex) =>
        symptomIndex === index ? { ...symptom, ...updates } : symptom,
      ),
    });
  };

  const updateMedication = (index: number, updates: Partial<MedicationLog>) => {
    persistDraft({
      ...draft(),
      medications: draft().medications.map((medication, medicationIndex) =>
        medicationIndex === index ? { ...medication, ...updates } : medication,
      ),
    });
  };

  const navigateToRecord = async (newIndex: number) => {
    const recordId = pendingRecordId();
    if (recordId !== null) {
      debouncedSave.cancel();
      await saveCurrentById(recordId, draft());
    }

    const records = dayRecords();
    if (newIndex < 0 || newIndex >= records.length) return;

    const refreshed = await fetchRecordsOrdered(selectedDate());
    if (isDisposed) return;
    setDayRecords(refreshed);

    const index = Math.min(newIndex, refreshed.length - 1);
    if (index < 0) {
      setCurrentIndex(0);
      setCurrentRecord(null);
      setPendingRecordId(null);
      setDraft(emptyPayload());
      return;
    }

    const record = refreshed[index];
    setCurrentIndex(index);
    setCurrentRecord(record);
    setPendingRecordId(record.id);
    setDraft(recordToPayload(record));
  };

  const addRecord = async () => {
    if (isCreatingRecord()) return;
    if (pendingRecordId() === null || payloadIsEmpty(draft(), editorInstance())) return;

    setIsCreatingRecord(true);
    try {
      const recordId = pendingRecordId();
      if (recordId !== null) {
        debouncedSave.cancel();
        await saveCurrentById(recordId, draft());
      }

      const newRecord = await createRecord(selectedDate());
      if (isDisposed) return;

      const refreshed = await fetchRecordsOrdered(selectedDate());
      const nextIndex = refreshed.findIndex((record) => record.id === newRecord.id);
      setDayRecords(refreshed);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
      setCurrentRecord(newRecord);
      setPendingRecordId(newRecord.id);
      setDraft(emptyPayload());
      debouncedSave.cancel();
      await refreshRecordDates();
    } catch (error) {
      log.error('Failed to add record:', error);
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (dayRecords().length <= 1) return;
    const confirmed = await confirm('Delete this health record?', {
      title: 'Delete Record',
      kind: 'warning',
    });
    if (!confirmed) return;

    const record = dayRecords()[currentIndex()];
    if (!record) return;

    try {
      await deleteRecord(record.id);
      const refreshed = await fetchRecordsOrdered(selectedDate());
      setDayRecords(refreshed);

      if (refreshed.length === 0) {
        setCurrentIndex(0);
        setCurrentRecord(null);
        setPendingRecordId(null);
        setDraft(emptyPayload());
      } else {
        const nextIndex = Math.min(currentIndex(), refreshed.length - 1);
        const nextRecord = refreshed[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentRecord(nextRecord);
        setPendingRecordId(nextRecord.id);
        setDraft(recordToPayload(nextRecord));
      }

      await refreshRecordDates();
    } catch (error) {
      log.error('Failed to delete record:', error);
    }
  };

  createEffect(() => {
    void loadRecordsForDate(selectedDate());
  });

  onMount(() => {
    const unregister = registerCleanupCallback(async () => {
      const recordId = pendingRecordId();
      if (recordId !== null) {
        await saveCurrentById(recordId, draft());
      }
    });

    onCleanup(() => {
      isDisposed = true;
      loadRequestId += 1;
      saveRequestId += 1;
      debouncedSave.cancel();
      unregister();
    });
  });

  return (
    <div class="flex h-full flex-col">
      <RecordNavigator
        total={dayRecords().length}
        index={currentIndex()}
        onPrev={() => void navigateToRecord(currentIndex() - 1)}
        onNext={() => void navigateToRecord(currentIndex() + 1)}
        onAdd={() => void addRecord()}
        addDisabled={isCreatingRecord() || payloadIsEmpty(draft(), editorInstance())}
        addTitle="Add another record for this day"
        onDelete={() => void handleDeleteRecord()}
        deleteDisabled={isCreatingRecord() || dayRecords().length <= 1}
        deleteTitle="Delete record"
      />

      <div class="flex-1 overflow-y-auto p-6">
        <div class="mx-auto w-full max-w-4xl space-y-6">
          <Show when={!preferences().hideTitles}>
            <RecordTitle
              value={draft().title}
              onInput={(value) => persistDraft({ ...draft(), title: value })}
              placeholder="Record title"
              spellCheck={preferences().enableSpellcheck}
            />
          </Show>

          <section class="rounded-lg border border-primary bg-primary p-4">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-secondary">Symptoms</h2>
              <button
                onClick={() =>
                  persistDraft({
                    ...draft(),
                    symptoms: [
                      ...draft().symptoms,
                      { name: '', severity: null, time: null, tags: [], note: null },
                    ],
                  })
                }
                class="rounded bg-tertiary px-2 py-1 text-sm text-secondary hover:bg-hover"
              >
                Add symptom
              </button>
            </div>
            <div class="space-y-3">
              <For each={draft().symptoms}>
                {(symptom, index) => (
                  <div class="grid gap-2 rounded border border-primary p-3 md:grid-cols-4">
                    <input
                      type="text"
                      value={symptom.name}
                      onInput={(event) => updateSymptom(index(), { name: event.currentTarget.value })}
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                      placeholder="Symptom"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={symptom.severity ?? ''}
                      onInput={(event) =>
                        updateSymptom(index(), { severity: parseNumber(event.currentTarget.value) })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                      placeholder="Severity"
                    />
                    <input
                      type="time"
                      value={symptom.time ?? ''}
                      onInput={(event) => updateSymptom(index(), { time: event.currentTarget.value || null })}
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    />
                    <button
                      onClick={() =>
                        persistDraft({
                          ...draft(),
                          symptoms: draft().symptoms.filter((_, symptomIndex) => symptomIndex !== index()),
                        })
                      }
                      class="rounded border border-primary px-3 py-2 text-sm text-secondary hover:bg-hover"
                    >
                      Remove
                    </button>
                    <input
                      type="text"
                      value={symptom.tags.join(', ')}
                      onInput={(event) =>
                        updateSymptom(index(), {
                          tags: event.currentTarget.value
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary md:col-span-2"
                      placeholder="Tags"
                    />
                    <input
                      type="text"
                      value={symptom.note ?? ''}
                      onInput={(event) => updateSymptom(index(), { note: event.currentTarget.value || null })}
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary md:col-span-2"
                      placeholder="Note"
                    />
                  </div>
                )}
              </For>
              <Show when={draft().symptoms.length === 0}>
                <p class="text-sm text-tertiary">No symptoms logged for this record.</p>
              </Show>
            </div>
          </section>

          <section class="rounded-lg border border-primary bg-primary p-4">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-secondary">
                Medications / Supplements
              </h2>
              <button
                onClick={() =>
                  persistDraft({
                    ...draft(),
                    medications: [
                      ...draft().medications,
                      { name: '', dose: null, unit: null, time: null, taken: true, note: null },
                    ],
                  })
                }
                class="rounded bg-tertiary px-2 py-1 text-sm text-secondary hover:bg-hover"
              >
                Add medication
              </button>
            </div>
            <div class="space-y-3">
              <For each={draft().medications}>
                {(medication, index) => (
                  <div class="grid gap-2 rounded border border-primary p-3 md:grid-cols-4">
                    <input
                      type="text"
                      value={medication.name}
                      onInput={(event) =>
                        updateMedication(index(), { name: event.currentTarget.value })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                      placeholder="Medication"
                    />
                    <input
                      type="number"
                      value={medication.dose ?? ''}
                      onInput={(event) =>
                        updateMedication(index(), { dose: parseNumber(event.currentTarget.value) })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                      placeholder="Dose"
                    />
                    <input
                      type="text"
                      value={medication.unit ?? ''}
                      onInput={(event) =>
                        updateMedication(index(), { unit: event.currentTarget.value || null })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                      placeholder="Unit"
                    />
                    <button
                      onClick={() =>
                        persistDraft({
                          ...draft(),
                          medications: draft().medications.filter(
                            (_, medicationIndex) => medicationIndex !== index(),
                          ),
                        })
                      }
                      class="rounded border border-primary px-3 py-2 text-sm text-secondary hover:bg-hover"
                    >
                      Remove
                    </button>
                    <input
                      type="time"
                      value={medication.time ?? ''}
                      onInput={(event) =>
                        updateMedication(index(), { time: event.currentTarget.value || null })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    />
                    <label class="flex items-center gap-2 rounded border border-primary px-3 py-2 text-sm text-secondary">
                      <input
                        type="checkbox"
                        checked={medication.taken}
                        onChange={(event) =>
                          updateMedication(index(), { taken: event.currentTarget.checked })
                        }
                      />
                      Taken
                    </label>
                    <input
                      type="text"
                      value={medication.note ?? ''}
                      onInput={(event) =>
                        updateMedication(index(), { note: event.currentTarget.value || null })
                      }
                      class="rounded border border-primary bg-secondary px-3 py-2 text-primary md:col-span-2"
                      placeholder="Note"
                    />
                  </div>
                )}
              </For>
              <Show when={draft().medications.length === 0}>
                <p class="text-sm text-tertiary">No medications logged for this record.</p>
              </Show>
            </div>
          </section>

          <section class="grid gap-4 md:grid-cols-2">
            <div class="rounded-lg border border-primary bg-primary p-4">
              <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Vitals</h2>
              <div class="grid gap-2">
                <input
                  type="number"
                  value={draft().vitals?.weight ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      vitals: {
                        weight: parseNumber(event.currentTarget.value),
                        temperature: draft().vitals?.temperature ?? null,
                        heart_rate: draft().vitals?.heart_rate ?? null,
                        blood_pressure_systolic: draft().vitals?.blood_pressure_systolic ?? null,
                        blood_pressure_diastolic: draft().vitals?.blood_pressure_diastolic ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  placeholder="Weight"
                />
                <input
                  type="number"
                  value={draft().vitals?.temperature ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      vitals: {
                        weight: draft().vitals?.weight ?? null,
                        temperature: parseNumber(event.currentTarget.value),
                        heart_rate: draft().vitals?.heart_rate ?? null,
                        blood_pressure_systolic: draft().vitals?.blood_pressure_systolic ?? null,
                        blood_pressure_diastolic: draft().vitals?.blood_pressure_diastolic ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  placeholder="Temperature"
                />
                <input
                  type="number"
                  value={draft().vitals?.heart_rate ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      vitals: {
                        weight: draft().vitals?.weight ?? null,
                        temperature: draft().vitals?.temperature ?? null,
                        heart_rate: parseNumber(event.currentTarget.value),
                        blood_pressure_systolic: draft().vitals?.blood_pressure_systolic ?? null,
                        blood_pressure_diastolic: draft().vitals?.blood_pressure_diastolic ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  placeholder="Heart rate"
                />
                <div class="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={draft().vitals?.blood_pressure_systolic ?? ''}
                    onInput={(event) =>
                      persistDraft({
                        ...draft(),
                        vitals: {
                          weight: draft().vitals?.weight ?? null,
                          temperature: draft().vitals?.temperature ?? null,
                          heart_rate: draft().vitals?.heart_rate ?? null,
                          blood_pressure_systolic: parseNumber(event.currentTarget.value),
                          blood_pressure_diastolic: draft().vitals?.blood_pressure_diastolic ?? null,
                        },
                      })
                    }
                    class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    placeholder="Systolic"
                  />
                  <input
                    type="number"
                    value={draft().vitals?.blood_pressure_diastolic ?? ''}
                    onInput={(event) =>
                      persistDraft({
                        ...draft(),
                        vitals: {
                          weight: draft().vitals?.weight ?? null,
                          temperature: draft().vitals?.temperature ?? null,
                          heart_rate: draft().vitals?.heart_rate ?? null,
                          blood_pressure_systolic: draft().vitals?.blood_pressure_systolic ?? null,
                          blood_pressure_diastolic: parseNumber(event.currentTarget.value),
                        },
                      })
                    }
                    class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    placeholder="Diastolic"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-primary bg-primary p-4">
              <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Sleep</h2>
              <div class="grid gap-2">
                <input
                  type="time"
                  value={draft().sleep?.bedtime ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      sleep: {
                        bedtime: event.currentTarget.value || null,
                        wake_time: draft().sleep?.wake_time ?? null,
                        duration_minutes: draft().sleep?.duration_minutes ?? null,
                        quality_score: draft().sleep?.quality_score ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                />
                <input
                  type="time"
                  value={draft().sleep?.wake_time ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      sleep: {
                        bedtime: draft().sleep?.bedtime ?? null,
                        wake_time: event.currentTarget.value || null,
                        duration_minutes: draft().sleep?.duration_minutes ?? null,
                        quality_score: draft().sleep?.quality_score ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                />
                <input
                  type="number"
                  value={draft().sleep?.duration_minutes ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      sleep: {
                        bedtime: draft().sleep?.bedtime ?? null,
                        wake_time: draft().sleep?.wake_time ?? null,
                        duration_minutes: parseNumber(event.currentTarget.value),
                        quality_score: draft().sleep?.quality_score ?? null,
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  placeholder="Duration in minutes"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={draft().sleep?.quality_score ?? ''}
                  onInput={(event) =>
                    persistDraft({
                      ...draft(),
                      sleep: {
                        bedtime: draft().sleep?.bedtime ?? null,
                        wake_time: draft().sleep?.wake_time ?? null,
                        duration_minutes: draft().sleep?.duration_minutes ?? null,
                        quality_score: parseNumber(event.currentTarget.value),
                      },
                    })
                  }
                  class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  placeholder="Quality score"
                />
              </div>
            </div>
          </section>

          <section class="rounded-lg border border-primary bg-primary p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Wellbeing</h2>
            <div class="grid gap-2 md:grid-cols-3">
              <input
                type="number"
                min="1"
                max="10"
                value={draft().wellbeing?.mood_score ?? ''}
                onInput={(event) =>
                  persistDraft({
                    ...draft(),
                    wellbeing: {
                      mood_score: parseNumber(event.currentTarget.value),
                      energy_score: draft().wellbeing?.energy_score ?? null,
                      stress_score: draft().wellbeing?.stress_score ?? null,
                    },
                  })
                }
                class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                placeholder="Mood"
              />
              <input
                type="number"
                min="1"
                max="10"
                value={draft().wellbeing?.energy_score ?? ''}
                onInput={(event) =>
                  persistDraft({
                    ...draft(),
                    wellbeing: {
                      mood_score: draft().wellbeing?.mood_score ?? null,
                      energy_score: parseNumber(event.currentTarget.value),
                      stress_score: draft().wellbeing?.stress_score ?? null,
                    },
                  })
                }
                class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                placeholder="Energy"
              />
              <input
                type="number"
                min="1"
                max="10"
                value={draft().wellbeing?.stress_score ?? ''}
                onInput={(event) =>
                  persistDraft({
                    ...draft(),
                    wellbeing: {
                      mood_score: draft().wellbeing?.mood_score ?? null,
                      energy_score: draft().wellbeing?.energy_score ?? null,
                      stress_score: parseNumber(event.currentTarget.value),
                    },
                  })
                }
                class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                placeholder="Stress"
              />
            </div>
          </section>

          <section class="rounded-lg border border-primary bg-primary p-4">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Notes</h2>
            <NotesEditor
              content={draft().notes_html}
              onUpdate={(notes_html) => persistDraft({ ...draft(), notes_html })}
              placeholder="Optional notes"
              onEditorReady={setEditorInstance}
              spellCheck={preferences().enableSpellcheck}
            />
          </section>
        </div>
      </div>

      <div class="border-t border-primary bg-tertiary px-6 py-2">
        <div class="flex items-center justify-between">
          <p class="text-sm text-secondary">
            {_isLoadingRecord()
              ? 'Loading records...'
              : pendingRecordId() !== null
                ? 'Editing health record'
                : 'No records for this day yet'}
          </p>
          {isSaving() && <p class="text-sm text-tertiary">Saving...</p>}
        </div>
      </div>
    </div>
  );
}
