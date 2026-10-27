# Artist workflow — v0.2 local build

## Use it

1. Open `index.html`. Select an audio/video/image file, or continue to Prepare with a public work link.
2. Add title, caption, credits and rights, and an accessibility description. Confirm that you own or have permission to share the selected work and public details.
3. Choose Bluesky or Repurpose in Share. Review the exact plain text and confirm the current handoff.
4. Copy or download sharing text; copy the separate accessibility description into the destination media field. Optionally download the original selected media. Open the chosen service and finish there.
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

## Caption and viewing support

Caption starters are local editable templates, not AI output. Applying one explicitly replaces the current caption and invalidates review. Accessibility descriptions remain in portable drafts but are excluded from sharing text. The separate reviewed description can be copied after confirmation; 2000 text units is a workspace maximum, not a minimum or a guarantee of destination compatibility. Rights confirmation is the artist’s statement, not sample clearance.

Connections now includes the existing optional Streamplace viewer. No embed loads until Load player; editing the handle or Remove player disconnects it. This does not add broadcasting, authentication or proof that a stream exists.

## Atmosphere creator environment — review slice, 27 October 2026

The existing shell now groups work as My Studio, My Apps, My Audience, My Events,
My Money, My Hardware, My Rights and My PIXIE. Prepare and Share remain the same
media/rights/manual-publishing workflow. The central styles.css and existing
Streamplace module remain in use. Text-size preferences use the existing style
variables. Public shortcut preferences also use localStorage as documented below; private project content is not stored there.

Companion remains the private administration/identity/persistence owner. From its
selected project, **Open selected project in Creator OS** asks explicit consent
before sending name, purpose and last saved creative draft into the opened tab.
No notes, other projects, tokens or media bytes are transferred. The connection
checks exact origin AND opened-window identity. Return is a draft for review;
only **Save returned draft to its private project** adds a creator note through
the existing authenticated/CSRF-protected workspace service. Save rechecks the
verified DID, rejects account changes/expiry, and targets the originally granted
project rather than a caller-supplied project ID. A repeated identical receipt is
not appended again in the sequential review flow. This is not a distributed
idempotency mechanism or a grant to a third-party app.

Sign-out/disconnect clears linked private text/media from the Creator tab. Closing
Companion also disconnects when detected. The browser cannot revoke an explicitly
exported/downloaded file or guarantee instant revocation in a suspended tab. Keep
private work off shared devices. Reopening through the same signed-in Companion
project restores the last reviewed saved draft, with fresh publishing review and
media re-selection. There is no second OAuth provider, connection key, project
database, automatic synchronization or source relocation.

Both review candidates must be installed to use this handoff. Current production
and original Site are unchanged. Browser policy may sever window.opener; detect a
missing connection and retain portable export/import rather than weakening the
origin checks. The trusted Creator origin is ibloud.github.io, shared with the
owner's other GitHub Pages repositories; those pages' origin integrity is part
of release security review. Never add arbitrary preview origins to the trust list.

### External compatibility checked for this slice

