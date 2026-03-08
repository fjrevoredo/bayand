#!/usr/bin/env pwsh
#requires -version 5.1

param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "${Red}Version must use X.Y.Z format.${Reset}"
    exit 1
}

Write-Host "${Yellow}Bumping Bayand to $Version...${Reset}"

$packageJsonPath = "package.json"
$packageJson = Get-Content $packageJsonPath -Raw
$packageJson = $packageJson -replace '"version":\s*"\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Set-Content -Path $packageJsonPath -Value $packageJson -NoNewline

$tauriConfigPath = "src-tauri\tauri.conf.json"
$tauriConfig = Get-Content $tauriConfigPath -Raw
$tauriConfig = $tauriConfig -replace '"version":\s*"\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Set-Content -Path $tauriConfigPath -Value $tauriConfig -NoNewline

$cargoTomlPath = "src-tauri\Cargo.toml"
$cargoToml = Get-Content $cargoTomlPath -Raw
$cargoToml = $cargoToml -replace '(?m)^version\s*=\s*"\d+\.\d+\.\d+"', "version = `"$Version`""
Set-Content -Path $cargoTomlPath -Value $cargoToml -NoNewline

Push-Location src-tauri
$null = cargo build --quiet 2>$null
if (-not $?) {
    $null = cargo check --quiet 2>$null
}
Pop-Location

Write-Host ""
Write-Host "${Green}Updated:${Reset}"
Write-Host "- package.json"
Write-Host "- src-tauri\tauri.conf.json"
Write-Host "- src-tauri\Cargo.toml"
Write-Host "- src-tauri\Cargo.lock"
Write-Host ""
Write-Host "Review with:"
Write-Host "  git diff package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock"
