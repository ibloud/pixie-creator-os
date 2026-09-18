# PIXIE Creator OS — Stable Pre-Alpha Handoff

## Purpose

This document is the handoff boundary for the stable pre-alpha build.

It is written so a future maintainer — including someone encountering the project after a long gap, in another institutional context, or effectively as a "time traveler" — can determine what is real, what is proposed, where the canonical strings live, which records define the world of the project, and what must not be silently rewritten.

The goal is **continuity without mythology**.

A maintainer should be able to return to this repository and reconstruct the project's state from versioned evidence rather than memory.

## Stable pre-alpha meaning

The stable pre-alpha is a **frozen working foundation**, not a production claim.

At handoff:

- Creator OS is local-first.
- Obsidian is the durable human-facing workspace.
- `pixie_id` is the machine identity.
- Local Story / Source Memory behavior is the canonical implemented spine.
- The browser-native workstation is the current executable surface.
- ATProto is the intended social/identity interoperability layer, but Creator OS ATProto authentication and publishing are not connected.
- The companion 50 Ways repository contains the public, read-only Pixie v0.1 ATProto discovery experiment.
- External services remain adapters unless the repository explicitly records a verified connection.
- Planned behavior is not implemented behavior.
- A passing repository check is not evidence of an external service being available.

## The three-layer world model

```
50 Ways / ATmosphere
    discover · context · bridge · tour · release
                 │
                 │ explicit user choice
                 ▼
PIXIE Creator OS
    create · manage · preserve · author
                 │
                 │ optional publication
                 ▼
AT Protocol / external services
    identity · social records · publishing
```

Current honest shorthand:

> **Pixie v0.1 discovers. Creator OS creates. ATProto connects them.**

That sentence describes the architecture; it does not imply that the connection is already implemented.

## Canonical sources of truth

Use the following order when resolving contradictions:

1. **Versioned repository code** — what the current build actually does.
2. **Versioned repository documentation** — the declared contract and boundaries.
3. **Explicit provenance/source records** — what was observed, when, and from where.
4. **External service records** — authoritative only for data owned by that service.
5. **Human-readable names, URLs, screenshots, or recollection** — useful presentation/context, never identity by themselves.

Do not resolve a contradiction by silently editing history.

If an old statement was wrong, preserve the correction as a correction.

## Strings / language contract

User-facing strings are part of the product surface.

A maintainer should distinguish:

- **identity strings** — product/project names and stable identifiers;
- **status strings** — WORKING, LOCAL ONLY, ADAPTER READY, PLANNED, NOT IMPLEMENTED, BLOCKED;
- **behavior strings** — what a control actually does;
- **provenance strings** — why something was surfaced or preserved;
- **disclosure strings** — boundaries, permissions, limitations, and uncertainty;
- **narrative strings** — creator-authored story/content;
- **marketing language** — descriptive language that must not be allowed to become a technical claim.

Rules:

1. Never make a future capability sound implemented by changing copy alone.
2. Never turn an inference into a factual statement through wording.
3. Keep uncertainty visible where it materially affects interpretation.
4. Preserve the distinction between fact, claim, interpretation, fiction, and historical material.
5. When changing a consequential user-facing string, update the relevant documentation or test if the string expresses a behavior contract.
6. Do not rename stable machine identifiers to improve presentation.
7. Human-readable names may change; `pixie_id` identity must not.

## Reality / world-state contract

The project has multiple kinds of "reality." Keep them separate.

### 1. Repository reality

What exists in the committed tree at a particular revision.

### 2. Runtime reality

What the current browser or local application can actually execute.

### 3. External reality

What an external service, person, organization, account, device, or network actually provides.

### 4. Narrative reality

What a Story intentionally represents. Narrative material is not automatically a factual claim.

### 5. Proposed future reality

Architecture, plans, mockups, adapter boundaries, and community questions.

These categories must never be collapsed.

A future maintainer should be able to ask:

