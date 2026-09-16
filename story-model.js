/* PIXIE Story model — narrative intelligence boundary. */
'use strict';

window.PIXIE_STORY = window.PIXIE_STORY || {
  version: 2,
  create(input = {}) {
    return {
      id: input.id || `story-${Date.now()}`,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: input.subject || { type: 'SIGNAL', title: '' },
      source: input.source || { url: '', title: '', capturedAt: new Date().toISOString() },
      context: input.context || { facts: [], history: [], entities: [], status: 'unverified' },
      claims: input.claims || [],
      narratives: input.narratives || [],
      culturalMemory: input.culturalMemory || { notes: [], persistence: '' },
      music: input.music || { candidates: [], selected: null, rationale: '' },
      conversation: input.conversation || { candidates: [], replyDraft: '', promoFit: '' },
      voice: input.voice || { draft: '', variants: [] },
      provenance: input.provenance || [],
      status: input.status || 'signal'
    };
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
