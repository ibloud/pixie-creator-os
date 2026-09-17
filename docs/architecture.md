# PIXIE Creator OS — creator control-room architecture

## Product model

PIXIE Creator OS is a browser-native creator workstation for a social-network DJ. It treats the browser as the shell, not as a fake replacement for an operating system or DJ controller.

```text
CREATE
  ↓
PIXIE SESSION
  ├── LIBRARY       local + connected media
  ├── PLAYER        browser playback / external engine state
  ├── PROJECTS      Obsidian workspace
  ├── PUBLISH       plyr.fm adapter boundary
  ├── BROADCAST     live distribution adapter boundary
  ├── SOCIAL        AT Protocol identity + social activity
  ├── ROUTING       audio / MIDI / HID connection state
  └── SYSTEM        device and workstation status
```

## Identity and storage

The storage contract is intentionally independent of human filenames:

```text
human name / folder  → presentation
pixie_id              → identity
machine path          → implementation
```

A durable workspace object may be represented as:

```text
PIXIE/Objects/<pixie_id>.json
PIXIE/Assets/<pixie_id>.<ext>
PIXIE/Library/<human-readable-name>.md
```

Obsidian is the human-facing workspace and durable local control plane. Its Markdown notes can be renamed or reorganized without changing the PIXIE identity. Source-owned records remain authoritative at the source when that source provides a write path. A writable PDS can hold portable creator records when a source cannot.

Browser runtime state is deliberately non-canonical. IndexedDB is used only to retain the user's granted vault capability so a session can reconnect to the same workspace without treating browser storage as the user's content store.

## Storage adapters

### Obsidian / browser

Where File System Access is available, PIXIE requests a read/write vault directory, persists the directory handle in IndexedDB, and writes both machine-readable PIXIE JSON and human-readable Markdown. Permission is re-checked before writes.

### Native macOS / iOS

The native bridge is the capability boundary for a future WKWebView implementation. A native host can expose the same storage operations without changing the browser-facing object model. The native filesystem remains an asset plane; it does not replace PIXIE IDs.

### PDS

The PDS adapter is a fallback for portable creator records and interoperable identity. It should not silently become the canonical home for local project files or arbitrary large media unless the chosen PDS explicitly supports that data model and the user opts into it.

## Hardware boundary

Mixxx remains the hardware/DJ engine. The web UI can represent a connected controller, MIDI mapping, deck state, and routing, but should not claim browser access to arbitrary hardware until Web MIDI/HID/Audio capabilities and permission flows are actually available.

## Ubuntu Studio influence

The workstation is organized around production tasks rather than generic productivity apps: audio sources, recording, routing, MIDI, live output, project files, and publishing.

## Service boundaries

- **AT Protocol**: identity, public social records, and interoperable creator metadata.
- **plyr.fm**: audio publishing/playback adapter.
- **Streamplace**: live video adapter.
- **Germ**: private communications adapter.
- **External Mixxx**: actual DJ engine and hardware workflow.

No credentials are hard-coded in the prototype.
