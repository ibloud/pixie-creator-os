# PIXIE Creator OS Integration Architecture

**Status:** Accepted for the Creator OS update  
**Principle:** No external service gets to become load-bearing merely because it is useful.

## 1. PIXIE is the navigator
PIXIE is the operating environment and navigator for the creator ecosystem. It does not attempt to replace every external tool with an in-app equivalent.

- **PIXIE** — operating environment / navigator
- **Atmosphere** — world and project map
- **Projects** — worlds / nodes
- **External services** — pluggable adapters and capabilities
- **Germ** — opt-in, private, consent-controlled communication handoff
- **Discord** — event/community adapter
- **SuperMe** — optional AI-mediated expertise/persona service

## 2. External services are optional
An external service may provide valuable capability without becoming required for PIXIE's core runtime.

Every service integration should identify: service name and ID; capabilities; integration type (link, embed, MCP, or adapter); availability state; primary destination; fallback behavior; and whether the service is optional or required.

The default is **optional**.

## 3. SuperMe integration
The SuperMe integration is staged:

1. **Now — link-out:** Creator OS provides a direct route to the SuperMe profile.
2. **Next — MCP:** Creator OS may expose an `ASK IBLoud` capability through SuperMe's documented MCP interface when an MCP connection is actually configured.
3. **Later — service registry:** PIXIE can discover and manage multiple optional MCP services.

Creator OS does **not** copy, scrape, or reproduce the SuperMe-trained voice/persona into the local runtime.

MCP connectivity does not by itself establish permission or technical support for embedding SuperMe voice/audio.

If SuperMe is unavailable, the user can still use Creator OS and the direct link-out path.

## 4. Violet's Revenge / Discord
Discord is treated as an **event adapter**, not PIXIE's communications backbone.

The Creator OS event hub provides event/project information, source-of-truth project links, participation boundaries, optional Discord community access, and separate private-communication handoff where appropriate.

A Discord OAuth connection or bot credential is not claimed as configured by this static Creator OS build.

If Discord becomes unavailable, event information remains usable.

## 5. Germ
Germ is a private/consent-controlled handoff layer. It is not assumed to replace the public project/community layer.

Public project information remains navigable in PIXIE and the project's own source of truth.

## 6. Atmosphere
Atmosphere is the map through which PIXIE connects worlds.

The Creator OS update exposes selected project worlds without turning those repositories into copies of one another. Links remain links; each project retains its own source of truth.

The source-of-truth PIXIE demo remains independently accessible.

## 7. AetherOS influence
AetherOS is treated as UX inspiration for application launchers, multi-window/panel interaction, clear application boundaries, and extensibility.

It is **not** a feature-count target. PIXIE does not need to reproduce another web OS's application inventory.

## 8. Graceful degradation
- SuperMe unavailable → Creator OS remains functional; link-out remains available when reachable.
- MCP unavailable → do not show the MCP capability as connected.
- Discord unavailable → event information and project links remain available.
- Germ unavailable → public/community surfaces remain available.
- External credentials absent → show the capability as unavailable/planned rather than simulating a connection.

## 9. Mobile behavior
Creator OS must remain usable as a conventional scrollable web experience on narrow screens.

The mobile layout therefore relaxes the desktop shell's fixed-height/overflow constraints while preserving the desktop application-window behavior.

## 10. Testing requirements
- verify mobile scrolling on narrow viewport
- verify desktop panel navigation
- verify all external links open intentionally
- verify unavailable integrations are clearly labeled
- verify no external credentials are exposed client-side
- verify the source-of-truth PIXIE demo remains unchanged

## 11. PIXIE Control Room
The Control Room is the orchestration surface for the identity-to-world journey:

**SuperMe → PIXIE → Atmosphere → World / Project → ASK IBLoud**

SuperMe may introduce the person represented by the profile. PIXIE provides the spatial/navigation layer. Atmosphere maps the independent worlds. A future SuperMe MCP connection may provide contextual `ASK IBLoud` capability.

The initial SuperMe handoff is a link-out. A URL query such as `?from=superme` may open the Control Room as an introduction state, but it does not imply a native SuperMe embed or an active MCP connection.

The existing PIXIE source-of-truth demo remains independently accessible and unchanged.
