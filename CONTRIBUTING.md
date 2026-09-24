# Contributing to PIXIE Creator OS

## Start here
PIXIE Creator OS is a browser-native, local-first creator workstation. The current public demo is a stable pre-alpha foundation plus deliberately scoped local demonstrations.

Before changing behavior, read:
1. README.md
2. docs/stable-prealpha-handoff.md
3. docs/architecture.md
4. docs/network-intelligence.md when working on Network Intelligence

The repository distinguishes implemented behavior from adapters, proposals, observations, and narrative material. Preserve that distinction.

## Contribution rule
For every change, answer: What does the code do? What can a user reproduce now? Does it contact or depend on an external system? What new claim, permission, identity, or durable record does it introduce?

If those answers are unclear, document the boundary before expanding the feature.

## Local development
1. Serve the repository root through a local HTTP server. 2. Open index.html. 3. Exercise the changed workflow in a browser. 4. Check the console. 5. Test keyboard navigation and visible focus. 6. Check status/disclosure language.

A local browser result does not prove an external integration works.

## Status vocabulary
- WORKING — implemented and demonstrable.
- LOCAL ONLY — works without an external service.
- ADAPTER READY — boundary exists; external integration is not connected.
- PLANNED — intentionally mapped future work.
- NOT IMPLEMENTED — deliberately absent.
- BLOCKED — dependent on an external prerequisite.

For verification records use IMPLEMENTED, VERIFIED, OBSERVED, PLANNED, NOT IMPLEMENTED, and BLOCKED. Do not silently upgrade a status because a mock, placeholder, link, or UI control exists.

## Pull request expectations
State what changed, what is demonstrable, what remains local/demo-only, how it was tested, whether external services were contacted, and whether identity, provenance, storage, privacy, or autonomy boundaries changed.

If the public behavioral contract changes, update documentation in the same PR.

## Stable-demo acceptance checklist
- [ ] Core UI loads.
- [ ] Changed workflow is reproducible.
- [ ] No credentials or private keys are committed.
- [ ] External calls are absent unless explicitly documented.
- [ ] Human confirmation remains before consequential external actions.
- [ ] Provenance and uncertainty are preserved.
- [ ] Stable pixie_id identity is preserved.
- [ ] Keyboard/focus behavior remains usable.
- [ ] Reduced-motion behavior remains usable where relevant.
- [ ] Documentation matches implementation.
- [ ] Future capability is not described as connected.

## Path to the next stable version
1. Verify the current demo with a repeatable browser smoke test.
2. Formalize source adapters and provenance/refresh/failure contracts.
3. Formalize the PIXIE object contract for network cards.
4. Add tests for state transitions, deduplication, source validation, provenance, persistence, and unverified dates.
5. Separate external retrieval and message delivery into explicit, permissioned adapters.
6. Verify each external integration before enabling it in the public demo.
7. Update README, architecture, handoff, and release notes together.

## Release-boundary triggers
Stop and create a new architectural/release decision before introducing network-required operation, automatic external actions, a new canonical identity model, new durable public record types, private-data ingestion, a new authority over creator/social data, or a protocol requirement that changes the interoperability boundary.