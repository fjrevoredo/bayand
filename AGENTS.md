# AGENTS.md — Bayand

Bayand is a local-only, privacy-first desktop health tracker built with SolidJS, TypeScript, Tauri v2, Rust, and encrypted SQLite.

This repository is the Bayand rewrite described in `BAYAND_REWRITE.md`. 

## Product Boundary

- One password-protected tracker per app data directory
- One encrypted database: `{app_data_dir}/bayand.db`
- Local backups: `{app_data_dir}/backups/`
- Multiple health records per day
- Structured sections: symptoms, medications, vitals, sleep, wellbeing, notes
- JSON export only
- No sync, telemetry, plugins, imports, search, attachments, or key-file auth

## Architecture

Visual references:

- `docs/diagrams/context.mmd`
- `docs/diagrams/unlock.mmd`
- `docs/diagrams/save-entry.mmd`
- `docs/diagrams/architecture.d2`

Current high-level layers:

```text
SolidJS UI
  -> src/state/{auth,records,ui,preferences,session}.ts
  -> src/lib/tauri.ts
  -> Tauri invoke/listen boundary
  -> Rust commands/auth/db/crypto/backup/export/menu
  -> bayand.db + backups/ + localStorage preferences
```

## Frontend Structure

Key files:

- `src/App.tsx`
- `src/lib/tauri.ts`
- `src/state/auth.ts`
- `src/state/records.ts`
- `src/state/ui.ts`
- `src/state/preferences.ts`
- `src/state/session.ts`
- `src/components/auth/PasswordCreation.tsx`
- `src/components/auth/PasswordPrompt.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/RecordPanel.tsx`
- `src/components/editor/NotesEditor.tsx`
- `src/components/overlays/{PreferencesOverlay,StatsOverlay,ExportOverlay,AboutOverlay,GoToDateOverlay}.tsx`

## Backend Structure

Key files:

- `src-tauri/src/lib.rs`
- `src-tauri/src/menu.rs`
- `src-tauri/src/backup.rs`
- `src-tauri/src/screen_lock.rs`
- `src-tauri/src/commands/auth/auth_core.rs`
- `src-tauri/src/commands/records.rs`
- `src-tauri/src/commands/navigation.rs`
- `src-tauri/src/commands/stats.rs`
- `src-tauri/src/commands/export.rs`
- `src-tauri/src/db/schema.rs`
- `src-tauri/src/db/queries.rs`
- `src-tauri/src/crypto/{cipher,password}.rs`

## Tauri Command Surface

Auth:

- `create_tracker`
- `unlock_tracker`
- `lock_tracker`
- `tracker_exists`
- `is_tracker_unlocked`
- `change_password`
- `reset_tracker`

Records:

- `create_record`
- `save_record`
- `get_records_for_date`
- `delete_record_if_empty`
- `delete_record`
- `get_all_record_dates`

Navigation / stats / export:

- `navigate_previous_day`
- `navigate_next_day`
- `navigate_to_today`
- `navigate_previous_month`
- `navigate_next_month`
- `get_statistics`
- `export_json`

Frontend wrappers in `src/lib/tauri.ts` must stay aligned with this surface.

## Key Invariants

- All persisted health content except `date` is encrypted at rest
- `date` remains plaintext for calendar navigation
- Backend record commands require unlocked state
- Locking clears unlocked state and sensitive in-memory material
- Preferences stay in `localStorage`, not in the database
- Bayand remains single-tracker and password-only for v1
- Do not add runtime network activity
- Do not write plaintext health data to disk outside explicit JSON export

## Testing

Frontend:

- `bun run test:run`
- `bun run type-check`

Backend:

- `cd src-tauri && cargo test --lib`
- `cd src-tauri && cargo check`

E2E:

- `bun run test:e2e`
- `bun run test:e2e:stateful`
- `bun run test:e2e:local`

Current Bayand-focused frontend tests live in:

- `src/components/auth/PasswordCreation.test.tsx`
- `src/components/auth/PasswordPrompt.test.tsx`
- `src/components/layout/MainLayout.test.tsx`

## Release / Repo Docs

- `README.md`
- `docs/PRIVACY.md`
- `docs/REQUIREMENTS.md`
- `docs/USER_GUIDE.md`
- `docs/RELEASING.md`
- `WINGET.md`
- `.github/workflows/`

Keep those docs consistent with the actual Bayand product boundary. If implementation changes, update the docs in the same change.
