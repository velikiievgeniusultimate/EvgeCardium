# EvgeCardium

[![Build EvgeCardium](https://github.com/velikiievgeniusultimate/EvgeCardium/actions/workflows/build.yml/badge.svg)](https://github.com/velikiievgeniusultimate/EvgeCardium/actions/workflows/build.yml)

An experimental Android card game whose APK is only a permanent loader. The playable game is
stored as a versioned web bundle and can be updated from GitHub without replacing
the APK.

## Prototype

Open `game/index.html` in a browser. The first build contains a complete short
battle against an AI opponent: draw cards, spend energy, summon units, attack,
use spells and defeat the enemy heroine.

## Android build

The loader is already pointed at the `velikiievgeniusultimate/EvgeCardium`
repository. The project has two distribution flavors:

- `devDebug` builds an installable prototype that accepts game bundles from GitHub.
- `playRelease` embeds the stable game and disables executable game updates.

Every successful `main` build publishes the development APK to the
`prototype-0.1.0` prerelease.

The bundled game is always available offline. On launch, the shell asks GitHub
for a channel manifest. If a newer bundle exists it downloads the ZIP, verifies
its SHA-256 hash, extracts it into an inactive slot, verifies the entry point and
atomically activates that slot. A broken update therefore cannot overwrite the
last working game.

## Publishing a content update

Run:

```bash
./tools/package-update.sh 2
```

Upload the resulting `dist/game-v2.zip`, copy its SHA-256 into
`channel/stable.json`, change the URL and increment `version`. Commit and push.
The installed app will pick it up on the next launch.

## Security rules

- Publish only HTTPS bundle URLs.
- Always publish the SHA-256 digest before changing the stable channel.
- Never put secrets inside the game bundle or APK.
- The ZIP extractor rejects path traversal and oversized archives.

## Status

Version `0.1` is deliberately disposable. It proves the updater and contains a
small playable battle; its rules, interface and art direction may all be
replaced later.
