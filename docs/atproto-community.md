# PIXIE × AT Protocol — Community Workspace

This is the working space for AT Protocol community review, implementation questions, interoperability feedback, and proposed contributions to PIXIE Creator OS.

## Why this exists

PIXIE currently has two complementary surfaces:

- **PIXIE Creator OS** — a local-first creator workstation for creating, organizing, preserving, and eventually publishing cultural work.
- **PIXIE / ATmosphere** — the open-network discovery layer being prototyped in the companion [50 Ways to Leave Another](https://github.com/ibloud/50-ways-to-leave-another) repository.

The intent is to compose existing AT Protocol primitives where possible, not invent protocol infrastructure prematurely.

## Current implementation boundary

### Implemented / inspectable

- Browser-native PIXIE Creator OS workstation
- Stable `pixie_id` identity model
- Obsidian-first durable workspace
- Writable-PDS fallback semantics documented
- Local Story / Source Memory architecture
- Companion PIXIE v0.1 read-only public ATProto discovery prototype
- Public ATProto AppView search adapter in the companion repository
- Explicit provenance, confidence, expiry, dismissal, bounded Tour, and Release concepts in the discovery prototype

### Not yet connected

- ATProto authentication in Creator OS
- ATProto publishing from Creator OS
- A production PIXIE ATProto agent/service
- A production custom feed
- Durable public PIXIE inference records
- Automatic follows, posts, replies, introductions, or outreach

Do not read planned adapter boundaries as existing integrations.

## The working model

```
                         PIXIE
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ATmosphere / Discovery             Creator OS
          │                                 │
    Discover · Context                 Create · Manage
    Bridge · Tour · Release            Library · Projects
          │                                 │
          └────────────────┬────────────────┘
                           │
                      AT Protocol
                 identity / social records
```

A useful conceptual loop is:

```
DISCOVER → CONTEXT → CONNECT → CREATE → PUBLISH → DISCOVER
```

This is a design model, not a claim that every connection in the loop is implemented.

## Questions for AT Protocol builders

### 1. Existing primitives

Where should PIXIE compose existing ATProto primitives rather than introduce new ones?

Relevant areas include:

- identity / DID
- records and repositories
- public social graph relationships
- custom feeds
- Firehose / Jetstream ingestion
- AppView indexing
- OAuth / authenticated actions
- Lexicons
- labels and moderation boundaries

### 2. Creator records

What creator/workspace records are already well-served by existing Lexicons?

Where would a portable creator record be useful, and where should Creator OS remain local/workspace-owned?

### 3. Discovery

The current Pixie discovery prototype treats a recommendation as an observation with provenance rather than a statement of fact.

Questions:

- What should be computed locally versus represented as an ATProto record?
- Which signals can be safely derived from public records?
- What provenance should accompany discovery?
- What should expire rather than become durable?
- Where should user preference and consent enter the model?

### 4. Custom feeds

Could PIXIE's bounded discovery model be expressed as a custom feed without turning it into an engagement optimizer?

The current design explicitly avoids optimizing for:

- impressions
- clicks
- session duration
- follower growth
- replies per user
- endless navigation

### 5. Creator OS ↔ ATmosphere handoff

The intended future seam is:

```
ATmosphere discovery
        ↓
explicit user choice
        ↓
Creator OS workspace
        ↓
PIXIE ID / project / source / story
        ↓
optional publication back to ATProto
```

What existing ATProto mechanisms best support this handoff?

### 6. What should NOT become protocol data?

A deliberate open question is whether internal inference should remain ephemeral.

The current position is:

> A private inference about a person should not automatically become a durable public social fact about that person.

Challenge this assumption, refine it, or provide existing protocol patterns that address it.

## How to contribute

This repository is intentionally open to:

- technical review
- architecture corrections
- interoperability suggestions
- implementation proposals
- Lexicon proposals
- custom-feed experiments
- security/privacy concerns
- browser and client testing
- examples from existing ATProto applications

Please distinguish **implemented behavior**, **proposed behavior**, and **questions** in contributions.

No endorsement or standardization is being requested. The goal is to make the implementation boundary visible enough for the ATProto community to inspect and help shape.

## Where to discuss

Use the companion GitHub issue as the primary community handoff for this workspace:

**ATProto community verification / interoperability discussion:**  
https://github.com/ibloud/50-ways-to-leave-another/issues/39

For Creator OS-specific implementation questions, open an issue in this repository and reference the relevant section of this document.

## Related work

- 50 Ways to Leave Another — companion conceptual/IP build
- PIXIE v0.1 — read-only ATProto discovery prototype
- Creator OS — local-first creation/workspace implementation

The architecture should remain deliberately small until the community identifies a concrete interoperability requirement.
