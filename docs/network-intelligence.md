# Network Intelligence — contributor guide

## Current status
| Capability | Status |
|---|---|
| Demo discovery queue | IMPLEMENTED |
| Human review gate | IMPLEMENTED |
| Add Card | IMPLEMENTED / LOCAL ONLY |
| Invitation record | IMPLEMENTED / LOCAL ONLY |
| Made-Sick source URL intake | IMPLEMENTED / LOCAL ONLY |
| Provenance and DATE UNVERIFIED disclosure | IMPLEMENTED |
| PIXIE workspace persistence | ADAPTER READY |
| Live crawling, automatic outreach, live synchronization, authentication | NOT IMPLEMENTED |

The UI disclosure is: **LOCAL DEMO · no external crawl or message is sent.** Do not weaken it unless the underlying behavior and release boundary change.

## Files
- network-intelligence.js — behavior, demo state, provenance, actions, persistence seam.
- network-intelligence.css — presentation.
- index.html — asset loading.
- docs/network-intelligence.md — this contract.

The feature mounts into #panel-recon .recon-page and waits for the RECON DOM because that panel can be created dynamically.

## Demo state
The demo uses localStorage key pixie-network-intelligence-v1. It stores cards, invitations, and activity. Demo signals are recreated from source constants. Stored records are not canonical creator content.

To reset the demo, clear pixie-network-intelligence-v1 for the site and reload.

## Add Card
ADD CARD creates a network-signal card with source reference, person/relationship, source URL, provenance, PROPOSED status, createdBy PIXIE, and timestamp. Duplicate cards are rejected. If PIXIE_STORAGE persistence is available, PIXIE attempts a workspace save; otherwise the record remains local demo state. Failed persistence must not be presented as success.

## Invitations
SEND INVITATION validates an email and creates a PENDING local invitation. It does not send email, contact a person, create an account, follow, publish, or infer consent. Duplicate pending invitations are rejected.

## Made-Sick intake
RECEIVE CARD validates a made-sick.org hostname and records the supplied URL as provenance. It does not fetch or crawl the page and does not contact Made-Sick. This is a source boundary, not a crawler.

## Provenance
Preserve source, source URL, provenance lineage, relationship/context, status, and verified date or an explicit unverified state. Do not convert an observation requiring verification into a factual event.

## Contributor test
1. Open the public demo and RECON / Network Intelligence. 2. Confirm the panel mounts reliably. 3. Add a card and repeat to test deduplication. 4. Test valid and invalid invitation email. 5. Confirm no message is sent. 6. Test non-Made-Sick and Made-Sick URLs. 7. Reload and confirm local records persist. 8. Clear localStorage and confirm reset. 9. Test keyboard/focus and reduced motion when relevant.

## Demo boundary
Do not add background crawling, private-data scraping, automatic follows/posts/replies/introductions, automatic email, hidden network calls, embedded credentials, durable public inference records, or engagement optimization as demo polish. These require a release-boundary decision.

## Next stable
1. Define source contracts and authoritative fields. 2. Add a typed source adapter with timestamps and provenance. 3. Add received/parsed/reviewed/verified/expired/rejected states. 4. Move durable cards through the PIXIE storage contract while preserving pixie_id identity. 5. Make outreach a separate, consented adapter. 6. Add automated tests for validation, deduplication, provenance, persistence, and transitions. 7. Add an integration test environment before live services. 8. Version the release boundary when network dependency or external effects change.

Target flow: public source → verified source adapter → normalized signal + provenance → human review → PIXIE object/card → explicit user action → optional external adapter.

When docs and behavior disagree, inspect code, reproduce runtime behavior, correct the docs, and create a new release boundary if architecture, privacy, identity, storage, or autonomy changed.