/**
 * Maps raw Tauri/Rust error strings to user-friendly messages.
 * Prevents filesystem paths and system internals from leaking into the UI.
 */
export function mapTauriError(err: unknown): string {
  const raw = typeof err === 'string' ? err : err instanceof Error ? err.message : String(err);

  // Auth errors — safe to pass through, already user-friendly
  if (/wrong password|invalid password|incorrect password/i.test(raw)) {
    return 'Incorrect password.';
  }
  if (/cannot decrypt|decryption failed|failed to decrypt/i.test(raw)) {
    return 'Could not decrypt the tracker data.';
  }
  if (/tracker (must be|is not) unlocked/i.test(raw)) {
    return 'Please unlock your tracker first.';
  }
  if (/failed to (read|write|create|copy|open)/i.test(raw) || /os error \d+/i.test(raw)) {
    return 'A file operation failed. Check that you have the necessary permissions.';
  }
  if (/rusqlite|sqlite|argon2/i.test(raw)) {
    return 'An internal error occurred.';
  }

  // If no sensitive patterns found, pass the message through as-is
  if (!(/[/\\]/.test(raw) || /os error/i.test(raw))) {
    return raw;
  }

  return 'An unexpected error occurred.';
}
