# Story Router: file handoff and local harness

## Decision and implemented boundary

Find public material in the existing Story Finder, export a ledger, import it into Creator OS, select sources, choose a destination, add context, preview the exact public representation, and explicitly reshare. This does not introduce private Atmosphere drafts or another search implementation. A future live send is public publication; deletion cannot guarantee removal from downstream copies.

This change implements the v1/v2 importer, routing contract, fake destinations, and an Atmosphere panel harness. Real ATProto authentication, pckt publishing, postgate lookup, and live writes are **NOT IMPLEMENTED**. Blog names in the destination chooser are simulation examples, never source-based routing rules. URI/CID values in simulated receipts are test values, not verified protocol records.

No network calls occur on import or simulation. Import stays in tab memory until the user confirms a simulation; that action saves a Story with its intention and receipt through `PIXIE_STORY_ENGINE.save` and its existing recovery behavior. The same `publish.router` fields survive reload. No new database or canonical storage layer is introduced. Browser story storage remains a recoverable pre-alpha working cache under the existing workspace contract.

## Import and ownership

`story-ledger.js` accepts a file string or object, rejects unknown versions, malformed post URIs, contradictory author DID, duplicate URIs, and malformed v2 metadata. It constructs safe DID-based source URLs and ignores arbitrary imported fields. Identity is supplied by a trusted host session as `signedInDid`; the file's searched actor never grants ownership.

Without connected authentication, the UI offers references only and discards all imported source text. The contract harness exercises own-source embedding/quotation using an injected test identity; this is not a sign-in implementation.

V1 sources retain `provenance: v1-degraded` and reference-only routing. Text is immediately removed for strangers and for v1 reposts. An injected `getPost(uri)` adapter can refresh current metadata via `PIXIE_LEDGER.refresh`: current CID is labeled `cidSource: import`, and own legacy text is `text-matched` or `edited-since-selection`. It never reconstructs the historical selected CID. Null means unavailable; a transport or metadata error means unknown. The refresh boundary is tested with fixtures; live `getPosts` is not connected here.

V2 sources retain `cidSource: selection`. Refresh preserves their original CID and marks a changed current CID as `edited-since-selection`. A missing source or changed version stays reference-only.

## Source representation and consent

Allowed forms are the intersection of destination `supports` and source policy. Unknown/disabled embedding restricts strangers to references. Own sources with unknown permission can embed or quote, with an embedding warning in the preview; an explicit disabled setting blocks embed/quote even for own sources. Quoting someone else's words additionally needs explicit consent and separately supplied `consentedText`; imported stranger text is never reused. Made Sick destinations set `consentFirst` and require explicit source publication consent, including for references.

The current UI deliberately offers references only because sign-in is absent. `preview` rechecks the selected destination and source restrictions each time. Input/destination changes invalidate UI approval. The representation separates creator context from source references or source-authored text.

## Publishing contract and recovery

Adapters declare `id`, `supports`, `writable`, optional `consentFirst`, `lookup(key)`, and `put(key, payload)`. A real adapter must validate its destination identity, lexicon, write authority and protocol records; persist one preselected key using an idempotent write; and return `{uri, cid, snapshot}` matching the exact accepted payload. The generic router does not encode pckt record types.

The router stores the intention's key, destination, and frozen representation in existing Story storage **before** attempting a write. It refuses to write when storage is quarantined or memory-only. Lost responses stay `unconfirmed`; retry reconciles the same key through lookup and an idempotent put. It validates receipt shape and representation, prevents simultaneous sends for one Story, and deduplicates receipts. Receipt storage failures retain recovery data and report persistence separately from destination success.

Receipts include destination, key, URI, CID, sent time, and `storySnapshot`; an edit to the local story does not alter an earlier receipt. Comparing the current preview to that snapshot detects divergence. Destination CID identifies the remote record, not the local Story. Changing a completed publication or cross-posting requires `startSeparateReshare`, an explicit new intention preserving prior receipts. Unconfirmed sends must reconcile first.

## Reproduce

Open Atmosphere, choose a ledger from Files, select sources, choose any simulation destination, enter context, and preview. Confirm local simulation to see and store a simulated receipt. Lost-response accepts the first write but hides its response; retry returns the same record. Read-only allows preview export for manual handoff. Offline and permission-denied exercise failures. Load a saved routing Story to inspect/retry after reload. Use Export story recovery when storage reports a problem.

Run `node --test tests/story-router.test.js`, `node tests/story-storage.test.js`, `node tests/story-engine-smoke.js`, and `node tests/interoperability.test.js` from the repo root. CI includes the router tests. Browser layout, keyboard navigation, and iPad Safari/Files remain device checks; DOM automation does not close them.

## Live pilot sequence (future adapter)

1. Pass destination override, per-destination formats, lost-response, storage recovery, and consent tests.
2. One approved public write under a test account/test publication; validate its real URI/CID and remove the record while acknowledging possible downstream retention.
3. Own `ibloud.xyz` post to a user-chosen `pixie.pckt.blog` destination.
4. Made Sick route, cross-route, and explicit separate cross-posting.
5. Someone else's post last, with explicit consent and confirmed restrictions.

Postgate verification is separate and any failed read remains unknown. No live publication is authorized or performed by the harness.
