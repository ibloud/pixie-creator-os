/* Local session contract; audio and filesystem capabilities are never serialized. */
(function (root) {
  'use strict';
  function text(value, limit) {
    if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid session text');
    return value;
  }
  function validate(input) {
    if (!input || input.schema !== 'pixie-creator-session/v1' || typeof input.pixie_id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.pixie_id) || typeof input.keepNote !== 'boolean') throw new Error('Unsupported session identity or schema');
    return {
      schema: input.schema, pixie_id: input.pixie_id,
      title: text(input.title, 160), note: text(input.note, 2000),
      keepNote: input.keepNote === true, status: 'draft', revision: 0,
      reviewedRevision: null, confirmedRevision: null
    };
  }
  function create(id) { return validate({ schema: 'pixie-creator-session/v1', pixie_id: id, title: 'My creative session', note: '', keepNote: true }); }
  function edit(s, patch) {
    const next = validate({ ...s, ...patch, pixie_id: s.pixie_id });
    return { ...next, revision: s.revision + 1 };
  }
  function review(s) { return { ...s, status: 'reviewed', reviewedRevision: s.revision, confirmedRevision: null }; }
  function confirm(s) {
    if (s.status !== 'reviewed' || s.reviewedRevision !== s.revision || !s.title.trim()) throw new Error('Review the current named session first');
    return { ...s, status: 'confirmed', confirmedRevision: s.revision };
  }
  function pause(s) { return { ...s, status: 'paused', reviewedRevision: null, confirmedRevision: null }; }
  function resume(s) { return { ...s, status: 'draft', reviewedRevision: null, confirmedRevision: null }; }
  function record(s) {
    if (s.status !== 'confirmed' || s.confirmedRevision !== s.revision) throw new Error('Confirm the current session before export');
    return { schema: s.schema, pixie_id: s.pixie_id, title: s.title.trim(), keepNote: s.keepNote,
      note: s.keepNote ? s.note : '', status: 'LOCAL EXPORT',
      provenance: { source: 'user-entered', verification: 'not independently verified' },
      audioIncluded: false, transcript: 'not implemented', translation: 'not implemented', publication: 'not implemented' };
  }
  const api = { validate, create, edit, review, confirm, pause, resume, record };
  root.PixieSession = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
