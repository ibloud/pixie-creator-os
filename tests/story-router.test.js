'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ledger = require('../story-ledger');
const api = require('../story-router');
const own = 'did:plc:own', other = 'did:plc:other';
function post(did = own) { return { uri: `at://${did}/app.bsky.feed.post/key`, cid: 'bafy-original', authorDid: did, text: 'Selected words', createdAt: '2026-09-01T00:00:00Z', selectedAt: '2026-09-30T00:00:00Z', embedding: 'unknown' }; }
function file(p = post()) { return { schemaVersion: 2, actor: { did: own, handle: 'ibloud.xyz' }, posts: [p] }; }
function story(source = ledger.importLedger(file(), { signedInDid: own }).posts[0]) { return { id: 'story-test', subject: { title: 'Origin of PIXIE' }, sources: [source], publish: { status: 'composing', router: { context: 'My context', sources: [{ uri: source.uri, form: 'reference' }] } } }; }
function router(save = s => ({ ...s, persistence: 'PERSISTED' })) { return api.createRouter({ save, newKey: () => 'stable-record-key', now: () => '2026-09-30T00:00:00Z' }); }
function approval(s, d) { return { signedInDid: own, approvedPreview: JSON.stringify(api.preview(s, d, { signedInDid: own })) }; }
test('v2 import derives author from URI; file actor is never session authority', () => {
  const imported = ledger.importLedger(file(post(other)), { signedInDid: own });
  assert.ok(!('text' in imported.posts[0])); assert.equal(imported.posts[0].authorDid, other);
  assert.ok(!('text' in ledger.importLedger(file()).posts[0]));
  assert.throws(() => ledger.importLedger(file({ ...post(), authorDid: other })), /metadata/);
  assert.throws(() => ledger.importLedger(file({ ...post(), embedding: undefined })), /metadata/);
  assert.throws(() => ledger.importLedger({ ...file(), schemaVersion: 3 }), /version/);
});
test('v1 imports are reference-only, sanitize strangers and reposts, and ignore unsafe URLs', () => {
  for (const p of [{ ...post(other), url: 'javascript:alert(1)' }, { ...post(), repost: true }]) {
    const source = ledger.importLedger({ actor: 'old-handle', posts: [p] }, { signedInDid: own }).posts[0];
    assert.equal(source.provenance, 'v1-degraded'); assert.equal(source.cid, null); assert.ok(!('text' in source)); assert.match(source.url, /^https:\/\/bsky.app\//);
    assert.deepEqual(api.allowedForms(source, api.fakeDestination(), { signedInDid: own }), ['reference']);
  }
});
test('v1 refresh annotates current CID without manufacturing selection provenance', async () => {
  const source = ledger.importLedger({ posts: [post()] }, { signedInDid: own }).posts[0];
  for (const text of ['Selected words', 'Changed words']) {
    const upgraded = await ledger.refresh(source, async () => ({ uri: source.uri, cid: 'bafy-current', author: { did: own }, record: { text } }), { signedInDid: own });
    assert.equal(upgraded.cidSource, 'import'); assert.equal(upgraded.provenance, 'v1-degraded');
    assert.equal(upgraded.textStatus, text === source.text ? 'text-matched' : 'edited-since-selection');
    assert.deepEqual(api.allowedForms(upgraded, api.fakeDestination(), { signedInDid: own }), ['reference']);
  }
  assert.equal((await ledger.refresh(source, async () => null)).availability, 'unavailable');
  assert.equal((await ledger.refresh(source, async () => { throw Error('Offline'); })).availability, 'unknown');
});
test('v2 source drift retains selected CID and disables copied/embedded representations', async () => {
  const source = ledger.importLedger(file(), { signedInDid: own }).posts[0];
  const updated = await ledger.refresh(source, async () => ({ uri: source.uri, cid: 'new', author: { did: own } }));
  assert.equal(updated.cid, 'bafy-original'); assert.equal(updated.textStatus, 'edited-since-selection');
  assert.deepEqual(api.allowedForms(updated, api.fakeDestination(), { signedInDid: own }), ['reference']);
});
test('format matrix combines source restrictions, ownership and destination capability', () => {
  const d = api.fakeDestination();
  for (const embedding of ['unknown', 'disabled', 'allowed']) {
    const stranger = { ...ledger.importLedger(file(post(other))).posts[0], embedding };
    assert.deepEqual(api.allowedForms(stranger, d, { signedInDid: own }), embedding === 'allowed' ? ['reference', 'embed'] : ['reference']);
    assert.deepEqual(api.allowedForms(stranger, d, { signedInDid: own, consent: true }), embedding === 'allowed' ? ['reference', 'embed', 'quote'] : ['reference']);
  }
  const s = story(); s.publish.router.sources[0].form = 'embed';
  assert.match(api.preview(s, d, { signedInDid: own }).sources[0].note, /not verified/);
  assert.throws(() => api.preview(s, api.fakeDestination({ supports: ['reference'] }), { signedInDid: own }), /format/);
  s.sources[0].embedding = 'disabled'; assert.throws(() => api.preview(s, d, { signedInDid: own }), /format/);
});
test('Made Sick requires explicit publication consent even for a stranger reference', () => {
  const s = story(ledger.importLedger(file(post(other))).posts[0]);
  const d = api.fakeDestination({ id: 'made-sick.pckt.blog', consentFirst: true });
  assert.throws(() => api.preview(s, d, { signedInDid: own }), /consent/);
  s.publish.router.sources[0].consent = true; assert.equal(api.preview(s, d, { signedInDid: own }).sources[0].form, 'reference');
});
test('user destination overrides suggestions and receipt identifies the exact representation', async () => {
  const s = story(); s.suggestedDestination = 'pixie.pckt.blog';
  const d = api.fakeDestination({ id: 'made-sick.pckt.blog' });
  const result = await router().publish(s, d, approval(s, d));
  assert.equal(result.receipt.destination, d.id); assert.equal(d.records.size, 1); assert.equal(s.publish.status, 'simulated');
  const original = result.receipt.storySnapshot; s.publish.router.context = 'Later revision';
  assert.notEqual(JSON.stringify(api.preview(s, d, { signedInDid: own })), original);
});
test('lost response reconciles exactly one record, retaining intention and deduplicating receipt', async () => {
  const s = story(), d = api.fakeDestination({ mode: 'lost-response' }), r = router();
  await assert.rejects(r.publish(s, d, approval(s, d)), /not confirmed/);
  assert.equal(d.records.size, 1); assert.equal(s.publish.router.intent.status, 'unconfirmed'); assert.equal(s.publish.status, 'composing');
  await r.publish(s, d, approval(s, d)); await r.publish(s, d, approval(s, d));
  assert.equal(d.records.size, 1); assert.equal(s.publish.router.receipts.length, 1);
});
test('offline, rejection, read-only and revoked permissions retain composition without false success', async () => {
  for (const mode of ['offline', 'permission-denied', 'reject', 'read-only']) {
    const s = story(), d = api.fakeDestination({ mode });
    await assert.rejects(router().publish(s, d, approval(s, d)));
    assert.equal(d.records.size, 0); assert.equal(s.publish.status, 'composing'); assert.equal(s.publish.router.context, 'My context');
  }
});
test('stale preview or destination change cannot send; recovery blocks a write before network', async () => {
  const s = story(), d = api.fakeDestination(), approved = approval(s, d);
  s.subject.title = 'Changed'; await assert.rejects(router().publish(s, d, approved), /Review/);
  await assert.rejects(router(() => ({ persistence: 'MEMORY ONLY' })).publish(s, d, approval(s, d)), /recovery/);
  assert.equal(d.records.size, 0);
  await assert.rejects(router().publish(s, api.fakeDestination({ id: 'different' }), approval(s, api.fakeDestination({ id: 'different' }))), /earlier send/);
});
test('pending intention and receipt survive existing Story Engine storage and reload', async () => {
  const values = new Map();
  const context = vm.createContext({ window: {}, Date, CustomEvent: class {}, document: { readyState: 'loading', addEventListener() {} }, localStorage: { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) } });
  for (const f of ['story-model.js', 'story-engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), context);
  const engine = context.window.PIXIE_STORY_ENGINE, s = story(), d = api.fakeDestination({ mode: 'lost-response' });
  await assert.rejects(router(x => engine.save(x)).publish(s, d, approval(s, d)));
  const loaded = engine.load(s.id); assert.equal(loaded.publish.router.intent.key, 'stable-record-key');
  await router(x => engine.save(x)).publish(loaded, d, approval(loaded, d));
  assert.equal(engine.load(s.id).publish.router.receipts[0].cid, 'simulated-stable-record-key'); assert.equal(d.records.size, 1);
});
test('malformed receipt and simultaneous send never produce false success', async () => {
  const s = story(), d = api.fakeDestination(); d.put = async () => ({ uri: 'fake', cid: 'fake' });
  await assert.rejects(router().publish(s, d, approval(s, d)), /mismatched/); assert.equal(s.publish.status, 'composing');
  let finish; const slow = api.fakeDestination(); slow.lookup = () => new Promise(resolve => { finish = resolve; });
  const r = router(), pending = r.publish(story(), slow, approval(story(), slow));
  await assert.rejects(r.publish(story(), slow, approval(story(), slow)), /in progress/); finish(null); await pending;
});

test('cross-posting is a separate explicit intention and keeps earlier receipts', async () => {
  const s = story(), first = api.fakeDestination({ id: 'first' }), second = api.fakeDestination({ id: 'second' });
  await router().publish(s, first, approval(s, first));
  await assert.rejects(router().publish(s, second, approval(s, second)), /earlier send/);
  api.startSeparateReshare(s);
  await router().publish(s, second, approval(s, second));
  assert.equal(s.publish.router.receipts.length, 2); assert.equal(s.publish.router.receipts[0].destination, 'first');
  s.publish.router.intent.status = 'unconfirmed'; assert.throws(() => api.startSeparateReshare(s), /Reconcile/);
});
