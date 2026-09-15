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

## Stable demonstration boundary

The current branch is intentionally stopped at a stable demonstration rather than pretending the unimplemented integrations work.

### Working now

- Accessible retro desktop shell with keyboard navigation and visible focus.
- Skip navigation and reduced-motion support.
- Local crate with five demonstration tracks.
- Local deck A/B selection.
- Visual play/stop state and activity meters.
- Local EQ, fader, and master controls with live value feedback.
- Accessible panel switching with focus moved to the active panel heading.
- Explicit local/native capability status UI.
- Browser-safe JavaScript bridge boundary for the native iOS/iPadOS shell.

### Explicitly not connected

- No real audio playback engine.
- No microphone, camera, Photos, Files, MIDI/HID, Bluetooth, AirPlay, notifications, Siri/App Intents, Sign in with Apple, or Apple Music service connection.
- No AT Protocol authentication or publishing connection.
- No plyr.fm publishing connection.
- No Mixxx hardware-driver connection.
- No Streamplace or Germ service connection.
- No network credentials or private keys are embedded.

## Status vocabulary

- **WORKING** — implemented and demonstrable in the current build.
- **LOCAL ONLY** — functional without an external service.
- **ADAPTER READY** — an interface/boundary exists, but the external integration is not connected.
- **PLANNED** — mapped for future development.
- **NOT IMPLEMENTED** — deliberately absent from the demonstration.
- **BLOCKED** — requires external account, entitlement, hardware, credential, or other dependency.

## Native iOS / iPadOS

A SwiftUI + WKWebView shell and JavaScript/native capability boundary are scaffolded for local Xcode testing. The development bundle identifier is `com.local.pixie`; it is not an App Store Connect identifier. Production entitlements and external service configuration are intentionally not claimed.

See `docs/architecture.md` and `docs/native-ios.md` for the system model and native boundary.
