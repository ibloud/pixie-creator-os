# Demo → Next Stable Version

## Current release boundary
The public build is a stable demo/pre-alpha. Network Intelligence demonstrates local discovery and human-reviewed actions without claiming live external network integration.

Current flow: demo/public-source signal → human review → ADD CARD or SEND INVITATION → local demo record → optional existing PIXIE storage seam.

## Definition of next stable
A contributor must be able to reproduce the core workflow from a documented test procedure, and every external capability must have an explicit, verified boundary.

### Gates
**A — Runtime:** browser smoke test, core panels, Network Intelligence mounting, keyboard/focus, reset/recovery.

**B — Data:** documented signal/card/invitation schemas, provenance, verified vs unverified dates, deterministic deduplication.

**C — Storage:** PIXIE identity, explicit persistence success/failure, no confusion between demo state and canonical workspace content.

**D — External:** explicit adapters, documented scope, supported credential boundary, observable requests, surfaced failures, source timestamps/URLs, refresh rules, no accidental autonomous outreach.

**E — Human action:** visible action, explicit confirmation, recorded local state transition, clear result/failure, no hidden follow-up.

## Implementation sequence
1. Add automated coverage for current local behavior. 2. Separate data operations from UI where useful. 3. Define normalized signal/provenance schema. 4. Add a source adapter interface without enabling live sources by default. 5. Add source fixtures. 6. Implement verified ingestion. 7. Connect durable PIXIE persistence. 8. Implement approved outreach separately. 9. Run verification. 10. Update README, architecture, handoff, and release notes together. 11. Cut a new version boundary only after evidence exists.

## Explicit non-goals
Autonomous networking, engagement optimization, private-data collection, automatic introductions/posts/replies, opaque replacement of human review, and durable inferred relationships without provenance are not requirements of the next stable release.

## Completion record
Record version/tag, commit SHA, test procedure, browser/runtime verification date, external services actually connected, required permissions, limitations, reset/migration instructions, and documentation updated.