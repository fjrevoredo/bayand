#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -ne 1 ]; then
  echo -e "${RED}Version number required.${NC}"
  echo "Usage: ./bump-version.sh <version>"
  exit 1
fi

NEW_VERSION="$1"

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Version must use X.Y.Z format.${NC}"
  exit 1
fi

echo -e "${YELLOW}Bumping Bayand to ${NEW_VERSION}...${NC}"

sed -i.bak -E "s/\"version\"[[:space:]]*:[[:space:]]*\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${NEW_VERSION}\"/" package.json
rm package.json.bak

sed -i.bak -E "s/\"version\"[[:space:]]*:[[:space:]]*\"[0-9]+\.[0-9]+\.[0-9]+\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json
rm src-tauri/tauri.conf.json.bak

sed -i.bak -E "s/^version[[:space:]]*=[[:space:]]*\"[0-9]+\.[0-9]+\.[0-9]+\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

(
  cd src-tauri
  cargo build --quiet 2>/dev/null || cargo check --quiet
)

echo
echo -e "${GREEN}Updated:${NC}"
echo "- package.json"
echo "- src-tauri/tauri.conf.json"
echo "- src-tauri/Cargo.toml"
echo "- src-tauri/Cargo.lock"
echo
echo "Review with:"
echo "  git diff package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock"
