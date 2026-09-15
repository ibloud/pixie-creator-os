# PIXIE Creator OS

A browser-native DJ and creator workstation inspired by Aether OS and Ubuntu Studio, with AT Protocol as the social/identity layer.

## Direction

PIXIE Creator OS is designed for a social-network DJ: prepare sets, manage a crate, publish audio through plyr.fm, connect social identity through AT Protocol, monitor live/stream state, and keep hardware/audio routing visible.

### Integrations

- **AT Protocol** — identity, social records, and interoperable creator data.
- **plyr.fm** — ATProto-native audio publishing and playback target.
- **Mixxx** — external DJ engine/hardware workflow. Browser UI does not pretend to be a hardware driver.
- **Ubuntu Studio** — inspiration for a workflow-oriented creator workstation: audio, MIDI, routing, recording, and live production.
- **Streamplace / Germ** — future service adapters for live video and private communication.

## Prototype status

The first build is a static browser OS shell with functional local interactions and adapter boundaries. Audio-device access, MIDI/HID mapping, authentication, uploads, and live service credentials are intentionally not faked. They are represented as explicit connection states and future adapter points.

See `docs/architecture.md` for the system model.
