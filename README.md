# PIXIE Creator OS

A browser-native DJ and creator workstation inspired by Aether OS and Ubuntu Studio, with AT Protocol as the social/identity layer.

## Direction

PIXIE Creator OS is designed for a social-network DJ: prepare sets, manage a crate, publish audio through plyr.fm, connect social identity through AT Protocol, monitor live/stream state, and keep hardware/audio routing visible.

### Product ownership

PIXIE Creator OS is a Loptr Lab / Dominique Devereaux product. Charlie J is not the owner or creator of PIXIE. A producer PIXIE may approach for hire is a separate proposed creative engagement; participation, endorsement, ownership, or approval is not implied by this repository.

### Integrations

- **AT Protocol** — identity, social records, and interoperable creator data.
- **plyr.fm** — ATProto-native audio publishing and playback target.
- **Mixxx** — external DJ engine/hardware workflow. Browser UI does not pretend to be a hardware driver.
- **Ubuntu Studio** — inspiration for a workflow-oriented creator workstation: audio, MIDI, routing, recording, and live production.
- **Streamplace / Germ** — future service adapters for live video and private communication.
- **Obsidian** — human-facing workspace and durable local control plane. PIXIE IDs remain the machine identity.

## Stable build boundary

The current branch is a stable, browser-safe foundation. It does not claim external integrations that are not actually connected.

### Working now

- Accessible retro desktop shell with keyboard navigation and visible focus.
- Skip navigation and reduced-motion support.
- Local crate with five demonstration tracks.
- Local dual-deck Web Audio playback from user-selected audio files.
- Local EQ, crossfader, and master controls with live value feedback.
- Accessible panel switching with focus moved to the active panel heading.
- Explicit local/native capability status UI.
- Browser-safe JavaScript bridge boundary for the native iOS/iPadOS shell.
- Obsidian vault selection through the File System Access API where supported.
- Durable Obsidian writes for PIXIE object JSON plus human-readable Markdown notes.
- Persisted vault capability in IndexedDB; browser runtime state is not used as canonical workspace content.
- Stable `pixie_id` identity independent of human filenames and folders.

### Explicitly not connected

- No microphone, camera, Photos, MIDI/HID, Bluetooth, AirPlay, notifications, Siri/App Intents, Sign in with Apple, or Apple Music service connection.
- No AT Protocol authentication or publishing connection.
- No plyr.fm publishing connection.
- No Mixxx hardware-driver connection.
- No Streamplace or Germ service connection.
- No native macOS/iOS filesystem implementation in this branch.
- No network credentials or private keys are embedded.

## Storage contract

Names are presentation. IDs are identity. Paths are implementation details.

- **Obsidian** is the durable workspace for sessions, projects, notes, setlists, and project metadata.
- **Source services** remain authoritative for source-owned records when a write API exists.
- **Writable PDS** is the interoperability fallback for portable creator records when appropriate.
- **Apple/native filesystem** is an asset plane, not the identity system; machine-safe paths are derived from `pixie_id`.
- **Browser memory/IndexedDB** may hold capabilities, temporary playback state, and runtime caches, but never canonical creator content.

A typical object uses:

```text
PIXIE/Objects/<pixie_id>.json
PIXIE/Assets/<pixie_id>.<ext>
PIXIE/Library/<human-readable-name>.md
```

This lets a user rename or reorganize a note without breaking references to the underlying PIXIE object.

## Status vocabulary

- **WORKING** — implemented and demonstrable in the current build.
- **LOCAL ONLY** — functional without an external service.
- **ADAPTER READY** — an interface/boundary exists, but the external integration is not connected.
- **PLANNED** — mapped for future development.
- **NOT IMPLEMENTED** — deliberately absent from the stable build.
- **BLOCKED** — requires external account, entitlement, hardware, credential, or other dependency.

## Native iOS / iPadOS

A SwiftUI + WKWebView shell and JavaScript/native capability boundary are scaffolded for local Xcode testing. The development bundle identifier is `com.local.pixie`; it is not an App Store Connect identifier. Production entitlements and external service configuration are intentionally not claimed.

See `docs/architecture.md`, `docs/native-ios.md`, and `obsidian-plugin/README.md` for the system model and native boundary.
