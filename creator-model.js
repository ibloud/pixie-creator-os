/* Portable local draft. Media bytes, filenames, paths and credentials stay out. */
(function (root) {
  'use strict';
  const schema = 'pixie-artist-draft/v1';
  const limits = { title: 160, link: 2000, caption: 5000, credits: 2000, description: 2000 };
  function text(value, limit) {
    if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid or oversized draft text');
    return value;
  }
  function https(value) {
    if (!value) return '';
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Use a public HTTPS link without credentials');
    return u.href;
  }
  function validate(input) {
    if (!input || input.schema !== schema || typeof input.pixie_id !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(input.pixie_id) || !['bluesky', 'repurpose'].includes(input.destination) || typeof input.rights !== 'boolean') throw new Error('Unsupported PIXIE draft');
    const fields = {};
    for (const [key, limit] of Object.entries(limits)) fields[key] = text(input[key], limit);
    fields.link = https(fields.link.trim());
    if (!Array.isArray(input.receipts) || input.receipts.length > 100) throw new Error('Invalid publication history');
    const receipts = input.receipts.map(r => {
      if (!r || !['bluesky', 'repurpose'].includes(r.destination) || !Number.isSafeInteger(r.revision) || r.revision < 0) throw new Error('Invalid publication record');
      const url = https(text(r.url, 2000));
      if (!url || !Number.isFinite(Date.parse(text(r.recorded_at, 64)))) throw new Error('Invalid publication record');
      return { url, title: text(r.title, 160), destination: r.destination, revision: r.revision, recorded_at: r.recorded_at, verification: 'user-reported; not independently verified' };
    });
    // Import is always an unreviewed draft; unknown fields are discarded.
    return { schema, pixie_id: input.pixie_id, ...fields, rights: input.rights, destination: input.destination, receipts, revision: 0, reviewedRevision: null, confirmedRevision: null };
  }
  function create(id) {
    return validate({ schema, pixie_id: id, title: '', link: '', caption: '', credits: '', description: '', rights: false, destination: 'bluesky', receipts: [] });
  }
  function edit(s, patch) {
    const next = validate({ ...s, ...patch, pixie_id: s.pixie_id, receipts: s.receipts });
    return { ...next, revision: s.revision + 1 };
  }
  function sharingText(s) {
    return [s.title.trim(), s.caption.trim(), s.link.trim(), s.credits.trim() ? 'Credits and rights: ' + s.credits.trim() : ''].filter(Boolean).join('\n\n');
  }
  function accessibilityText(s) { return s.description.trim(); }
  function captionSuggestion(s, kind) {
    const subject = s.title.trim() || 'this piece';
    if (kind === 'feedback') return 'I would love your feedback on ' + subject + '. What stands out to you?';
    if (kind === 'process') return 'Behind ' + subject + ': [add what you tried, learned, or changed].';
    return 'Sharing ' + subject + '. [Add what you would like people to know.]';
  }
  function review(s, hasMedia) {
    if (!s.title.trim()) throw new Error('Give your work a title in Prepare');
    if (!s.rights) throw new Error('Confirm your right to share in Prepare');
    if (!hasMedia && !s.link) throw new Error('Choose media or add a public work link');
    if (s.destination === 'repurpose' && !hasMedia) throw new Error('Select media for the Repurpose source handoff');
    return { ...s, reviewedRevision: s.revision, confirmedRevision: null };
  }
  function confirm(s) {
    if (s.reviewedRevision !== s.revision) throw new Error('Review the current work before confirming');
    return { ...s, confirmedRevision: s.revision };
  }
  function requireConfirmed(s) {
    if (s.confirmedRevision !== s.revision) throw new Error('Review and confirm the current handoff first');
  }
  function recordPublication(s, url, now) {
    requireConfirmed(s);
    const publicUrl = https(text(url.trim(), 2000));
    if (!publicUrl) throw new Error('Enter the resulting publication link');
    if (s.receipts.length >= 100) throw new Error('Publication history is full; download this draft and start another');
    if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid recording time');
    const receipt = { url: publicUrl, title: s.title.trim(), destination: s.destination, revision: s.revision, recorded_at: now, verification: 'user-reported; not independently verified' };
    return { ...s, receipts: [...s.receipts, receipt] };
  }
  function exportDraft(s) {
    const out = { schema, pixie_id: s.pixie_id };
    for (const key of Object.keys(limits)) out[key] = s[key];
    return { ...out, rights: s.rights, destination: s.destination, receipts: s.receipts.map(r => ({ ...r })), mediaIncluded: false, publication: 'manual; not independently verified' };
  }
  const api = { create, validate, edit, review, confirm, requireConfirmed, sharingText, accessibilityText, captionSuggestion, recordPublication, exportDraft, https };
  root.PixieCreator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
