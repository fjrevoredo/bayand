import { Dialog } from '@kobalte/core/dialog';
import { createEffect, createSignal, Show } from 'solid-js';
import { X } from 'lucide-solid';
import { getStatistics, type Statistics } from '../../lib/tauri';

interface StatsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatMaybe(value: number | null, decimals = 1): string {
  if (value === null) return 'No data';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : decimals,
    maximumFractionDigits: decimals,
  });
}

export default function StatsOverlay(props: StatsOverlayProps) {
  const [stats, setStats] = createSignal<Statistics | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  createEffect(() => {
    if (!props.isOpen) return;
    void getStatistics()
      .then((result) => {
        setStats(result);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load statistics'));
  });

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          class="fixed inset-0 z-50"
          style={{ 'background-color': 'var(--overlay-bg)' }}
        />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            class="w-full max-w-lg rounded-lg bg-primary p-6"
            style={{ 'box-shadow': 'var(--shadow-lg)' }}
          >
            <div class="mb-4 flex items-center justify-between">
              <Dialog.Title class="text-lg font-semibold text-primary">Statistics</Dialog.Title>
              <Dialog.CloseButton class="rounded-md p-1 hover:bg-hover" aria-label="Close">
                <X size={20} class="text-tertiary" />
              </Dialog.CloseButton>
            </div>

            <Show when={error()}>
              <p class="mb-4 text-sm text-error">{error()}</p>
            </Show>

            <Show when={stats()}>
              {(stats) => (
                <div class="grid gap-3">
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Total records</span>
                    <span class="font-semibold text-primary">{stats().total_records}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Records this week</span>
                    <span class="font-semibold text-primary">{stats().records_this_week}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Best streak</span>
                    <span class="font-semibold text-primary">{stats().best_streak}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Current streak</span>
                    <span class="font-semibold text-primary">{stats().current_streak}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Days with symptoms</span>
                    <span class="font-semibold text-primary">{stats().days_with_symptoms}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Days with medications</span>
                    <span class="font-semibold text-primary">{stats().days_with_medications}</span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Average mood score</span>
                    <span class="font-semibold text-primary">
                      {formatMaybe(stats().avg_mood_score)}
                    </span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Average energy score</span>
                    <span class="font-semibold text-primary">
                      {formatMaybe(stats().avg_energy_score)}
                    </span>
                  </div>
                  <div class="flex justify-between rounded border border-primary p-3">
                    <span class="text-secondary">Average sleep duration</span>
                    <span class="font-semibold text-primary">
                      {formatMaybe(stats().avg_sleep_duration_minutes)} min
                    </span>
                  </div>
                </div>
              )}
            </Show>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