| Surface | Implemented boundary and evidence | Remaining dependency |
|---|---|---|
| AT Protocol | Reuses Companion's DID session; no new scope/client metadata. [OAuth](https://atproto.com/specs/oauth), [permissions](https://atproto.com/specs/permission), [Lexicon](https://atproto.com/specs/lexicon) | Live provider acceptance and protected production release remain open |
| plyr.fm | Explicit public search uses documented /search/?q=…&type=tracks&limit=5; opens /track/{id}, stores creator-supplied rights plus URI/CID when supplied. No token/private context sent. [Developer docs](https://docs.plyr.fm/developers/) | Live API/CORS and actual playback NOT VERIFIED; no ownership or reuse rights inferred |
| Streamplace | Existing opt-in /embed/{handle} viewer retained. [Embed docs](https://stream.place/docs/features/embed/) | Real live stream/account/moderation acceptance; no broadcasting |
| OpenMeet / atmo.rsvp | Keep community.lexicon.calendar.event URI, title and app URL as a source reference; external actions remain in the app. [OpenMeet](https://openmeet.net/bluesky-login-one-year-later), [atmo.rsvp](https://atmo.rsvp/) | No automatic event retrieval, RSVP write or audience authorization |
| Smoke Signal | Read-only archive reference, not new registration destination. [Source status](https://tangled.org/smokesignal.events/smokesignal/tree/sunset-read-only) | No mutation adapter |
| Tickets | Read-only local availability presentation; official signed callback fixtures tested outside production. [Build](https://atmosphere.tickets/docs-build), [callbacks](https://atmosphere.tickets/docs-callbacks) | App registration, test environment, organizer/buyer grants, durable verified receiver, capacity/check-in sandbox acceptance |
| ATM | Primary payment candidate; information handoff only, checkout disabled. [App terms](https://atmosphere.money/app-terms) | Closed beta access, merchant/organizer approvals, payment status and settlement verification |
| atcash | UNAVAILABLE: current public API, licensing, restrictions and settlement could not be verified | Investigate authoritative source; retrieval failure is not proof of absence |
| Hardware | Browser API presence only; existing tools/native bridge and canonical Device Stewardship guidance reused | Physical iPad/iPhone, audio/MIDI/controller/display tests; no driver claim |

WORKING means a demonstrated local function; CONNECTED means an active explicit
Companion handoff or actual received service data, not blanket service authority.
AVAILABLE links open another app. PLANNED has no implemented operation.
UNAVAILABLE reports missing permissions, connectivity or unverified capability.
Public metadata does not establish creator ownership, playback, licensing or
permission to publish. Financial/ticket records never enter public PDS writes.

Official local test tooling is pinned to @atmosphere-money/app-node 0.0.0-beta.5
and @atmosphere-money/testing 0.0.0-beta.3 (MIT, from npm). It is CI/test-only;
no SDK or secret ships in the page. Default beta.3 ticket helpers still use tierId;
use the generic signed fixture helper with current ticketTypeId fields. The static
ticket-fixture.json is a safe, docs-shaped availability example and summary of
synthetic callbacks, not authoritative inventory or a checkout backend. Missing
capacity remains “not supplied”; zero is preserved as zero. No local inventory,
scan-token authority, or payment success is implemented.

Cross-application browser reproduction: build Companion's reviewed module, then
run its tests/browser-creator.cjs with PIXIE_CREATOR_ROOT pointing to this checkout
and PIXIE_PLAYWRIGHT_MODULE / PIXIE_CHROMIUM selecting the existing test runner.
It exercises a real local Companion server with synthetic upstream OAuth and
public music responses: sign-in → private project → original local asset → music
reference → synthetic event/availability → reviewed save → reopen → logout,
account separation and resume. This does not establish real provider/sandbox,
production persistence, physical Safari/VoiceOver or payment acceptance.

The shared Companion account-picker correction preserves the submit pointer
gesture until click completes. Previously, hiding suggestions/status on blur
could move Continue before the click landed. The cross-app test requires one
pointer gesture to submit and verifies the resulting DID; no identity or OAuth
metadata was changed. Original Site/static-origin identity regressions also pass.

Local full-slice result: PASS with synthetic A/B accounts, real private HTTP routes,
reviewed note persistence, media re-selection and fresh publishing review on
resume. Keyboard focus and sampled text contrast pass across all eight panels;
320/390/820/1440px reflow passes with 28px text. The test validates actual callback
303/location responses but routes their follow-up locally to avoid accidental live
requests from the browser harness. Real provider cryptography is not mocked into
a production success claim.


## My Apps amendment — 27 October 2026

`interoperability.js` remains the adapter registry. Its optional `app` metadata
owns names, fixed destinations, capability boundaries and categories. My Apps
is a personal selection from that registry, not a copy of the Atmosphere catalog
or another OAuth system. `my-apps.js` renders that selection through the existing
Creator draft and navigation. No custom URL, token, provider permission or
connection claim is accepted from a saved app entry.

**Working locally:** Add, Launch in a separate tab, Return, Remove, category/name
filter, earlier/later ordering, public Streamplace handle configuration, existing
public music search and existing optional viewer. Launch keeps the creative tab
open, sends no draft data and uses `noopener noreferrer` and no-referrer.
No application is installed by Add or Launch. Native/PWA installation stays
with the target and platform; this slice does not claim an installer.

**Persistence:** app IDs/order and the optional public viewer handle travel in
`environment.apps` in the existing `pixie-artist-draft/v1`. Older drafts without
apps still import. Unknown/duplicate IDs and unsafe handle values are rejected;
extra credentials, URLs, owner claims and connection flags are stripped. Public
sharing text excludes the collection. In a connected project, app choices are
kept by the same reviewed Companion save as the creative draft; reopen that
project to resume. This is a per-project collection, not a claimed global account
catalog. Private selections never write the device shortcut key. Locally, only
public shortcut preferences use `pixie.creator.apps.v1`, following the existing
device-preference localStorage pattern. Storage denial is disclosed; export is
the fallback. Clear this workspace removes those local app preferences.

**State:** Available/Added describe catalog and selection, not proof of a live
service. Connected requires the existing explicit Companion project handoff.
Authorization required points to that handoff, not a second browser key. A tab
without a handoff does not know whether Companion is signed in; the badge and
My Apps now state that fact. Unsupported labels the unimplemented **account
control** operation, not the ability to launch an app. atcash is Unavailable
because a supported destination was not verified. No third-party account is
marked connected merely because the person signed in to Atmosphere. The
Streamplace control requests public viewing only; no broadcast or account grant.

**Consent/revocation:** connect the selected private project using Companion's
existing consent and Disconnect clears that granted context. Existing Streamplace
Load/Remove player controls start/stop its public frame. Removing a shortcut does
not revoke a provider grant. Third-party OAuth control adapters are not implemented;
authorize and revoke in the source app/account host. This work adds no scopes.

**Maintained discovery, verified 27 October 2026:**
[Atmosphere Account Apps](https://atmosphereaccount.com/apps) provides an app
catalog and categories; [Eurosky Portal](https://portal.eurosky.tech/) provides
app discovery and its own account-management UI. PIXIE links them on demand.
Neither has a verified catalog-sync API in this review; no account scraping,
catalog mirroring, auto-sync or private data request is made. The existing
canonical ecosystem map and source links above retain project responsibility.
App descriptions are concise summaries, not endorsement or affiliation claims.
Approved third-party logo artifacts were not recovered in this checkout; this
slice uses actual app names and no invented logos. The referenced Eurosky
screenshot was not available in the current attachments; no screenshot was copied.

Presentation authority and preserved tokens are recorded in existing
[design QA](../design-qa.md). Every executable HTML page now loads only
`styles.css`, with surface-scoped rules preserving existing layouts and identities.

### Repeatable checks

- `node tests/my-apps.test.js`: registry, state, strict portable preferences,
  backward compatibility, sole stylesheet and no inline competing rules.
- `node tests/browser-my-apps.test.js`: Add/configure/order/Launch/return/restore/
  Remove, denied storage, filtering, keyboard, large text and page layout smoke.
  Uses the existing Playwright dependency; `PIXIE_CHROMIUM` can select a local
  Chromium executable. External launch destinations are synthetic fixtures.
- `PIXIE_CREATOR_ROOT=$PWD PIXIE_COMPANION_ROOT=/path/to/reviewed/apps/companion
  node tests/browser-companion-apps.cjs`: extends the existing paired Companion
  acceptance journey using its actual server/private storage and synthetic OAuth
  fixtures. Use reviewed Companion commit `fbd7d3f`; no live credentials. Checks
  Add/Launch/return/private save/reopen/Remove, exact project continuity,
  isolation, sign-out and explicit connection revocation. This paired test is
  local acceptance, not Creator-only CI or a production release.

The paired Companion correction remains separately staged and release-blocked.
The protected Vercel preview cannot demonstrate private handoff: its origin is
not trusted, and that boundary is preserved. Live OAuth/provider revocation,
service availability, native/PWA installation and physical iPad Safari/VoiceOver
remain unverified. No merge, Companion branch update, Railway change or production
publication is authorized by this amendment.
