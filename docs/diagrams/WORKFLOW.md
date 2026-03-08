# Diagram Workflow

This folder contains the Bayand documentation diagrams.

## Diagram Set

Source files:

- `context.mmd`
- `context-dark.mmd`
- `unlock.mmd`
- `unlock-dark.mmd`
- `save-entry.mmd`
- `save-entry-dark.mmd`
- `architecture.d2`
- `architecture-dark.d2`

Generated outputs:

- `context.svg`
- `context-dark.svg`
- `unlock.svg`
- `unlock-dark.svg`
- `save-entry.svg`
- `save-entry-dark.svg`
- `architecture.svg`
- `architecture-dark.svg`

## Rules

- Edit the `.mmd` and `.d2` sources, not the SVGs
- Keep light and dark variants semantically identical
- Keep diagrams aligned with the current Bayand command surface and product scope
- Do not reintroduce donor concepts such as multiple journals, plugins, imports, search, or key-file auth
- Commit regenerated SVGs with the source changes

## Commands

Render diagrams:

```bash
bun run diagrams
```

Verify expected outputs:

```bash
bun run diagrams:check
```

## Review Checklist

Before committing diagram changes:

- confirm the diagram still matches the code
- confirm labels use Bayand terminology
- confirm v1 exclusions are not shown accidentally
- confirm both light and dark variants remain readable
- confirm the corresponding SVG output files are present
