# Tools & settings QA — 2026-10-05

Result: scoped desktop checks passed; device and external integration checks remain open.

The supplied screenshot shows the old production page, with a dense sidebar and audio file controls clipped above a large Spotify area. The first implementation retained too much of that workstation shell. This revision removes the sidebar and status decoration, replaces the task grid with three linear sections, collapses Research & testing, removes decorative platters, and collapses Spotify. Local audio uses explicit Choose file, Play/Pause and Restart controls for each source.

Current rendered evidence: `docs/verification/tools-simple-overview.jpg` and `docs/verification/tools-simple-audio.jpg`, captured at 1363 × 936. The user screenshot is an iPad browser capture with different dimensions and browser chrome; these captures verify desktop structure, not exact iPad parity. Text and file controls fit in the checked view. Existing typefaces and colors are retained; no imagery is introduced.

Verified in this revision: synthetic WAV selection, decoded duration, Play/Pause state, Restart, disabled controls for the empty second source, and return to the overview. The first pass also checked story/handoff navigation, simulated handoff, shared readability preferences and unavailable vault-picker disclosure. Browser logs in the final check contain extension metadata errors, not application errors.

42 Node cases pass. Earlier smoke and storage recovery checks also passed. Recovery file delivery was not independently verified because the browser download observation timed out. iPad Safari, VoiceOver, Files delivery, actual vault writes and Spotify playback remain unverified. PDS saving and live publication are explicitly disconnected. Production still shows the old page; this implementation is on the feature branch.
