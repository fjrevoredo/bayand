# Contributing to Bayand

Bayand is a local-only, privacy-first desktop health tracker built with SolidJS, Tauri v2, Rust, and encrypted SQLite.

## Prerequisites

- Rust stable with `clippy` and `rustfmt`
- Bun 1.x
- Tauri v2 system dependencies for your platform
- Linux packages: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`

## Getting Started

```bash
git clone https://github.com/fjrevoredo/bayand.git
cd bayand
bun install
bun run tauri dev
```

## Development Workflow

1. Create a feature branch from `master`.
2. Make changes in small, reviewable increments.
3. Run the checks before opening a pull request.
4. Open the pull request against `master`.

## Checks

Fast checks:

```bash
bun run check
```

Full local gate:

```bash
bun run pre-commit
```

Manual commands:

```bash
bun run lint
bun run format:check
bun run type-check
bun run test:run
bun run test:e2e:local

cd src-tauri
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

## Conventions

- SolidJS: do not destructure props; use `<Show>` and `<For>` for reactive control flow.
- Tests: render Solid components with `render(() => <Component />)`.
- Rust commands: return `Result<T, String>` and register in both `commands/mod.rs` and `lib.rs`.
- Dates: use `YYYY-MM-DD` everywhere.
- Naming: Rust uses `snake_case`; TypeScript uses `camelCase`; components use `PascalCase`.

## Security Rules

- Never log passwords, wrapped keys, plaintext notes, or decrypted health records.
- Never add runtime network activity.
- Never write plaintext health data to disk outside explicit JSON exports.
- Keep Bayand v1 single-tracker and password-only; do not reintroduce journals, key-file auth, plugins, imports, or search.

See [SECURITY.md](SECURITY.md) for the current disclosure path and threat model.
