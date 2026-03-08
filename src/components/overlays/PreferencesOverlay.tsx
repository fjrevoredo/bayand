import { Dialog } from '@kobalte/core/dialog';
import { createSignal, Show } from 'solid-js';
import { X } from 'lucide-solid';
import { changePassword, resetTracker } from '../../state/auth';
import { preferences, setPreferences } from '../../state/preferences';
import { createLogger } from '../../lib/logger';

interface PreferencesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const log = createLogger('Preferences');

export default function PreferencesOverlay(props: PreferencesOverlayProps) {
  const [oldPassword, setOldPassword] = createSignal('');
  const [newPassword, setNewPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [passwordMessage, setPasswordMessage] = createSignal<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) props.onClose();
  };

  const handlePasswordChange = async () => {
    setPasswordMessage(null);
    if (!oldPassword() || !newPassword() || !confirmPassword()) {
      setPasswordMessage('All password fields are required.');
      return;
    }

    if (newPassword() !== confirmPassword()) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    try {
      await changePassword(oldPassword(), newPassword());
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm('Reset Bayand and permanently delete the encrypted tracker?');
    if (!confirmed) return;

    try {
      await resetTracker();
      props.onClose();
    } catch (error) {
      log.error('Failed to reset tracker:', error);
      setPasswordMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          class="fixed inset-0 z-50"
          style={{ 'background-color': 'var(--overlay-bg)' }}
        />
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            class="w-full max-w-2xl rounded-lg bg-primary p-6"
            style={{ 'box-shadow': 'var(--shadow-lg)' }}
          >
            <div class="mb-6 flex items-center justify-between">
              <Dialog.Title class="text-lg font-semibold text-primary">Preferences</Dialog.Title>
              <Dialog.CloseButton class="rounded-md p-1 hover:bg-hover" aria-label="Close">
                <X size={20} class="text-tertiary" />
              </Dialog.CloseButton>
            </div>

            <div class="space-y-8">
              <section class="grid gap-4 md:grid-cols-2">
                <label class="flex items-center justify-between gap-4 rounded border border-primary p-3">
                  <span class="text-sm text-secondary">Allow future records</span>
                  <input
                    type="checkbox"
                    checked={preferences().allowFutureRecords}
                    onChange={(event) =>
                      setPreferences({ allowFutureRecords: event.currentTarget.checked })
                    }
                  />
                </label>

                <label class="flex items-center justify-between gap-4 rounded border border-primary p-3">
                  <span class="text-sm text-secondary">Hide record titles</span>
                  <input
                    type="checkbox"
                    checked={preferences().hideTitles}
                    onChange={(event) => setPreferences({ hideTitles: event.currentTarget.checked })}
                  />
                </label>

                <label class="flex items-center justify-between gap-4 rounded border border-primary p-3">
                  <span class="text-sm text-secondary">Enable spellcheck</span>
                  <input
                    type="checkbox"
                    checked={preferences().enableSpellcheck}
                    onChange={(event) =>
                      setPreferences({ enableSpellcheck: event.currentTarget.checked })
                    }
                  />
                </label>

                <label class="flex items-center justify-between gap-4 rounded border border-primary p-3">
                  <span class="text-sm text-secondary">Advanced toolbar</span>
                  <input
                    type="checkbox"
                    checked={preferences().advancedToolbar}
                    onChange={(event) =>
                      setPreferences({ advancedToolbar: event.currentTarget.checked })
                    }
                  />
                </label>

                <label class="rounded border border-primary p-3">
                  <span class="mb-2 block text-sm text-secondary">Theme</span>
                  <select
                    value={preferences().theme}
                    onChange={(event) =>
                      setPreferences({
                        theme: event.currentTarget.value as 'auto' | 'light' | 'dark',
                      })
                    }
                    class="w-full rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  >
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>

                <label class="rounded border border-primary p-3">
                  <span class="mb-2 block text-sm text-secondary">First day of week</span>
                  <select
                    value={preferences().firstDayOfWeek ?? ''}
                    onChange={(event) =>
                      setPreferences({
                        firstDayOfWeek:
                          event.currentTarget.value === ''
                            ? null
                            : Number(event.currentTarget.value),
                      })
                    }
                    class="w-full rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  >
                    <option value="">System default</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </label>

                <label class="rounded border border-primary p-3">
                  <span class="mb-2 block text-sm text-secondary">Escape key action</span>
                  <select
                    value={preferences().escAction}
                    onChange={(event) =>
                      setPreferences({ escAction: event.currentTarget.value as 'none' | 'quit' })
                    }
                    class="w-full rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  >
                    <option value="none">Do nothing</option>
                    <option value="quit">Quit app</option>
                  </select>
                </label>

                <label class="rounded border border-primary p-3">
                  <span class="mb-2 block text-sm text-secondary">Auto-lock timeout (seconds)</span>
                  <input
                    type="number"
                    min="1"
                    max="86400"
                    value={preferences().autoLockTimeout}
                    onInput={(event) =>
                      setPreferences({ autoLockTimeout: Number(event.currentTarget.value) || 300 })
                    }
                    class="w-full rounded border border-primary bg-secondary px-3 py-2 text-primary"
                  />
                  <label class="mt-2 flex items-center gap-2 text-sm text-secondary">
                    <input
                      type="checkbox"
                      checked={preferences().autoLockEnabled}
                      onChange={(event) =>
                        setPreferences({ autoLockEnabled: event.currentTarget.checked })
                      }
                    />
                    Enable idle auto-lock
                  </label>
                </label>
              </section>

              <section class="rounded border border-primary p-4">
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
                  Change Password
                </h3>
                <div class="grid gap-3 md:grid-cols-3">
                  <input
                    type="password"
                    value={oldPassword()}
                    onInput={(event) => setOldPassword(event.currentTarget.value)}
                    class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={newPassword()}
                    onInput={(event) => setNewPassword(event.currentTarget.value)}
                    class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    placeholder="New password"
                  />
                  <input
                    type="password"
                    value={confirmPassword()}
                    onInput={(event) => setConfirmPassword(event.currentTarget.value)}
                    class="rounded border border-primary bg-secondary px-3 py-2 text-primary"
                    placeholder="Repeat new password"
                  />
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <Show when={passwordMessage()}>
                    <p class="text-sm text-secondary">{passwordMessage()}</p>
                  </Show>
                  <button
                    onClick={() => void handlePasswordChange()}
                    class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Update password
                  </button>
                </div>
              </section>

              <section class="rounded border border-red-300 p-4">
                <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-red-700">
                  Danger Zone
                </h3>
                <p class="mb-3 text-sm text-secondary">
                  Resetting Bayand permanently deletes the encrypted tracker database and local
                  backups.
                </p>
                <button
                  onClick={() => void handleReset()}
                  class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Reset tracker
                </button>
              </section>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
