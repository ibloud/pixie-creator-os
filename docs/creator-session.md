# Local creator-session pilot

Implemented October 4, 2026; pre-alpha. Automated model/lifecycle checks are separate from browser/device verification.

## Behavior and record

`session.html` is a focused route from the existing workstation. Native audio controls play only a user-selected local file through a temporary object URL. Clear, replacement and page exit revoke it. Selecting audio does not upload, copy, rename or organize the original.

The session record uses `pixie-creator-session/v1` and the existing `pixie_id` principle. Renaming never replaces identity. A record includes the name, optional next-step note, source disclosure and explicit unavailable-processing fields. It excludes audio and file paths. Browser memory is temporary; a user-chosen export is the keep/return route, not a new canonical browser store. The pilot does not call the workspace writer or PDS adapter.

Review exposes the exact JSON. Confirmation is required for download. Editing or pausing invalidates review and confirmation. Skipping the note excludes its text. Import validates the bounded record, strips unknown fields, preserves identity and resets to draft. The preview is copyable when download is unavailable. No provider calls, device input, reminders, telemetry or automatic feedback submission occur.

## Ownership

Device Stewardship owns the research/consent contract. Creator OS owns session execution and the optional viewing adapter. Holdings owns device assessment and MCP consequence previews. Narrative Provenance owns local provenance editing/audits in Obsidian; this page does not implement a second editor. Tarantula routes learners to the original exercise in the rhythm-game repo. 50 Ways discovery and Duet gameplay remain distinct.

The two workstation Streamplace tiles share `streamplace.js`. Handles must be AT Protocol-style domain names; URLs, credential strings and malformed labels fail closed. Loading is an explicit third-party request, not authentication/broadcasting. Editing removes the previous iframe; Remove player clears it. No handle is persisted. Keep the research example's acceptance/disclosure/removal contract aligned when changing this module.

## Target-device validation still open

On the intended iPad Safari version, record commit, device/OS/browser, orientation, larger text, date, expected and observed behavior:

1. Open from the workstation and reach all controls by touch, keyboard and VoiceOver in portrait/landscape.
2. Select a short original audio file; play/pause, skip and select another. Unsupported audio shows a usable error.
3. Name a session, enter a private test note, skip it, review and verify the note is absent. Confirm, edit, and verify download stays unavailable until fresh review/confirmation.
4. Pause/resume; ensure audio stays stopped until deliberately played. Stop/clear removes the in-tab choices.
5. Export to Files and inspect the actual JSON. Import it, verify the same ID and fresh review gate, then test malformed and oversized imports without losing the draft.
6. Test each optional viewer with an explicitly selected public handle, invalid input, removal, offline and no-stream behavior. Real playback remains unverified until observed.

Do not mark a feature device-verified because CI passes. Record export failures and fallbacks as observed limitations. No Cyber-G or automatic transcription/translation claim follows from a local audio test.

## Local preview observations

October 4, 2026, cloud Chromium HTTP preview: session named; test note skipped and absent from JSON; confirmation enabled download; editing disabled it; pause disabled editing and resume/clear worked. Initial preview exposed lack of `crypto.randomUUID` on an insecure origin; the ID generator was corrected and the flow retested successfully. This preview result does not verify deployed Pages, actual audio-file import, Files downloads/reimport, VoiceOver or iPad Safari.
