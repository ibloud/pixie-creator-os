# PIXIE Creator OS — Provenance & Attribution Governance

**Status:** GOVERNANCE INVARIANT  
**Scope:** Every creator asset, transformation, interoperability transfer, and publication path.

## Core rule

PIXIE is provenance-first. Attribution is part of the canonical creative record, not a downstream compliance step.

Every externally sourced or collaboratively produced asset MUST retain enough lineage to answer:

- Who created or supplied it?
- Where did it come from?
- What rights, license, or usage terms apply?
- What attribution is required?
- What transformations were performed?
- What creative output incorporated it?
- Where was the resulting work published?

## Required lineage

SOURCE → CREATOR → RIGHTS/TERMS → TRANSFORMATION → ASSEMBLY → PUBLICATION

Source-specific requirements may add fields, but adapters MUST NOT discard provenance merely because a destination does not expose equivalent fields.

## Publication gate

An asset with required provenance missing, ambiguous, or explicitly unresolved MUST NOT be silently published.

The system should produce a human-review state such as `PROVENANCE_REVIEW`, not infer ownership or invent attribution.

## Attribution behavior

When a source requires attribution, Creator OS MUST preserve the required attribution data through normalization, transformation, and publication planning.

Attribution may be rendered differently by each destination, but the canonical record remains source-aware.

## Identity

Names are presentation. Stable IDs are identity. Source IDs remain source-owned.

Paths are implementation details.

## Adapter contract

Every media source adapter should expose provenance metadata. Every publishing adapter must accept or explicitly account for attribution/provenance metadata.

An adapter that cannot preserve required provenance is not considered publication-ready.

## Auditability

Creator OS should be able to reconstruct the provenance chain for a published creative object without relying on a destination platform's memory of the source.

This governance applies to Unsplash and future media sources, creator-owned assets, collaborators, music, fonts, video, generated media, and federated records.
