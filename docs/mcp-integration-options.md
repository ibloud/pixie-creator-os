# PIXIE MCP integration options

Status: recommendation; no service integration deployed.

Creator OS remains the local artist workspace. Reuse Holdings’ governed tool/router logic for an initial authenticated service adapter, with the embedded assistant pattern evaluated in Duet. Holdings’ existing game tools are not production artist capabilities; artist operations need their own contracts, authorization and tests. Tarantula can host an explicit opt-in comparison of interfaces once that service exists.

Backstage is a later option for repository catalog, documentation and developer actions. Its MCP Actions Backend exposes actions registered in a Backstage backend; it does not install directly into a static Pages site or supply media analysis, sample clearance or an assistant model. Introducing Backstage now would add a separately hosted application and authentication setup.

If adopted, register only scoped actions and enforce authorization and consent inside each action. Named-server filtering does not restrict the default endpoint: official docs state that it still exposes all registered actions. Action attributes and server instructions are descriptive, not substitutes for enforcement. Leave tool-payload tracing disabled for private creator material. Do not put backend credentials into Pages.

Candidate first tools: propose caption copy, propose an accessibility description for explicitly selected media, and list missing rights evidence. These return editable drafts or uncertainty; they do not declare legal clearance or publish. Publishing requires a separate reviewed action for the exact media, text, destination and revision. No personal or private material is transmitted before an explicit scoped choice.

Sources checked 2026-10-04:
- https://backstage.io/api/next/modules/_backstage_plugin-mcp-actions-backend.html
- https://backstage.io/docs/ai/mcp-actions/
