# PIXIE Creator OS — DJ architecture

## Product model

PIXIE Creator OS is a browser-native workstation for a social-network DJ. It treats the browser as the shell, not as a fake replacement for an operating system or DJ controller.

```text
PIXIE SHELL
├── CRATE       local set preparation / queues / notes
├── DECKS       browser playback prototype + external-engine status
├── PUBLISH     plyr.fm adapter boundary
├── SOCIAL      AT Protocol identity + social activity
├── LIVE        Streamplace adapter boundary
├── PRIVATE     Germ adapter boundary
├── ROUTING     audio/MIDI/HID connection state
└── SYSTEM      device and workstation status
```

## Hardware boundary

Mixxx remains the hardware/DJ engine. The web UI can represent a connected controller, MIDI mapping, deck state, and routing, but should not claim browser access to arbitrary hardware until Web MIDI/HID/Audio capabilities and permission flows are actually available.

## Ubuntu Studio influence

The workstation is organized around production tasks rather than generic productivity apps: audio sources, recording, routing, MIDI, live output, project files, and publishing.

## Data boundary

- **Local**: crate order, UI preferences, temporary session state.
- **AT Protocol**: identity, public social records, creator-facing interoperable metadata.
- **plyr.fm**: audio publishing/playback adapter.
- **Streamplace**: live video adapter.
- **Germ**: private communications adapter.
- **External Mixxx**: actual DJ engine and hardware workflow.

No credentials are hard-coded in the prototype.
