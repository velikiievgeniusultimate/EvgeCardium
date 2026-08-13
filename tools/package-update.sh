#!/usr/bin/env bash
set -euo pipefail
version="${1:?usage: package-update.sh VERSION}"
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$project_dir/dist"
archive="$project_dir/dist/game-v${version}.zip"
(cd "$project_dir/game" && zip -qr "$archive" . -x 'assets/*.png')
sha256sum "$archive"
