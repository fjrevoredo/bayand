import { Dialog } from '@kobalte/core/dialog';
import { save } from '@tauri-apps/plugin-dialog';
import { createSignal, Show } from 'solid-js';
import { FileDown, X } from 'lucide-solid';
import { exportJson, type ExportResult } from '../../lib/tauri';

interface ExportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportOverlay(props: ExportOverlayProps) {
  const [result, setResult] = createSignal<ExportResult | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [exporting, setExporting] = createSignal(false);

  const handleExport = async () => {
    setResult(null);
    setError(null);
    setExporting(true);

    try {
      const path = await save({
        defaultPath: 'bayand-export.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (!path) return;
      setResult(await exportJson(path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          setResult(null);
          props.onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          class="fixed inset-0 z-50"
          style={{ 'background-color': 'var(--overlay-bg)' }}
        />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            class="w-full max-w-md rounded-lg bg-primary p-6"
            style={{ 'box-shadow': 'var(--shadow-lg)' }}
          >
            <div class="mb-4 flex items-center justify-between">
              <Dialog.Title class="text-lg font-semibold text-primary">Export JSON</Dialog.Title>
              <Dialog.CloseButton class="rounded-md p-1 hover:bg-hover" aria-label="Close">
                <X size={20} class="text-tertiary" />
              </Dialog.CloseButton>
            </div>

            <p class="mb-4 text-sm text-secondary">
              Exported files contain decrypted health data. Store them in a secure location.
            </p>

            <Show when={error()}>
              <p class="mb-4 text-sm text-error">{error()}</p>
            </Show>

            <Show when={result()}>
              {(result) => (
                <div class="mb-4 rounded border border-primary p-3 text-sm text-secondary">
                  Exported {result().records_exported} records to {result().file_path}
                </div>
              )}
            </Show>

            <div class="flex justify-end gap-3">
              <button
                onClick={() => props.onClose()}
                class="rounded px-4 py-2 text-sm text-secondary hover:bg-hover"
              >
                Close
              </button>
              <button
                onClick={() => void handleExport()}
                disabled={exporting()}
                class="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FileDown size={16} />
                {exporting() ? 'Exporting...' : 'Export JSON'}
              </button>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
