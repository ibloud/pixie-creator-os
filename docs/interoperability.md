# PIXIE Creator OS — interoperability layer

The interoperability layer is the Soundiiz-inspired portion of PIXIE Creator OS: it separates a canonical PIXIE record from platform-specific representations.

## Flow

CONNECT → NORMALIZE → MATCH → REVIEW → PROVENANCE → SYNC

- CONNECT — select or implement a source/destination adapter.
- NORMALIZE — convert source records into a small common record shape.
- MATCH — compare title, creator metadata, and PIXIE identity.
- REVIEW — produce an explicit plan rather than silently writing.
- PROVENANCE — validate source, creator, rights/terms, required attribution, and lineage before a transfer can be approved.
- SYNC — reserved for adapters with real write capability and user authorization.

## Safety boundary

The current implementation is LOCAL ONLY.

It does not store third-party credentials, authenticate to external services, upload or delete external content, or claim a successful sync when only a match has been computed.

The adapter registry distinguishes WORKING, ADAPTER READY, PLANNED, and BLOCKED states.

## Canonical model

PIXIE object → normalize → common record → match → sync plan

The sync plan is either LINK for a confident correspondence or REVIEW when correspondence is uncertain.

This preserves PIXIE's existing rule: names are presentation, IDs are identity, paths are implementation details.

## Why this belongs in Creator OS

The value is not copying one platform's feature. It is establishing an interoperability control plane that can eventually coordinate creator records across media, publishing, social, workspace, and distribution services without making any one service the canonical home of the creator's identity.

## Governance: provenance and attribution

PIXIE is provenance-first. Attribution is a governance invariant, not a post-processing step. Every externally sourced or collaboratively produced asset must retain source, creator, rights/terms, required attribution, transformations, assembly lineage, and publication lineage where applicable.

The interoperability layer therefore validates provenance before a sync plan can become a LINK. Missing or ambiguous required provenance produces PROVENANCE_REVIEW and never implies an external write. See [Provenance & Attribution Governance](governance/provenance-attribution.md).
