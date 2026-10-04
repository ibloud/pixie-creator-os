# ADR 002 — Focus the artist workflow

Date: 2026-10-04. Status: accepted for the v0.2 local workflow, following Dominique's implementation instruction.

## Problem and decision

The default workstation exposes research, DJ playback, simulated routing, architecture and project discovery before an artist can prepare a piece for sharing. Replace the default entry point with My work, Prepare, Share and Connections. Preserve existing tools and stored Story records at `tools.html`; do not migrate or delete them.

This is a versioned product-surface decision under the stable pre-alpha handoff. It introduces `pixie-artist-draft/v1` as an explicitly downloaded private local record, not a new public ATProto record or identity authority. `pixie_id` remains stable across edits and re-import. Existing Story and session schemas remain unchanged.

## Boundaries

Selected audio/video/image media remains in browser memory. Preview uses object URLs. No source fetch, account lookup, credentials, upload, publishing API, durable browser content storage, service automation, or public record creation is added. Draft text and user-reported publication links are exported only at user request. Explicit external links open services independently.

Every edit, media selection/removal, destination or permission change revokes sharing review and confirmation. Import restores an unreviewed draft. Publication links are self-reported and must not be upgraded to verified delivery. Download/copy requests do not prove the OS retained a file or another app received it.

OBS/DAWs remain production tools. Repurpose remains external distribution using supported sources. AT Protocol remains intended interoperability infrastructure; Bluesky is a concrete manual destination. Streamplace's existing optional viewer remains in additional tools and is not a broadcaster.

## Release scope

The default interface can be shipped after repository checks and desktop browser validation. This is a local workflow build, not a fully verified stable product or a verified iPad release. Do not tag it as a verified stable release until the existing device/recovery acceptance criteria and the new workflow checks have evidence. Deployment now depends on the reusable CI job.