> "Is this true in the code, true at runtime, true in an external system, true only inside the story, or merely proposed?"

The repository should answer without requiring the original author to be present.

## Time and provenance

Every important external observation should be treated as time-bound.

When recording an external fact or discovery, preserve where practical:

- source;
- source type;
- observed/captured timestamp;
- original URL or record reference;
- relationship to the current Story/project;
- preservation/snapshot reference when available;
- expiry or refresh expectation for derived observations.

Do not backdate current observations to make the project history look cleaner.

Do not treat an old directory listing, feed result, API response, or public profile as permanently current.

## Identity contract

```
Names = presentation
PIXIE IDs = machine identity
Paths = implementation details
```

A filename, folder name, display name, URL slug, or human nickname must not become the canonical identity of a creator object.

When moving or reorganizing workspace material:

- preserve `pixie_id`;
- preserve provenance;
- preserve source references;
- update paths as implementation details;
- never infer identity from a changed filename.

## External integrations

The README is authoritative for the current connection boundary.

At stable pre-alpha, do not claim as connected merely because an adapter, plan, link, or UI placeholder exists:

- ATProto authentication/publishing;
- plyr.fm publishing;
- Mixxx hardware drivers;
- Streamplace/Germ;
- Apple/native production entitlements;
- external ArchiveBox deployment;
- production network credentials.

An integration becomes a claimable capability only after it has an implementation, a repeatable verification path, and documentation stating its status.

## ATProto handoff boundary

The current intended seam is:

```
ATmosphere discovery
        ↓
evidence + provenance
        ↓
explicit user choice
        ↓
Creator OS workspace
        ↓
PIXIE ID / project / source / story
        ↓
optional future publication
```

The stable pre-alpha does **not** authorize:

- automatic follows;
- automatic posts;
- automatic replies;
- automatic introductions;
- autonomous outreach;
- private-data scraping;
- durable public personality/inference records;
- engagement or follower-growth optimization.

## What a future maintainer may change

Normal maintenance may include:

- bug fixes;
- accessibility fixes;
- browser compatibility fixes;
- documentation corrections;
- provenance corrections;
- security/privacy corrections;
- test improvements;
- adapter implementation behind an existing boundary;
- community-requested interoperability corrections.

When a change alters the declared architecture, identity model, public behavioral contract, or privacy boundary, create a new versioned architectural decision rather than silently modifying this handoff.

## What requires a new release boundary

Create a new release/version boundary before introducing:

- a new canonical identity model;
- a new durable public record type;
- autonomous external actions;
- a new protocol requirement;
- a change from local-first to network-required operation;
- a new authority over creator or social data;
- a change that makes a previously ephemeral inference durable;
- a new product role that materially changes what Pixie or Creator OS is.

## Verification ledger

Use these status words consistently:

- **IMPLEMENTED** — code exists.
- **VERIFIED** — behavior has been confirmed by a repeatable test or external observation.
- **OBSERVED** — a pilot/community observation has been recorded.
- **PLANNED** — intentionally mapped for future work.
- **NOT IMPLEMENTED** — deliberately absent.
- **BLOCKED** — dependent on something outside the repository.

Never replace NOT VERIFIED with VERIFIED because a feature "looks like it works."

## Community handoff

The ATProto community workspace is:

- `docs/atproto-community.md`
- GitHub Issue #15 in this repository
- companion 50 Ways verification Issue #39

Use those spaces for interoperability corrections and implementation questions.

The project is asking for inspection, testing, correction, and contribution — not endorsement.

## Final pre-alpha rule

If a future maintainer cannot tell whether a statement describes **code, runtime behavior, an external system, narrative content, or a proposal**, the documentation has failed.

Fix the documentation before expanding the system.

> **Preserve the strings. Preserve the sources. Preserve the identities. Preserve the distinction between what happened, what is happening, and what we imagine could happen. Then build from the evidence.**
