# WinGet Publishing for Bayand

This document describes the Windows release contract used by Bayand’s WinGet automation.

## Release Contract

- Repository: `https://github.com/fjrevoredo/bayand`
- Release tags: `vX.Y.Z`
- Windows installer asset: `Bayand-X.Y.Z-windows.exe`
- WinGet package identifier: `fjrevoredo.Bayand`
- Workflow file: `.github/workflows/winget-publish.yml`

## Required Secret

Add `WINGET_TOKEN` to the repository’s GitHub Actions secrets. The workflow uses it to authenticate `wingetcreate` when submitting manifest updates to `microsoft/winget-pkgs`.

## One-Time Initial Submission

Before the workflow can update WinGet automatically, Bayand needs an initial manifest in the community repository.

Example:

```powershell
iwr https://aka.ms/wingetcreate/latest -OutFile wingetcreate.exe
.\wingetcreate.exe new `
  https://github.com/fjrevoredo/bayand/releases/download/v0.4.6/Bayand-0.4.6-windows.exe
```

Suggested metadata:

- `PackageIdentifier`: `fjrevoredo.Bayand`
- `PackageName`: `Bayand`
- `Publisher`: `fjrevoredo`
- `PackageVersion`: the stripped tag version such as `0.4.6`

## Automated Publish Flow

The workflow runs on published releases and on manual dispatch.

It will:

1. Resolve the release tag and stripped version.
2. Verify the expected Windows asset exists on the GitHub release.
3. Download `wingetcreate.exe`.
4. Run `wingetcreate update fjrevoredo.Bayand --version <version> --urls "<asset-url>|x64" --submit`.

## Manual Verification

After the workflow opens a pull request in `microsoft/winget-pkgs` and it is merged, verify:

```powershell
winget search Bayand
winget install fjrevoredo.Bayand
winget upgrade fjrevoredo.Bayand
```
