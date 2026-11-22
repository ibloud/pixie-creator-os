# Digital Jockey Network — Creator OS product space

**Status:** Product direction accepted for exploration; local prompt-generator page is an MVP utility. A social network, Apple Music account connection, timestamped listening-history import, AT Protocol publishing, follows/feed, comments, and live audio broadcasting are not implemented.

## Breadcrumbs

**Loptr Lab / PIXIE Ecosystem Guide → PIXIE Creator OS → My Audience → Digital Jockey Studio → Play It Forward / Your Week on Air**

Cross-project return path:
**Play It Forward → Your Week on Air → PIXIE Creator OS / Digital Jockey Studio → project prompt generator → creator's own project**

- [PIXIE Creator OS](../README.md)
- [Digital Jockey Studio](../digital-jockey.html)
- [Play It Forward — Your Week on Air](https://loptr-lab.github.io/pay-it-forward/radio/)
- [Play It Forward implementation PR](https://github.com/Loptr-Lab/pay-it-forward/pull/27)

## Product relationship

Creator OS is the maker's workspace and project starter. Play It Forward is a public-facing community and first reference implementation. They are related but remain separate products, deployments, and data authorities.

A person such as Branson should be able to:
1. Create a DJ/station identity and choose a public display name.
2. Curate a weekly show from tracks they choose to share.
3. Add a DJ note, track order, artist credits, and official listening links.
4. Publish/share a show explicitly.
5. Discover and follow other DJs when the social-network layer is available.
6. Revoke or edit their own public show according to the eventual publishing adapter's rules.

A creator who wants to build a project like Play It Forward should:
1. Open Digital Jockey Studio from Creator OS → My Audience.
2. Describe their concept, audience, editorial point of view, participation model, platform, and first-version features.
3. Generate, edit, copy, or download a reusable project prompt.
4. Use that prompt with a coding assistant or developer; it asks for a repository audit, product brief, architecture, tests, and staged implementation before production changes.

## Product architecture

```
PIXIE Creator OS
  ├── My Studio: prepare media, show notes, credits, rights, accessibility
  ├── My Audience: DJ identity, stations, show archive, discovery and community
  ├── My Apps: optional Apple Music / plyr.fm / streaming / social destinations
  └── Digital Jockey Studio: project brief + prompt generator
                 |
                 v
       Play It Forward (reference public experience)
          ├── Your Week on Air (weekly show builder)
          ├── DJ / station profiles (planned)
          ├── follow / discovery feed (planned)
          └── shareable shows and tracklists
```

## Data and authority boundaries

- Creator OS local drafts and project files remain in the existing local-first workspace contract.
- Play It Forward public show content is separate from private Creator OS projects.
- Public sharing is an explicit act. Private listening history is not public by default.
- A tracklist and external listening link are not audio hosting or permission to rebroadcast.
- Preserve artist attribution, source URL, track metadata provenance, and corrections.
- AT Protocol is the preferred interoperable social-network candidate because Creator OS already documents the ATmosphere direction. However, ATProto authentication/publishing is not connected in Creator OS. Evaluate existing community Lexicons before proposing new ones.
- Do not infer listening history from playlist membership. Do not claim a verified rolling seven-day listening history without timestamped play events.
- Apple Music integration requires a reviewed MusicKit/developer-token flow and explicit user authorization. Use only data actually provided by the authorized API; otherwise let users curate manually.
- No audio uploads, live broadcasting, direct messages, follows, or external publishing are implied by the current MVP.

## Prompt generator

The Digital Jockey Studio page produces a reusable build prompt locally in the browser. It does not call an AI model, transmit the brief, save it to a server, create a repository, or deploy a project. The output includes product definition, information architecture, data/permission boundaries, provider adapter requirements, AT Protocol research, accessible MVP, tests, and release gates.

## Phased roadmap

1. **Now — manual radio MVP:** shareable show builder, user-curated tracklist, DJ note, official music links, read-only share page.
2. **Creator OS project starter:** prompt generator and reusable project brief. This local utility is now implemented.
3. **Portable DJ identity:** evaluate ATProto identity and profile conventions, source-owned records, moderation and deletion semantics.
4. **Community layer:** follow DJs/stations, discover shows, recommend tracks, curated feeds, report/block/moderation, user controls.
5. **Music-service connection:** Apple Music authorization and import with truthful "recently played" labelling; exact seven-day history only if timestamped data collection is available and opted into.
6. **Broadcast/live layer:** separately scoped rights, hosting, provider policy, and live distribution review.

Each phase requires source review, capability/permission matrix, tests, accessibility and privacy checks, and separate deployment acceptance. Do not collapse the phases into a claim that a social network or Apple integration is already live.

## Verification

- The prompt generator builds output entirely client-side.
- Copy/download is a user-initiated action.
- The page labels the integration and publishing limitations.
- No credentials, account data, or private listening history are collected.


## Capability disclosure — works / planned / needed

This is the source-of-truth status distinction for the Digital Jockey workstream. “Planned” is not a shipped capability; “needed” lists work that must be completed and verified before a feature is described as available.

### Works now (in the proposed review branches)

- Creator OS Digital Jockey Studio renders a project brief form and generates an editable prompt in the browser; copy and download are user-initiated.
- Play It Forward / Your Week on Air lets a person manually enter a show title, DJ note, track title, artist, and external listening URL; it encodes the show in a URL fragment and provides a read-only share view.
- The prompt and show builder do not require an account connection. Play It Forward's share payload is not uploaded to the server.
- The cross-project links explain how to move between the creator-side project starter and the public-facing show experience; they do not connect identities or data stores.

### Planned (not implemented or not yet verified)

- Persistent DJ/station identity, profile pages, archives, follows, discovery feeds, recommendations, track submissions, comments, collaboration, and moderation.
- Apple Music authorization/import, automatic recent-played collection, timestamped listening history, and a verified weekly listening archive.
- AT Protocol authentication, portable DJ records, publishing, feed distribution, and account interoperability.
- Audio hosting, live broadcasting, scheduling, and any rebroadcast functionality.

### Needed for development and acceptance

1. **Product and governance:** decide profile ownership, public/private defaults, show visibility, edit/delete semantics, blocking/reporting, moderation responsibility, age/safety expectations, and community rules.
2. **Apple Music:** configure the developer identifier/token and MusicKit; implement explicit opt-in, token handling, scopes, revocation, data minimization, and tests against the exact API response. Do not promise timestamped seven-day history unless the source provides timestamped play events and the collection is enabled prospectively.
3. **Portable social layer:** review AT Protocol authentication, PDS hosting/identity, existing Lexicons, record ownership, moderation labels, deletion and migration semantics; implement and test a narrow publishing slice before feeds or follows.
4. **Persistent services:** choose and threat-model the backend, database, hosting, retention, backups, export/delete flows, rate limits, abuse reporting, and operational ownership for profiles and social functions.
5. **Rights and safety:** confirm link/provider terms, attribution requirements, music licensing and performance rights before any audio hosting or broadcast; external links alone are not rebroadcast permission.
6. **Quality and release:** write acceptance criteria; test consent/denial/revocation, private-data leakage, link tampering, accessibility, mobile behavior, moderation, recovery, and deployment rollback. Publish evidence and limitations with each release.

### Non-negotiable disclosure

A manually assembled tracklist is not proof of listening history. Playlist membership is not a play event. A tracklist/share link is not audio hosting or permission to rebroadcast. Private listening history is never public by default. Creator OS and Play It Forward remain separate applications and data authorities until a separately reviewed integration is built and explicitly authorized.
