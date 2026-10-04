const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../creator-model.js');
const ready = () => M.edit(M.create('work-1'), { title: 'Original work', caption: 'Listen with me', credits: 'Artist · original recording', link: 'https://example.org/work', rights: true });
test('sharing requires title, work, permission, fresh review and confirmation', () => {
  assert.throws(() => M.review(M.create('empty'), false));
  assert.throws(() => M.review(M.edit(ready(), { rights: false }), true));
  assert.throws(() => M.review(M.edit(ready(), { link: '' }), false));
  assert.throws(() => M.confirm(ready()));
  const confirmed = M.confirm(M.review(ready(), false));
  M.requireConfirmed(confirmed);
  for (const patch of [{ title: 'Renamed' }, { caption: 'Changed' }, { destination: 'repurpose' }, { rights: false }, {}]) {
    const edited = M.edit(confirmed, patch);
    assert.throws(() => M.requireConfirmed(edited));
    assert.throws(() => M.confirm(edited));
    assert.equal(edited.pixie_id, confirmed.pixie_id);
  }
});
test('Repurpose source handoff requires selected media', () => {
  const s = M.edit(ready(), { destination: 'repurpose' });
  assert.throws(() => M.review(s, false));
  M.requireConfirmed(M.confirm(M.review(s, true)));
});
test('draft recovery preserves identity and text, discards capabilities, and requires review', () => {
  const confirmed = M.confirm(M.review(ready(), false));
  const exported = M.exportDraft(confirmed);
  assert.equal(exported.mediaIncluded, false);
  const restored = M.validate({ ...exported, filename: 'private.mov', path: '/private', token: 'secret', mediaURL: 'blob:private', confirmedRevision: 0 });
  assert.equal(restored.pixie_id, confirmed.pixie_id);
  assert.equal(restored.caption, confirmed.caption);
  for (const key of ['filename', 'path', 'token', 'mediaURL']) assert.equal(restored[key], undefined);
  assert.throws(() => M.requireConfirmed(restored));
  assert.ok(M.sharingText(restored).includes('Credits and rights:'));
  assert.ok(!M.sharingText(restored).includes(restored.pixie_id));
});
test('malformed imports and unsafe reference or publication links are rejected', () => {
  for (const patch of [{ title: 'x'.repeat(161) }, { pixie_id: '../escape' }, { rights: 'yes' }, { destination: 'unknown' }, { schema: 'v2' }, { caption: null }, { receipts: {} }]) assert.throws(() => M.validate({ ...ready(), ...patch }));
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://user:secret@example.org', 'file:///private']) {
    assert.throws(() => M.edit(ready(), { link: url }));
    assert.throws(() => M.recordPublication(M.confirm(M.review(ready(), false)), url, '2026-10-04T15:00:00Z'));
  }
});
test('publication records stay self-reported and preserve history after edits', () => {
  let s = M.confirm(M.review(ready(), false));
  s = M.recordPublication(s, 'https://bsky.app/profile/example.test/post/123', '2026-10-04T15:00:00Z');
  assert.match(s.receipts[0].verification, /not independently verified/);
  const revised = M.edit(s, { title: 'Next version' });
  assert.equal(revised.receipts[0].title, 'Original work');
  assert.throws(() => M.recordPublication(revised, 'https://example.org/new', '2026-10-04T15:01:00Z'));
  const restored = M.validate(M.exportDraft(revised));
  assert.equal(restored.receipts[0].url, s.receipts[0].url);
  assert.throws(() => M.requireConfirmed(restored));
});
test('public output stays plain text and omits blank optional fields', () => {
  const s = M.edit(ready(), { title: '<script>not executed</script>', credits: '', description: '' });
  assert.ok(M.sharingText(s).startsWith('<script>'));
  assert.ok(!M.sharingText(s).includes('Accessibility description:'));
});
test('accessibility text stays separate from captions and survives draft recovery', () => {
  const s = M.edit(ready(), { description: 'A guitarist sits beside a window.' });
  assert.equal(M.accessibilityText(s), s.description);
  assert.ok(!M.sharingText(s).includes(s.description));
  assert.equal(M.accessibilityText(M.validate(M.exportDraft(s))), s.description);
  assert.throws(() => M.edit(s, { description: 'x'.repeat(2001) }));
  assert.throws(() => M.requireConfirmed(M.edit(M.confirm(M.review(s, false)), { description: 'Revised description' })));
});
test('caption starters do not mutate custom work or claim rights', () => {
  const s = ready();
  assert.match(M.captionSuggestion(s, 'feedback'), /Original work/);
  assert.match(M.captionSuggestion(s, 'process'), /\[add/);
  assert.equal(s.caption, 'Listen with me');
  assert.equal(M.create('empty').rights, false);
});
