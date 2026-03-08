# Requirements

This document defines the Bayand v1 product boundary.

## Product Scope

- Bayand is a desktop-only, local-only health tracker
- Supported platforms: Windows, macOS, Linux
- Bayand manages one encrypted tracker per app data directory
- The only unlock method in v1 is a password

## Startup and Session States

The app must expose exactly these frontend auth states:

- `checking`
- `no-tracker`
- `locked`
- `unlocked`

The backend must reject record access unless the tracker is unlocked.

## Data Storage

Bayand stores data under the app data directory:

- `bayand.db`
- `backups/`

The primary records table must store:

- `id`
- `date`
- `payload`
- `created_at`
- `updated_at`

`date` is plaintext. `payload` is encrypted and contains:

- `title`
- `notes_html`
- `symptoms`
- `medications`
- `vitals`
- `sleep`
- `wellbeing`

## Security and Privacy

- Health data must be encrypted at rest
- Password-derived key material must use Argon2
- Record payloads must use AES-256-GCM
- Sensitive in-memory state must be cleared on lock
- Passwords and encryption keys must never be logged
- Runtime operation must not require network access

## Record Behavior

- Multiple records per day are supported
- Users can create a record for a selected date
- Users can edit structured sections and optional notes
- Notes are stored as HTML
- Saves are automatic and debounced
- Empty records may be removed automatically through the delete-if-empty flow

Required structured sections:

- Symptoms
- Medications / Supplements
- Vitals
- Sleep
- Wellbeing
- Notes

## Navigation

The app must support:

- previous day
- next day
- today
- previous month
- next month
- go to date

Calendar indicators must show which dates contain records.

## Preferences

Preferences are frontend-only and must live in `localStorage`.

Required preference fields:

- `allowFutureRecords`
- `firstDayOfWeek`
- `hideTitles`
- `enableSpellcheck`
- `theme`
- `autoLockEnabled`
- `autoLockTimeout`
- `advancedToolbar`
- `escAction`

## Statistics

Bayand v1 statistics must include:

- `total_records`
- `records_this_week`
- `best_streak`
- `current_streak`
- `days_with_symptoms`
- `days_with_medications`
- `avg_mood_score`
- `avg_energy_score`
- `avg_sleep_duration_minutes`

Average values must be `null` when no data exists.

## Export

- Bayand v1 supports JSON export only
- Export must contain metadata plus all decrypted records
- Export files are user-directed plaintext output

## Backups

- A backup should be created after successful unlock
- Backups remain local to the machine
- Backup rotation should limit retained copies

## Explicit Non-Goals For v1

- Multiple journals or profile switching
- Key files or alternate auth methods
- Search
- Imports
- Markdown export
- PDF export
- Plugins or scripting
- Attachments and embedded media
- Cloud sync or collaboration
