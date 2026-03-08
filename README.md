# Bayand

Bayand is a local-only, privacy-first desktop health tracker built with SolidJS, TypeScript, Tauri v2, Rust, and encrypted SQLite.

Bayand is intentionally narrow:

- One password-protected tracker per app data directory
- Multiple health records per day
- Structured logging for symptoms, medications, vitals, sleep, and wellbeing
- Optional rich-text notes stored as HTML
- Calendar navigation, idle auto-lock, local backups, statistics, and JSON export

It does not include sync, telemetry, plugins, imports, search, multiple journals, or network-backed features.

## Privacy Model

- Runtime use is local-only
- Health content is encrypted at rest
- Password-derived key material uses Argon2
- Record payloads are encrypted with AES-256-GCM
- Preferences are stored locally in `localStorage`
- Explicit JSON exports are plaintext by design and should be handled carefully

See [docs/PRIVACY.md](./docs/PRIVACY.md) for the full privacy summary.

## Stack

- Frontend: Bun, Vite, SolidJS, TypeScript, TipTap
- Backend: Tauri v2, Rust, rusqlite, serde
- Storage: `{app_data_dir}/bayand.db` and `{app_data_dir}/backups/`

## Development

Common commands:

```bash
bun run dev
bun run build
bun run lint
bun run format:check
bun run type-check
bun run test:run
cd src-tauri && cargo test
```

Diagram commands:

```bash
bun run diagrams
bun run diagrams:check
```

## Documentation

- [Privacy](./docs/PRIVACY.md)
- [Requirements](./docs/REQUIREMENTS.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Open Tasks](./docs/OPEN_TASKS.md)
- [Release Guide](./docs/RELEASING.md)
- [Diagram Workflow](./docs/diagrams/WORKFLOW.md)

The rewrite contract for this repository lives in [BAYAND_REWRITE.md](./BAYAND_REWRITE.md).
