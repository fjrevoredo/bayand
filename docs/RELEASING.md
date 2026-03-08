# Release Guide

This guide covers Bayand desktop releases.

## Pre-Release Checklist

- [ ] All intended changes are merged to the default branch
- [ ] `bun run lint`, `bun run format:check`, `bun run type-check`, `bun run test:run`, and `cargo test` pass
- [ ] `bun run diagrams:check` passes
- [ ] Release notes are prepared
- [ ] No known release-blocking issues remain

## Version Update

Update the version in the standard release files:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`

If documentation or screenshots mention the previous version, update them in the same release change.

## Tagging

Bayand releases are triggered from tags in the `vX.Y.Z` format.

Typical flow:

```bash
git checkout main
git pull
git checkout -b release-X.Y.Z

# update versions and docs
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json README.md docs
git commit -m "chore: release X.Y.Z"
git push origin release-X.Y.Z
```

After the release branch is reviewed and merged:

```bash
git checkout main
git pull
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

## Expected Release Outputs

The release workflow should produce Bayand-branded artifacts for:

- Windows `.exe`
- Windows `.msi`
- macOS `.dmg`
- Linux `.AppImage`
- Linux `.deb`

Typical naming:

- `Bayand-X.Y.Z-windows.exe`
- `Bayand-X.Y.Z-windows.msi`
- `Bayand-X.Y.Z-macos.dmg`
- `Bayand-X.Y.Z-linux.AppImage`
- `Bayand-X.Y.Z-linux.deb`

Checksums should be published with the artifacts.

## Post-Tag Checks

- Confirm the GitHub release draft contains all expected artifacts
- Confirm artifact names use Bayand branding
- Verify checksums were uploaded
- Perform platform smoke tests where possible
- Publish the release notes

## Troubleshooting

If the release workflow fails:

- confirm the tag format is correct
- confirm workflow permissions allow release creation
- confirm the bundle step produced artifacts for the expected platform
- confirm any artifact rename step still matches the current Tauri output names
