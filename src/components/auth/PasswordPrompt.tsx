import { createSignal, Show } from 'solid-js';
import { error, unlockTracker } from '../../state/auth';

export default function PasswordPrompt() {
  const [password, setPassword] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (isSubmitting()) return;
    setIsSubmitting(true);
    try {
      await unlockTracker(password());
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div class="w-full max-w-md rounded-2xl border border-primary bg-primary p-8 shadow-xl">
        <div class="mb-3 flex justify-center">
          <img src="/logo-transparent.svg" alt="Bayand" class="h-24 w-24 rounded-xl" />
        </div>
        <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-tertiary">Bayand</p>
        <h1 class="mb-3 text-3xl font-semibold text-primary">Unlock Bayand</h1>
        <p class="mb-6 text-sm text-secondary">
          Unlock your encrypted local health tracker with your password.
        </p>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              data-testid="password-unlock-input"
              value={password()}
              onInput={(event) => setPassword(event.currentTarget.value)}
              class="w-full rounded-md border border-primary bg-primary px-3 py-2 text-primary"
              autocomplete="current-password"
            />
          </div>

          <Show when={error()}>
            <p class="text-sm text-error">{error()}</p>
          </Show>

          <button
            type="submit"
            data-testid="unlock-tracker-button"
            disabled={isSubmitting()}
            class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {isSubmitting() ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
