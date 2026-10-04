# Artist workflow — v0.2 local build

## Use it

1. Open `index.html`. Select an audio/video/image file, or continue to Prepare with a public work link.
2. Add title, caption, credits and rights, and an accessibility description. Confirm that you own or have permission to share the selected work and public details.
3. Choose Bluesky or Repurpose in Share. Review the exact plain text and confirm the current handoff.
4. Copy or download text; optionally download the original selected media. Open the chosen service and finish there.
5. Optionally record the resulting public HTTPS link. It is user-reported, not fetched or verified.
6. Download a draft before closing/reloading. Import it later to restore text, identity and reported links; select media again and review again.

Clear this workspace asks for confirmation and clears only this tab. Original files and downloads are not modified. No private note field is added to the public preparation form. The existing practice-session note exclusion remains unchanged.

## What is connected

Nothing is authenticated in this workflow. External services are links/manual handoffs. Core work does not contact a service. ATProto sign-in, live posting, Repurpose API/workflows, recording, transcription, conversion, automatic clipping, instrument control, and external delivery verification are not implemented.

Repurpose does not accept direct media uploads: connect a supported source such as Dropbox. Bluesky is a video destination, not a source, in Repurpose's supported-platform list. A JSON draft or public work URL is not a media source. Audio/image compatibility depends on the selected Repurpose workflow; the interface does not assert that they can be sent to Bluesky through Repurpose.

Sources checked 2026-10-04:
- https://support.repurpose.io/en/article/supported-platforms-roles-and-media-types-j22278/
- https://support.repurpose.io/en/article/how-scheduling-works-in-repurpose-setup-and-limits-iyhn5d/
- https://atproto.com/guides/reads-and-writes
- https://restream.io/learn/what-is/obs/

## Storage and recovery contract

`pixie-artist-draft/v1` is a local portable draft. Its explicit fields are title, link, caption, credits, accessibility description, rights choice, destination, `pixie_id`, and user-reported publication history. Unknown imported fields are discarded. Unsafe URLs, credentials in URLs, malformed IDs and oversized text/history are rejected. Imports are limited to 512 KB and restore no confirmation or media capability.

Media bytes, media filenames, local paths, object URLs and credentials never enter draft JSON or sharing text. Download selected media returns the user's original file separately, without conversion. The browser's before-unload prompt is best effort; iPad app termination may not display it. Download and verify the draft in Files before relying on recovery.

## Verification

Automated model tests cover fresh-review requirements, permission checks, media requirements for Repurpose, stable identity, stripped imported capabilities, malformed drafts, unsafe links, and historical self-reported links. Existing Story/session/router/viewer tests remain required. Pages deployment depends on CI.

Desktop browser preview observed during implementation:
- All four primary views render; navigation moves focus to their headings.
- A linked original work with title/caption/credits cannot pass review without the rights checkbox.
- After rights confirmation, exact public text can be reviewed and the manual handoff unlocked.
- A resulting HTTPS link is recorded as user-reported, not verified.
- Editing a confirmed caption removes the handoff controls and requires a new review.

Pending device verification: actual iPad Safari portrait/landscape, larger text and VoiceOver; audio/video/image format playback on the device; download/copy/Files recovery; interrupted-session and app-switch behavior. Responsive CSS is implemented, but is not evidence of device testing. No live external publication is verified.

## Reproduce

Serve the repository root over HTTP and open `index.html`. Run:

```sh
node tests/interoperability.test.js
node tests/story-engine-smoke.js
node tests/story-storage.test.js
node --test tests/source-cards.test.js tests/story-router.test.js tests/session.test.js tests/streamplace.test.js tests/creator.test.js
```

For browser acceptance, perform the steps above; edit the caption after confirmation and ensure the handoff disappears. Select Repurpose without media and ensure review is refused. Export/import a draft and ensure identity survives, media must be reselected, and no confirmation is restored. Submit a malformed import and ensure the current work survives. Repeat on the physical iPad before marking that device verified.
