# Script Notes

This directory contains repository scripts. The documentation here covers the diagram scripts that support the Bayand docs set.

## Diagram Rendering

Render all committed documentation diagrams:

```bash
bun run diagrams
```

This runs:

- Mermaid CLI for `context`, `unlock`, and `save-entry`
- D2 for `architecture`

Both light and dark variants are generated into `docs/diagrams/`.

## Diagram Verification

Verify that the expected generated SVGs exist:

```bash
bun run diagrams:check
```

The current check is intentionally conservative. It validates presence of the tracked outputs, not byte-for-byte equivalence.

## When To Run Them

- after editing any `.mmd` or `.d2` diagram source
- before opening a docs-focused pull request
- before cutting a release
