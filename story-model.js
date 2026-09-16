/* PIXIE Story model — narrative intelligence + Ink-compatible flow boundary. */
'use strict';

window.PIXIE_STORY = window.PIXIE_STORY || {
  version: 3,
  create(input = {}) {
    const now = new Date().toISOString();
    return {
      id: input.id || `story-${Date.now()}`,
      createdAt: input.createdAt || now,
      updatedAt: now,
      subject: input.subject || { type: 'SIGNAL', title: '' },
      signal: input.signal || { observation: '', capturedAt: now },
      source: input.source || { url: '', title: '', capturedAt: now },
      context: input.context || { facts: [], history: [], entities: [], status: 'unverified' },
      claims: input.claims || [],
      narratives: input.narratives || [],
      culturalMemory: input.culturalMemory || { notes: [], persistence: '' },
      media: input.media || [],
      music: input.music || { candidates: [], selected: null, rationale: '' },
      conversation: input.conversation || { candidates: [], replyDraft: '', promoFit: '' },
      voice: input.voice || { draft: '', variants: [] },
      publish: input.publish || { status: 'draft', channels: [], references: [] },
      provenance: input.provenance || [],
      status: input.status || 'signal',
      flow: input.flow || { currentNode: 'signal', visited: [], choices: [], variables: {}, history: [] }
    };
  },
  visit(story, nodeId) {
    if (!story || !nodeId) return;
    story.flow = story.flow || { currentNode: null, visited: [], choices: [], variables: {}, history: [] };
    if (story.flow.currentNode && story.flow.currentNode !== nodeId) story.flow.history = [...(story.flow.history || []), story.flow.currentNode];
    story.flow.currentNode = nodeId;
    if (!story.flow.visited.includes(nodeId)) story.flow.visited.push(nodeId);
    story.updatedAt = new Date().toISOString();
  },
  choose(story, choiceId, nextNode) {
    if (!story) return;
    story.flow = story.flow || { currentNode: null, visited: [], choices: [], variables: {}, history: [] };
    story.flow.choices.push({ id: choiceId, node: story.flow.currentNode, chosenAt: new Date().toISOString() });
    this.visit(story, nextNode);
  },
  toInk(story) {
    if (!story) return '';
    const title = story.subject?.title || 'Untitled Story';
    const node = story.flow?.currentNode || 'signal';
    return `// PIXIE-compatible narrative snapshot\nVAR current_node = "${node}"\n\n=== story ===\n# subject: ${title}\n\n-> ${node}\n`;
  },
  save(story) {
    if (!story) return;
    story.updatedAt = new Date().toISOString();
    localStorage.setItem(`pixie-story:${story.id}`, JSON.stringify(story));
  },
  load(id) {
    try { return JSON.parse(localStorage.getItem(`pixie-story:${id}`)); } catch (e) { return null; }
  }
};
