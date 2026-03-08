# CLAUDE.md — Bayand

Bayand is a local-only, privacy-first desktop health tracker.

- single password-only tracker
- encrypted `bayand.db`
- local `backups/`
- multiple records per day
- structured health data + HTML notes
- statistics and JSON export
- no journals, key files, imports, plugins, search, attachments, sync, or website app surface

## Working Rules

- Treat `BAYAND_REWRITE.md` and `docs/REQUIREMENTS.md` as the source of truth for scope
- Keep `src/lib/tauri.ts` exactly aligned with the registered Rust commands
- Keep frontend state limited to `auth.ts`, `records.ts`, `ui.ts`, `preferences.ts`, and `session.ts`
- Keep preferences in `localStorage`
- Keep runtime behavior local-only
- Do not reintroduce donor concepts for convenience

## Important Paths

Frontend:

- `src/App.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/RecordPanel.tsx`
- `src/components/editor/NotesEditor.tsx`
- `src/state/*.ts`
- `src/lib/tauri.ts`

Backend:

- `src-tauri/src/lib.rs`
- `src-tauri/src/commands/`
- `src-tauri/src/db/`
- `src-tauri/src/crypto/`
- `src-tauri/src/backup.rs`
- `src-tauri/src/menu.rs`

Docs:

- `README.md`
- `docs/PRIVACY.md`
- `docs/REQUIREMENTS.md`
- `docs/USER_GUIDE.md`
- `docs/RELEASING.md`
- `docs/diagrams/`

## Verification

Use these as the normal local checks:

```bash
bun run test:run
bun run type-check
cd src-tauri && cargo test --lib
cd src-tauri && cargo check
```

E2E:

```bash
bun run test:e2e
bun run test:e2e:stateful
bun run test:e2e:local
```

## Non-Negotiables

- No plaintext health data on disk outside explicit exports
- No runtime network access
- No multi-tracker registry
- No key-file auth
- No import/export plugin system
- No search subsystem
- No diary/journal terminology in current product docs or interfaces

If a change affects architecture, command names, testing, or contributor-facing behavior, update this file and `AGENTS.md` in the same patch.
