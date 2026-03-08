# Privacy

Bayand is designed to keep health data on the local machine.

## What Bayand Stores

- `bayand.db`: encrypted health record content plus password-wrapping metadata
- `backups/`: local backup copies of `bayand.db`
- Browser `localStorage`: non-sensitive UI preferences only
- Optional JSON export files created by the user

## What Bayand Does Not Do

- No telemetry
- No analytics
- No crash reporting service
- No sync
- No account system
- No background network access
- No runtime update checks

## Encryption

- A random master key encrypts record payloads with AES-256-GCM
- The password unlock path derives wrapping key material with Argon2
- `date` remains plaintext in the database so calendar navigation works
- Structured record content is stored inside an encrypted JSON payload

## Plaintext Boundaries

Bayand avoids writing plaintext health data to disk during normal operation.

Known plaintext boundaries:

- In-memory UI state while the tracker is unlocked
- Explicit JSON exports requested by the user
- User-controlled clipboard contents if copied from the app

## Preferences

Preferences are stored locally in `localStorage` and include:

- theme
- first day of week
- allow future records
- hide titles
- spellcheck
- auto-lock settings
- toolbar mode
- escape-key behavior

## Backups

Bayand creates local database backups after a successful unlock. Backups contain encrypted database content, not decrypted record payloads.

## Passwords

Bayand does not provide password recovery. If the password is lost, the encrypted tracker cannot be recovered.
