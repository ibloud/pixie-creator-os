# Morgue operator demo

## Reproduce

1. Open `morgue/` from Creator OS's sidebar.
2. Start demo. Both views are on one device; there is no other participant.
3. Choose a character, preview its draft cue, and explicitly release it. Only the local participant preview changes.
4. Use participant choices to enter the case room and select a simulated win, loss or exit.
5. Pause to block scene choices and cue releases; resume to continue. Participant exit remains available while paused.
6. End stops participant choices and cue release. Reset clears all activity and starts fresh.

A simulated win shows a reward preview linking to the playable Violet’s Revenge prototype. It does not expose the Roomy join link or prove a real win. A loss offers retry without a reward; exit ends participation. Real game invitations remain win-only; Dominique may separately invite approved guests.

## Implemented / local only

- Real Ink branching through bundled inkjs 2.4.0; source is `morgue/story.ink`, generated runtime data is `morgue/story.js`.
- Start/pause/resume/end/reset and voluntary exit.
- Scripted draft character cue preview and approval.
- Same-device participant preview and timestamped local event feed.
- Responsive layout, labelled controls and visible keyboard focus.

These cues do not claim character canon or reuse of the existing bots. Violet's historical card-game helpers are not connected. Mortis source/deployment still needs inventory. Pennywise is a retained reference label with no third-party dialogue, imagery or voice in the demo; public character adaptation remains subject to rights review.

## Not implemented

Remote players, multiplayer synchronization, live social feeds, automated character behavior, Germ messages, Roomy messages, recording, consented live interventions, saved sessions or production win verification. No private participant information is collected. No real person is contacted. Story cues are explicit rehearsal actions, not a live communications system.

Ink can eventually drive story branches while a separately verified, consented communication channel supports human interventions. Germ is an optional external handoff: confirm agreement to private contact, then explicitly open the official setup guide. No account sign-in, recipient lookup, inbox, composer, message relay or delivery receipt is implemented. Card exchange and contact policy remain in Germ. The acknowledgement is self-reported, not verified consent from another person. Reset/end/leave clear it. The proposed communications beat schema remains unconsumed; readiness, adult participation, human approvals, safety coverage, withdrawal and retention decisions remain prerequisites for live operation.

## Validation

`node --test tests/morgue.test.js` covers win/loss/retry/exit reachability, pause restrictions, preview-before-release and reset. Browser UI validation is recorded in the implementing PR; iPad Safari and VoiceOver still need physical-device validation.

## Build the story

Use inkjs 2.4.0's `Compiler` from `dist/ink-full.js` to compile `story.ink`, then serialize `story.ToJson()` as `window.MORGUE_STORY` in `story.js`. Commit source and matching generated data together. Bundled runtime provenance and license are in `morgue/vendor/`.

## Money Game 3 ARG cross-reference

The design follows the independent [Made Sick Phase 2 route](https://github.com/ibloud/made-sick/blob/main/PHASE_2.md), whose creative references include the Money Game treasure hunt. The [source register](https://github.com/ibloud/made-sick/blob/main/SOURCE_REGISTER.md) records Money Game Part 3 and the treasure-hunt references. This is not a continuation of Ren’s ARG and implies no participation, approval or affiliation. No music, lyrics, original clues or third-party story material are embedded.

| Phase 2 design | Morgue demo | Later live experience |
| --- | --- | --- |
| Recognize | Clearly framed fictional arrival | Public entry and organizer disclosures |
| Participate | Ink choices with loss/retry and voluntary exit | Reviewed puzzles and accessible alternate routes |
| Transmit | Operator-approved cues in the same-device preview | Optional consented Germ contact, separate from public Roomy coordination |
| Withdraw | Leave, pause, end and reset | Cancel pending beats and support agreed deletion/withdrawal procedures |

The audience moves through clues and choices while the operator controls releases; private contact remains optional and outside the puzzle’s required path. The Phase 2 ARG safety contract applies: no trespass, uninvolved-person contact, purchases, secret/health/location disclosure, deceptive emergencies or unsafe tasks to progress. Story urgency must not become pressure to accept private contact.

Official Germ references checked October 4, 2026: [product](https://www.germnetwork.com/) and [user guide](https://www.germnetwork.com/using-germ-dm). Current guidance owns service behavior; iPad availability and an actual message exchange remain unverified here.
