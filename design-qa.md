# Tools & settings QA — 2026-10-05

Result: scoped desktop checks passed; device and external integration checks remain open.

The supplied screenshot shows the old production page, with a dense sidebar and audio file controls clipped above a large Spotify area. The first implementation retained too much of that workstation shell. This revision removes the sidebar and status decoration, replaces the task grid with three linear sections, collapses Research & testing, removes decorative platters, and collapses Spotify. Local audio uses explicit Choose file, Play/Pause and Restart controls for each source.

Current rendered evidence: `docs/verification/tools-simple-overview.jpg` and `docs/verification/tools-simple-audio.jpg`, captured at 1363 × 936. The user screenshot is an iPad browser capture with different dimensions and browser chrome; these captures verify desktop structure, not exact iPad parity. Text and file controls fit in the checked view. Existing typefaces and colors are retained; no imagery is introduced.

Verified in this revision: synthetic WAV selection, decoded duration, Play/Pause state, Restart, disabled controls for the empty second source, and return to the overview. The first pass also checked story/handoff navigation, simulated handoff, shared readability preferences and unavailable vault-picker disclosure. Browser logs in the final check contain extension metadata errors, not application errors.

42 Node cases pass. Earlier smoke and storage recovery checks also passed. Recovery file delivery was not independently verified because the browser download observation timed out. iPad Safari, VoiceOver, Files delivery, actual vault writes and Spotify playback remain unverified. PDS saving and live publication are explicitly disconnected. Production still shows the old page; this implementation is on the feature branch.

## Shared presentation and existing brand tokens — My Apps amendment, 27 October 2026

`styles.css` is the sole authoritative stylesheet for Creator workspace, tools,
practice session, Rave and Morgue. Each HTML root declares `data-pixie-surface`;
zero-specificity surface scopes prevent legacy selectors from competing across
pages. The existing rules retain their order within each surface. The separate
page CSS files and the existing storage-recovery alert’s static inline styles
have been consolidated here, not replaced with another theme.
The old Google Fonts import was after qualified rules and therefore inactive;
it is removed rather than activated as a new external request. Existing font
stacks and local fallbacks are retained. No logo, artwork or project identity changes.

| Existing surface | Typography / palette authority retained in shared CSS |
| --- | --- |
| Creator workspace / My Apps | system UI; `--creator-text-size` 20/24/28px; `--bg` #141619, `--panel` #202328, `--text` #f2f2ef, `--muted` #b9c0ca, `--accent` #ff8c90, `--button` #f4a1a4, `--line` #3b4048 |
| Tools | existing IBM Plex Mono/Courier and IBM Plex Sans Condensed/Arial stacks; `--clr-*`, `--font-*`, `--radius-*` retain their existing values and readability/high-contrast controls |
| Practice session | existing system UI 18px / 1.6, #111418 background, #eef2f6 text and cyan controls |
| Rave Lab | existing dark/warm/contrast variable sets and `--rave-size`; no palette unification |
| Morgue rehearsal | existing system UI, purple/gold accents and operator/participant/feed grid |

My Apps reuses Creator cards, buttons, border, muted text and focus tokens.
Cards use a 20px gap and 24px padding; controls retain the shared 48px minimum
height. Labels wrap; narrow layouts use one column. Ordering uses named buttons,
not drag-only gestures. State includes words rather than color alone. Brand
assets have not been fabricated: no approved third-party logo files exist in
this checkout; names identify apps until source/usage approval is available.
This does not authorize remote logo tracking or scraping a catalog's artwork.

Validation must include keyboard, 28px text at 320/390/820/1440px, contrast and
preserved functional layouts. Chromium evidence does not establish physical iPad
Safari or VoiceOver acceptance.
