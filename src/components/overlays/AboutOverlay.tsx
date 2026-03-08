import { Dialog } from '@kobalte/core/dialog';
import { getVersion } from '@tauri-apps/api/app';
import { createEffect, createSignal, Show } from 'solid-js';
import { X } from 'lucide-solid';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutOverlay(props: AboutOverlayProps) {
  const [version, setVersion] = createSignal('');

  createEffect(() => {
    if (props.isOpen) {
      void getVersion().then(setVersion).catch(() => setVersion(''));
    }
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
            class="w-full max-w-sm rounded-lg bg-primary p-6"
            style={{ 'box-shadow': 'var(--shadow-lg)' }}
          >
            <div class="mb-6 flex items-center justify-between">
              <Dialog.Title class="text-lg font-semibold text-primary">About</Dialog.Title>
              <Dialog.CloseButton class="rounded-md p-1 hover:bg-hover" aria-label="Close">
                <X size={20} class="text-tertiary" />
              </Dialog.CloseButton>
            </div>

            <div class="mb-6 flex flex-col items-center gap-3">
              <img src="/logo-transparent.svg" alt="Bayand" class="h-16 w-16 rounded-xl" />
              <div class="text-center">
                <p class="text-xl font-bold text-primary">Bayand</p>
                <Show when={version()}>
                  <p class="text-sm text-secondary">Version {version()}</p>
                </Show>
              </div>
            </div>

            <p class="mb-6 text-center text-sm text-secondary">
              Local-only encrypted health tracking with no telemetry, no sync, and no background
              network activity.
            </p>

            <div class="space-y-1 border-t border-primary pt-4 text-sm text-secondary">
              <p>MIT License</p>
              <p>Copyright &copy; 2026 Francisco J. Revoredo</p>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
