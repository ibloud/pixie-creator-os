# PIXIE Creator OS — Obsidian bridge

This plugin is the human-facing workspace adapter for PIXIE. It deliberately does **not** make filenames the identity of media or sessions.

## Identity model

- `pixie_id` is the stable PIXIE identity.
- Obsidian note titles and folders are presentation/navigation.
- Native filesystem paths are machine implementation details.
- Source-owned records remain authoritative at the connected source when that source is writable.
- Workspace-owned notes, sessions, setlists and project metadata are persisted in Obsidian.
- A writable PDS can be used as a fallback when a connected source is read-only.

The web app exposes the same contract through `storage-router.js` and can use the File System Access API where supported. A native WKWebView can replace that capability with a native implementation without changing the object model.

## Development

This directory is an intentionally small plugin skeleton. It is not yet a packaged community plugin. Build it with the standard Obsidian plugin toolchain and copy the resulting `main.js`, `manifest.json`, and optional styles into a vault's `.obsidian/plugins/pixie-creator-os/` directory.
