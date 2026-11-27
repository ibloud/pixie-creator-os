# PIXIE MCP integration options

Status: recommendation; no service integration deployed.

Creator OS remains the local artist workspace. Reuse Holdings’ governed tool/router logic for an initial authenticated service adapter, with the embedded assistant pattern evaluated in Duet. Holdings’ existing game tools are not production artist capabilities; artist operations need their own contracts, authorization and tests. Tarantula can host an explicit opt-in comparison of interfaces once that service exists.

Backstage is a later option for repository catalog, documentation and developer actions. Its MCP Actions Backend exposes actions registered in a Backstage backend; it does not install directly into a static Pages site or supply media analysis, sample clearance or an assistant model. Introducing Backstage now would add a separately hosted application and authentication setup.

If adopted, register only scoped actions and enforce authorization and consent inside each action. Named-server filtering does not restrict the default endpoint: official docs state that it still exposes all registered actions. Action attributes and server instructions are descriptive, not substitutes for enforcement. Leave tool-payload tracing disabled for private creator material. Do not put backend credentials into Pages.

Candidate first tools: propose caption copy, propose an accessibility description for explicitly selected media, and list missing rights evidence. These return editable drafts or uncertainty; they do not declare legal clearance or publish. Publishing requires a separate reviewed action for the exact media, text, destination and revision. No personal or private material is transmitted before an explicit scoped choice.

## Mubert music API — product research note (2026-11-27)

**Status: research only. No Mubert account, API credentials, MCP connection, purchase, integration, generation, or permission has been established.**

The [Mubert API documentation](https://mubert.com/api/docs) describes a REST API and an MCP server for integrating music generation, library search, editing, and streaming into products. The documented API includes text-to-music and image-to-music, track generation and editing, stem replacement/removal, and streaming controls. Its MCP server exposes both read-only tools and quota-consuming generation/edit actions. The documentation says generated-track links expire and stream URLs carry access tokens.

Mubert’s [use-cases page](https://mubert.com/api/use-cases) explicitly targets apps, games, and creator tools, with pages for video editing, music creation and practice, podcasting, streaming, and interactive-story apps. It showcases integrations or partnership examples involving Canva, Picsart, and Restream. These are Mubert’s own market-positioning claims: they show intended product fit and examples of embedding the API, but do not independently establish customer outcomes, license scope, or fit for Creator OS.

This makes Mubert a technically plausible **optional music-service adapter** with an explicit creator-tools market fit. It does not make Mubert a current integration or an automatic product choice.

### Why Creator OS remains in research

Creator OS is currently a local-first workspace for preparing, reviewing, and manually handing off creative work. Its purpose is to coordinate a creator’s chosen tools and preserve context, attribution, permissions, and uncertainty; it is not intended to replace a DAW or require a particular music provider. Mubert supplies a service capability, while the product question is whether that capability solves a user-validated problem in our actual artist/producer workflow.

Before implementation, research must establish:

- whether the use case needs generated music, a curated-library search, editing, or streaming, and how it fits with the artist’s and producer’s existing DAW workflow;
- which exact API features and commercial, distribution, and sublicensing rights apply under the chosen plan and contract;
- the current price, quota, customer-seat behavior, expiration rules, and total cost for a bounded pilot;
- a secure backend design for credentials, consent, quota use, track retrieval, and failure or revocation;
- an artist-controlled review and export path, with provenance and license context attached to any retained result.

The API documentation itself distinguishes plan features and license limits. API access, a paid plan, or a generated track must not be presented as blanket clearance for distribution, resale, sublicensing, or use in a commercial release. Verify the controlling terms for the specific feature, plan, and intended use before any real production decision.

### Why Mubert is not a PDS candidate

Here, **PDS** means an AT Protocol Personal Data Server. A PDS is part of the user’s AT Protocol identity and repository infrastructure. Mubert’s documented endpoints are a separate, provider-operated music service with its own credentials, customer records, feature entitlements, quotas, generated media, and streaming. The API documentation does not describe Mubert as an AT Protocol PDS, a PDS host, or a service that stores user-owned AT Protocol repository records.

The Mubert MCP server is also not a PDS connection. MCP is an interface for an AI client to call service tools; it does not turn the service or its data store into AT Protocol infrastructure.

If a future, approved Creator OS feature uses Mubert, it would be evaluated as an optional service adapter behind explicit user choice and a secured backend. Creator-owned, reviewed metadata could be considered separately for portable storage only after a suitable AT Protocol record contract, user consent, and rights/provenance fields are defined. Do not write credentials, expiring track links, stream URLs, or generated audio into a public PDS by default. Media storage and publication permissions require their own decisions.

**Research decision:** keep Mubert in the service-evaluation stage. Revisit only against a specific user need, verified current terms and costs, and an approved privacy/security boundary. Do not add it to the PDS or represent it as connected.

Sources checked 2026-11-27:
- [Mubert AI Music API documentation](https://mubert.com/api/docs) — first-party technical description of API, MCP, authentication, licensing controls, track/library/stream endpoints, and plan cards visible on the documentation page. Documentation is product material, not independent legal review or proof that any account is entitled to a feature.
- [Mubert API use cases](https://mubert.com/api/use-cases) — first-party claims about target product categories and example integrations; not independent verification or proof of Creator OS fit.
- [PIXIE Creator OS README](../README.md) — current local-first workflow, manual reviewed handoff, and service-catalog provenance/status requirements.
- [PIXIE × AT Protocol — Community Workspace](atproto-community.md) — current Creator OS and AT Protocol boundaries, writable-PDS fallback semantics, and unimplemented authentication/publishing.
- [PIXIE Creator OS Integration Architecture](PIXIE-INTEGRATION-ARCHITECTURE.md) — optional-service and graceful-degradation principles.

Sources checked 2026-10-04:
- https://backstage.io/api/next/modules/_backstage_plugin-mcp-actions-backend.html
- https://backstage.io/docs/ai/mcp-actions/
