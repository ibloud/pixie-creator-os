# Current verification status and story work

Status as of September 27, 2026. This is a status record and proposed work order, not a release completion record or an implementation of live beats.

## What is live

- Release 1 fixes from PR #42 are on `main` at merge commit `ba349da`. At merge, CI and GitHub Pages deployment passed. The published browser app remains **pre-alpha**; the automated checks do not establish device behavior.
- CI checks interoperability syntax and runs interoperability, Story Engine smoke, and story storage recovery tests. It does not exercise the full `narrative.js` interface or iPad Safari.
- Existing local workstation and story features are available as described in the README, subject to browser support and permissions. Network Intelligence creates local demo records. Its SEND INVITATION action does not send a message. The Streamplace viewer embed is not a broadcasting connection; Germ, Soundiiz, event feeds, and automatic outreach are not connected.
- The Story Engine recovery path offers export. Retry, reset, and quarantine-key cleanup are not implemented. A memory-only capture is not durable. Check the resulting file on the target device before relying on an export.

## Verification still open

Do not label this build stable until a person records the environment, date, steps, observed result, and evidence for each relevant browser and iPad check. Use the Sept 25 ADR checklist as well as these focused cases:

1. Exactly one persistent PIXIE launcher opens the intended Control Room; panel keyboard order and the Atmosphere Streamplace label focus the intended input.
2. User-selected tracks play on both decks and crossfade.
3. A corrupt story library shows a recovery warning on load. After a quarantined capture and reload, an export includes both the original raw value and the earlier capture.
4. Blocked storage and full storage do not claim a capture was saved. The page and readability controls remain usable, and the empty state does not contradict the warning.
5. On iPad Safari, recovery JSON can actually be saved to Files and the banner leaves taskbar and deck controls reachable in portrait and landscape.

6. Library and Player layout: in iPad Safari portrait and landscape, enable PIXIE's Larger Text. Every control must be reachable by touch and keyboard focus, fully visible when scrolled into view, and usable without clipped labels or overlays covering its target. Scroll each panel to its end; reach the Library rows, both local file pickers, deck transport and crossfade controls, provider player, dock, and readability controls. Repeat with the recovery banner visible. Provider playback and local audio are recorded separately; a selected demo Library row is not proof of playback.
7. Radar source cards: open each curated card twice and reload; the saved-story count must increase only on the first open. Reopen a story with a written draft and confirm the text is unchanged. Accept a client reference and verify its Unchecked label and self-reported reviewer wording before and after reload. Read source must open the named published post.

## Recording and tagging procedure

These are pass criteria, not completed verification results. Merge code corrections first, then test the Pages deployment built from that exact full `main` commit SHA. Record the deployment URL, SHA, browser/OS/device, orientation, text setting, date, steps, observed result, and evidence. If testing requires a code fix, deploy the new commit and repeat affected checks; identify which results apply to each SHA.

Publish results, known limitations, and recovery instructions in a separate docs-only PR after testing. Tag the **tested code commit**, not the subsequent documentation commit, and name both commits in the completion record. The Story Router remains a local simulation; this procedure does not verify live publishing.

Record failures as failures. A green CI or Pages run is not a substitute for these observations. The completion record in `demo-to-next-stable.md` also needs a version/tag, commit, procedure, verification dates, connected services, limitations, and recovery instructions. No stable tag is asserted here.

## Next work, in separate reviews

The next story work belongs in `ibloud/inpatient-corridors-review`, not in this workstation's live interface. First inspect that repository's current workflow and Ink source. Add pull-request compilation and a deterministic automated playthrough with explicit reachability assertions, without committing generated output to `main` from a PR. A random sampler alone cannot prove that every ending or fact is reachable. Preserve a failing case as evidence before fixing the Yellow Door builder ending, walk-away ending, and discarded “What remains?” answer. Then review any specific Ink fact tracking against actual scene consequences. Keep story changes and the workstation shell out of the same PR. These are proposed tasks, not completed tests or confirmed defects at this repository's current commit.

Document a **proposed** slot schema and beat schema separately before implementing any communications. A beat requires a knowledge condition and passive offer surface; player-initiated readiness confirmation with channel, window, intensity, exit, timestamp and adult confirmation; a human approver different from the actor; an available safety owner; a fresh consent check at airtime; a fallback Ink knot for declined, missed or exited beats; and an outcome fact. Withdrawal cancels pending beats. A knowledge condition gives narrative context, not consent or a safety assessment. Retention duration and withdrawal deletion process remain **DECISION REQUIRED — owner: Dominique**. No application code should read this proposed schema until those decisions and the implementation review are complete.

No automatic offer messages, Germ contact, live scheduling, or other external outreach are authorized by this document. A manual event is also contingent on named people, explicit player confirmation, a written fallback, and a separate human safety review; no date is committed here.
