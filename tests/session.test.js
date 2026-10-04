const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../session-model.js');
test('export requires a fresh review and confirmation; edits preserve identity', () => {
  let s = M.create('session-1');
  assert.throws(() => M.record(s)); assert.throws(() => M.confirm(s));
  s = M.confirm(M.review(s)); assert.equal(M.record(s).pixie_id, 'session-1');
  s = M.edit(s, { title: 'New name', pixie_id: 'replacement' });
  assert.equal(s.pixie_id, 'session-1'); assert.throws(() => M.record(s)); assert.throws(() => M.confirm(s));
  assert.equal(M.record(M.confirm(M.review(s))).title, 'New name');
});
test('skip excludes notes; pause/resume revokes confirmation; import is a draft', () => {
  let s = M.edit(M.create('session-2'), { note: 'Private next step', keepNote: false });
  s = M.confirm(M.review(s)); const exported = M.record(s);
  assert.equal(exported.note, ''); assert.equal(exported.audioIncluded, false);
  assert.ok(!JSON.stringify(exported).includes('Private next step'));
  assert.throws(() => M.record(M.pause(s))); assert.throws(() => M.record(M.resume(M.pause(s))));
  const restored = M.validate({ ...exported, filename: 'private.wav', path: '/private' });
  assert.equal(restored.pixie_id, s.pixie_id); assert.equal(restored.status, 'draft');
  assert.equal(restored.path, undefined); assert.equal(restored.filename, undefined);
  assert.throws(() => M.record(restored));
});
test('malformed imports fail without creating identities or unbounded content', () => {
  for (const patch of [{ pixie_id: undefined }, { pixie_id: '../secret' }, { schema: 'v2' }, { title: 'x'.repeat(161) }, { note: 42 }, { keepNote: 'true' }]) assert.throws(() => M.validate({ ...M.create('session-3'), ...patch }));
});
