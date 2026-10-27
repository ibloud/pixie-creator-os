# Tarantula / Rave Lab alpha

Owner direction, 25 October 2026: rehearse a Tarantula/Inpatient-referenced virtual gathering with virtual tickets, optional conversation and Atmosphere onboarding. The second supplied reference is labelled by YouTube oEmbed as **Ren - Vincent's Tale: Starry Night | 29 Reactions at the Same Time**, by 60 Second Signals. Metadata was retrieved; scene-by-scene viewing was not performed. The shared-reaction/watch-together interpretation is a design proposal, not a claim about artist participation or licensed reuse.

## Existing-work check

Reuse Creator OS's central `styles.css`, optional `streamplace.js` player, the existing Morgue scene rehearsal and the existing Tarantula learning repository. Read current Creator OS main, canonical ecosystem map, Tarantula and Ren Rhapsody READMEs before implementation. Rhapsody remains its separate musical-game project; this event flow does not change its canon or Halloween acceptance. No replacement repository, chat server, directory or account database is created.

`rave.html` is a distinct event journey within Creator OS. Source stays in its existing GitHub repository. Companion's Tangled-ready static build is a separate integration change, with its existing Site identity preserved. Neither source publication nor a local pass establishes live attendance infrastructure.

## Test the alpha

1. Open `rave.html` from Creator OS's Rave Lab link. Read the house rules. Nothing loads from a media/chat service on arrival.
2. Accept the rules and get a virtual **test** pass. Repeated claims in the same tab do not create another ID. Download it; no name, phone, email or payment is collected by this flow.
3. Enter the stage. Optionally enter a Streamplace public handle and choose Load player. Editing/removing it clears the viewing connection. No stream key belongs here.
4. Take a quiet break to remove the embedded player, or leave to clear this tab's pass and consent. External tabs remain open under their service's control.
5. Return with the exported pass file. Its ID remains stable; accepting the rules again is required before entry. It is a public rehearsal record, not a signature, reservation, scarce ticket or access credential.
6. In Host rehearsal setup, enter a specific Roomy room, public moderator/team label and Roomy moderator-contact route. Confirm host-tested coverage and apply. The UI reports this as host-provided readiness; it does not assign moderators or verify their availability. No existing community space is silently made a rave room.
7. Export the public event setup; participants may import it. Chat requires entry, host-ready configuration and the participant's separate external-chat acknowledgement. It opens the service explicitly; it does not relay, record or automatically publish messages.

## Onboarding and UX decisions

One sequence: arrival → keep pass → stage/conversation. Watching without chat/camera is valid. No forced account creation for the local rehearsal, default 20px body text, 24px/28px options, dark/warm/high-contrast choices, visible keyboard focus, at least 48px interactive controls, no decorative motion/strobes/autoplay and a persistent plain-language exit. New styles are scoped in the central Creator OS stylesheet. No new per-page stylesheet.

Public event setup contains only public handles/routes and a moderator display label; do not include invite secrets or private reporting details. Supported URLs exclude credentials and query/hash values. Host setup is a rehearsal convenience, not an administrative security boundary. On a real event, only trusted operator configuration should be published and admission must be verified on the server.

## Resource findings — primary sources checked 25 October

- [Streamplace quick start](https://stream.place/docs/guides/start-streaming/quick-start/): Atmosphere/PDS sign-in, OBS setup and live dashboard. Keep credentials and stream keys in the service/OBS, never in event JSON.
- [Player embeds](https://stream.place/docs/features/embed/): documented `/embed/{handle}` route already used by our shared viewer.
- [Streamplace chat popout](https://stream.place/docs/features/chat-popout/): separate chat view exists. [Live dashboard](https://stream.place/docs/features/live-dashboard/) contains moderation controls. An embed plus a local pass does not prove ticket-restricted playback. Live account, stream and moderator actions need separate-user acceptance.
- [Roomy source](https://github.com/muni-town/roomy): Atmosphere group-chat app. Current permissions source at `packages/app-lite/src/routes/[space]/settings/permissions/+page.svelte` implements roles and channel permissions. Source functionality is not proof that our particular space has correct rules, moderator coverage, reporting or confidentiality. Test those in the actual event room.
- [RPG Actor](https://rpg.actor/): character registry. Its public catalogue includes a Stream Place birthday cake item. That establishes an ecosystem connection, not a verified embedded streaming/chat integration. Keep characters/items optional; no identity or collectible prerequisite.
- [Atmosphere Tickets](https://atmosphere.tickets/docs): shared ticket inventory, holds, issuance and check-in behind a trusted backend. Public starter can run local mocks without credentials; connected sandbox requires app registration, organizer approval, callbacks and test access. Limited free claims currently require private delivery email. Do not promise our local no-email pass flow represents the live service's requirements.
- [Tangled website hosting](https://docs.tangled.org/hosting-websites-on-tangled): static files can host this frontend. They cannot enforce scarce ticket issuance or replace the trusted ticketing/payment backend. Custom domains currently unsupported in these docs.

## Actual verification

Local model tests and shared viewer lifecycle tests pass. Desktop browser verified: initial pass disabled, claim, stable ID, entry, pass download, leave/clear, import with same ID and fresh rules required, host fixture application, chat hidden before entry/opt-in and visible only after both. Test Roomy fixture URLs were not opened and were cleared by reload. HTTP preview exposed missing `crypto.randomUUID`; a `getRandomValues` UUID fallback and regression check resolve it without weak randomness.

Desktop layout visually inspected. Physical iPad Safari, VoiceOver, narrow-device behavior, live provider login, real stream playback, room access and moderator actions are not accepted by this evidence. Test those before presenting a live safe-space event. Downloaded test pass contents were inspected and contain no personal fields.

## Live pilot remaining work

1. Host confirms event time, actual Streamplace account, permitted media and named moderation coverage. This alpha has no event date or performer commitment.
2. Create/reuse the event's Roomy channels: arrivals/rules, event chat, quieter conversation and an appropriate moderator contact route. Test access, removal/block/report behavior, retention and exit from a separate attendee account. Do not treat a public channel as confidential reporting.
3. Obtain ATM/Tickets sandbox access. Integrate service-auth and verified issuance callbacks in the existing trusted backend; browser redirect is not proof of a ticket. Verify capacity races, duplicate callbacks, cancellation/refund invalidation and permission boundaries. Paid/live transactions remain outside the current alpha.
4. Decide whether tickets are attendance keepsakes, scarce admission or payment-linked entitlements. Verify the stream provider's supported access enforcement before promising a paywall; static browser checks are bypassable.
5. If participant reaction video is desired, confirm who opts in, recording/redistribution permissions and an actual production tool. The 29-reaction reference does not establish synchronized camera capture, chat recording or a rights grant. Current alpha offers text-chat handoff and external broadcast viewing only.
6. Confirm Tangled account consent, public repository mirror and static site publication; preserve GitHub issue authority and current hosting until verified replacement acceptance.
