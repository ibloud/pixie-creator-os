# PIXIE Creator OS

## Loptr Lab mission and participation

Loptr Lab is a pre-seed, people-over-profit, accessibility-first venture working toward a self-sustaining model within a capitalist economy. Money sustains the work; meaningful change for people is its purpose. We accept funding only on terms that keep people and accessibility first. Our long-term vision includes universal basic income. We aim to bring change to life and leave a transparent record of what we tried, what worked, and what failed so others can carry it forward. This mission governs our projects, funding decisions, and partnerships; it is not a temporary marketing position.

Current open review and contribution opportunities are voluntary and unpaid. Before work begins, agree in writing on scope, time, what will be public, credit preferences, and an exit path. You can stop at any point. Participation does not promise employment, ownership, revenue share, academic credit, or future pay. Any paid commission or other formal arrangement requires a separate signed agreement before work begins. External assistance or benefits belong to the participant and are not compensation from Loptr Lab.

Financial support is optional and sustains infrastructure, maintenance, accessibility work, and documented development. Paying does not buy contributor status, canon authority, approvals, ownership, or employment. Participation and accessibility are not sponsorship rewards. Project-specific licenses and existing signed agreements continue to apply.

[Full mission and participation terms](https://github.com/ibloud/ibloud.github.io/blob/main/MISSION.md).


A local-first artist workspace for preparing creative work, reviewing public context, and handing it off to the service the artist chooses. Research and DJ demonstrations remain available in [additional tools](tools.html).

## Direction

The default workflow is **My work → Prepare → Share**, with **Connections** explaining optional external services. It supports local audio/video/image previews, public references, caption/credits/accessibility text, reviewed manual handoffs to Bluesky or Repurpose, and self-reported publication links. It does not replace the artist’s DAW, OBS, or distribution services.

### Product ownership

PIXIE Creator OS is a Loptr Lab / Dominique Devereaux product. Charlie J is not the owner or creator of PIXIE. A producer PIXIE may approach for hire is a separate proposed creative engagement; participation, endorsement, ownership, or approval is not implied by this repository.

### Integrations

- **AT Protocol** — identity, social records, and interoperable creator data.
- **plyr.fm** — ATProto-native audio publishing and playback target.
- **Mixxx** — external DJ engine/hardware workflow. Browser UI does not pretend to be a hardware driver.
- **Ubuntu Studio** — inspiration for a workflow-oriented creator workstation: audio, MIDI, routing, recording, and live production.
- **Streamplace / Germ** — future service adapters for live video and private communication.
- **Obsidian** — human-facing workspace and durable local control plane. PIXIE IDs remain the machine identity.

## Current build boundary

The v0.2 local workflow is the default entry point. The older pre-alpha workstation is preserved at `tools.html`. Direct publishing, account authentication, recording, and automatic distribution remain disconnected. Drafts are kept in memory until explicitly downloaded; re-import preserves `pixie_id` and requires fresh review. Desktop browser observations and device validation limits are recorded in [the artist workflow contract](docs/artist-workflow.md). A passing CI or deployment does not establish iPad Safari, Files, VoiceOver, or live service verification.

**Stable pre-alpha handoff:** see [docs/stable-prealpha-handoff.md](docs/stable-prealpha-handoff.md). This is the continuity contract for future maintainers: it preserves the distinction between code, runtime behavior, external reality, narrative material, and proposed work, and defines the rules for strings, identity, provenance, and time-bound observations.

### Default artist workflow

- Select and preview local audio, video or image media; no upload or remote fetch.
- Prepare a title, caption, credits/rights, public link and accessibility description.
- Review and confirm the current text before copying/downloading a manual handoff.
- Save and re-import a portable draft; media bytes, filenames, local paths and credentials are excluded.
- Record user-reported publication links without claiming external delivery.
- Open chosen services explicitly; Repurpose requires media in a supported source, not a PIXIE JSON file.

See [ADR 002](docs/adr-002-artist-workflow.md) and [workflow and verification](docs/artist-workflow.md).

### Additional tools (preserved pre-alpha)

- Accessible retro desktop shell with keyboard navigation and visible focus.
- Skip navigation and reduced-motion support.
- Local crate with five demonstration tracks.
- Local dual-deck Web Audio playback from user-selected audio files.
- Local EQ, crossfader, and master controls with value feedback; deck activity indicators are not signal-level meters.
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

## ATProto community workspace

For interoperability review and community contribution, see [docs/atproto-community.md](docs/atproto-community.md) and GitHub Issue #15. The companion 50 Ways repository carries the live Pixie v0.1 verification handoff.


## Contributor path

If you are joining at the current demo boundary, start with [CONTRIBUTING.md](CONTRIBUTING.md), [docs/stable-prealpha-handoff.md](docs/stable-prealpha-handoff.md), [docs/architecture.md](docs/architecture.md), [docs/network-intelligence.md](docs/network-intelligence.md), and [docs/demo-to-next-stable.md](docs/demo-to-next-stable.md).

**Current demo boundary:** Network Intelligence is local/demo-only. ADD CARD creates a proposed local record and may use the existing PIXIE storage seam. SEND INVITATION prepares a local pending record; it does not send a message. Made-Sick intake accepts a source URL for provenance; it does not crawl the source.

The next stable version requires explicit source contracts, verification states, durable PIXIE object handling, tests, and separately permissioned external adapters. Do not enable those capabilities by implication or UI copy alone.


## Atmosphere Story Router — local harness

Import Story Finder ledger v2 (or degraded v1) from Files in the Atmosphere panel. Select references, choose a simulation destination, add context, preview, and confirm a local simulation. Intentions and simulated receipts use the existing Story Engine storage/recovery path. Destination changes require a new preview; separate resharing preserves prior receipts.

ATProto authentication and real publishing remain disconnected. The current UI is reference-only; the contract tests exercise identity-aware embed/quote rules, consent, capabilities, and idempotent retry with fake adapters. See [the Story Router contract and pilot order](docs/story-router.md).

## Shared PIXIE pathways

The [Device Stewardship example](https://ibloud.github.io/pixie-device-stewardship/) now provides consent-aware scenarios and an editable feedback draft. See [ecosystem responsibilities](https://github.com/ibloud/pixie-device-stewardship/blob/main/docs/ECOSYSTEM-COORDINATION.md) and the [shared hardware reference](https://github.com/ibloud/pixie-device-stewardship/blob/main/docs/HARDWARE-PATHWAYS.md) for iPad/iPhone, Intel/T2 Macs, Apple Silicon, Android, repair and recovery. AetherOS remains interaction inspiration; the existing Streamplace embed is optional viewing, not a configured broadcast service. Hardware support still requires task-specific device evidence.


## Local creator-session pilot

[Open the creator-session page](https://ibloud.github.io/pixie-creator-os/session.html). Select local audio or skip it, name the session, write or skip a next-step note, pause/resume, review the exact record, confirm, then download or copy JSON. Import restores the stable session ID as a draft requiring fresh review. Audio and source-file names/paths are excluded. No browser persistence, automatic vault writes, transcription, translation, reminders, publication or hardware input is added by this pilot.

Both workstation Streamplace tiles now use one optional viewer module: strict domain handles, explicit external-contact disclosure, no handle persistence, no-referrer, removal on edit and a Remove player control. Requesting an iframe does not verify a live stream.

See [session contract and device checks](docs/creator-session.md). These features remain pre-alpha; automated checks do not establish iPad Safari, VoiceOver, Files or Cyber-G behavior.

## Morgue experience desk — local demo

Open [the Morgue workspace](morgue/) to rehearse an Ink-driven experience with operator controls, a same-device simulated participant preview, preview-before-release cues for Violet, Mortis and the Pennywise reference label, and a local event feed. Start, pause, resume, end, leave and reset are implemented. No remote participants or Germ/Roomy messaging are connected. A simulated win shows a reward preview linking to the real Violet’s Revenge game; it does not distribute an invitation. See [demo contract](docs/morgue-demo.md).
