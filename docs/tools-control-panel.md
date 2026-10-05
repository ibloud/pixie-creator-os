# Tools control panel

`tools.html` opens a simple settings overview with display preferences, saved work and local audio. The sidebar, status dashboard and decorative decks are hidden on this page; research tools are collapsed by default. It supplements the artist workflow in `index.html`; it does not provide a separate account or a connected PDS backend.

## Reproducible actions

- Open local dual-deck audio, choose a file for each source, play/pause/restart, and adjust tone, volume and balance. Playback and restart are disabled until that source has a file. The ambiguous shared transport and alignment controls are hidden. Audio stays in this tab.
- Open the preserved story workbench. Switching panels retains in-tab state. Closing returns to the overview, including the Ink flow’s close handler.
- Open Story Handoff directly, import a Story Finder ledger, select references, choose a simulated destination, review, confirm a local simulation and download a preview. Changed input invalidates review. Read-only destinations keep confirmation disabled.
- Toggle high contrast or larger text from either the overview or story workbench. Both controls share the existing device preferences.
- Export story recovery using the existing recovery format. It may contain local drafts and permission evidence; it is not a public payload.
- Inspect actual vault capability. In browsers without directory selection, the page directs users to Files downloads. Vault creation requires a connected workspace; opening a note requires a successfully saved object.
- Contributor tools remain available under an expandable section: local sync planner, Recon demo, device capabilities and Morgue rehearsal. Governance remains accessible in Research & testing; service panels retain their underlying routes.

Spotify’s embed API is loaded only after an explicit Load Stream or demo action. Failure or timeout is disclosed; local playback remains independent. Loading a viewer does not prove account connectivity or service availability.

## Verification

Run `node --test tests/*.test.js`, `node tests/story-engine-smoke.js` and `node tests/story-storage.test.js` from the repository root. Tools regressions check panel focus/missing-panel safety, live deck alignment and master volume chosen before first playback.

Browser acceptance: open/close every primary tool; toggle readability in both locations; import a synthetic ledger, preview and simulate; load synthetic local audio; check console; download recovery. Report actual device/browser and result when giving feedback. For Loptr Lab training, use fictional sources and attach steps, expected/observed behavior, device/browser and any screenshot that contains no private drafts.

Desktop cloud-browser checks do not establish iPad Safari, VoiceOver, Files app handoff, actual vault writes, Spotify playback or production PDS/authentication/publishing. PDS connection and live publication remain not connected. No media upload, recording or new external write is introduced.
