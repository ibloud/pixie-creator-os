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

test('draft fingerprint tracks exported content, including publication receipts, independently of revision', () => {
  const confirmed = M.confirm(M.review(ready(), false));
  const before = M.fingerprint(confirmed);
  const recorded = M.recordPublication(confirmed, 'https://bsky.app/profile/example.test/post/456', '2026-10-10T12:00:00Z');
  assert.equal(recorded.revision, confirmed.revision);
  assert.notEqual(M.fingerprint(recorded), before);
  assert.equal(M.fingerprint(M.validate(M.exportDraft(recorded))), M.fingerprint(recorded));
  const runtimeOnly = { ...recorded, reviewedRevision: null, confirmedRevision: null };
  assert.equal(M.fingerprint(runtimeOnly), M.fingerprint(recorded));
});
test('creative context preserves provenance and synthetic event identity without importing authority',()=>{
 const environment={event:{uri:'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/community.lexicon.calendar.event/pixie-synthetic',title:'PIXIE synthetic studio rehearsal'},music:{url:'https://plyr.fm/track/42',uri:'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/fm.plyr.track/one',cid:'bafy-source',title:'Original reference',attribution:'Synthetic creator',rights:'Attribution required',connected:true}};
 const s=M.edit(ready(),{environment}),out=M.exportDraft(s),restored=M.validate({...out,ownerDid:'forged'});
 assert.deepEqual(restored.environment,out.environment);assert.equal(restored.environment.music.cid,'bafy-source');assert.equal(restored.environment.music.rights,'Attribution required');assert.equal(restored.environment.music.connected,undefined);assert.equal(restored.ownerDid,undefined);assert.equal(restored.confirmedRevision,null);
 for(const url of ['javascript:alert(1)','https://plyr.fm.evil/track/42','https://token@plyr.fm/track/42','https://plyr.fm/track/42?token=private'])assert.throws(()=>M.environment({music:{...environment.music,url}}));
 assert.throws(()=>M.environment({event:{...environment.event,uri:'at://forged'}}));
});
test('public music discovery sends only the explicit query and fails without fabrication',async()=>{
 let request;const results=await M.searchPlyr('studio',async(url,options)=>{request={url,options};return {ok:true,json:async()=>({results:[{type:'track',id:42,title:'Original reference',artist_handle:'creator.test',artist_display_name:'Synthetic creator'}]})};});
 assert.equal(request.options.credentials,'omit');assert.equal(request.options.referrerPolicy,'no-referrer');assert.equal(new URL(request.url).searchParams.get('q'),'studio');assert.equal(new URL(request.url).searchParams.get('type'),'tracks');assert.equal(results[0].url,'https://plyr.fm/track/42');assert.match(results[0].rights,/Unverified/);
 await assert.rejects(M.searchPlyr('a'));await assert.rejects(M.searchPlyr('studio',async()=>{throw Error('offline');}));assert.throws(()=>M.parsePlyrSearch({results:[{type:'track',id:'../private',title:'Unsafe',artist_handle:'x'}]}));
});

test('ticket availability presentation preserves zero and unknown counts without inventory mutations',()=>{
 const input=require('../ticket-fixture.json');const value=M.ticketPresentation(input);assert.equal(value.types[0].available,'2');
 const zero=structuredClone(input);zero.availability.ticketTypes[0].availableQuantity=0;assert.equal(M.ticketPresentation(zero).types[0].available,'0');delete zero.availability.ticketTypes[0].availableQuantity;assert.equal(M.ticketPresentation(zero).types[0].available,'not supplied');
 zero.availability.ticketTypes[0].availableQuantity=-1;assert.throws(()=>M.ticketPresentation(zero));assert.throws(()=>M.ticketPresentation({...input,mode:'live'}));assert.deepEqual(input,require('../ticket-fixture.json'));
});

test('OpenMeet and atmo.rsvp keep the existing event source rather than create a duplicate',()=>{
 const event={uri:'at://did:plc:bbbbbbbbbbbbbbbbbbbbbbbb/community.lexicon.calendar.event/existing',title:'Existing event',url:'https://platform.openmeet.net/events/synthetic',fixture:false};
 const saved=M.environment({event}).event;assert.equal(saved.uri,event.uri);assert.equal(saved.url,event.url);assert.match(saved.mode,/not fetched or synchronized/);assert.equal(saved.fixture,false);
 assert.throws(()=>M.environment({event:{...event,url:'https://platform.openmeet.net/events/synthetic?token=private'}}));assert.throws(()=>M.environment({event:{...event,uri:'at://did:plc:bbbbbbbbbbbbbbbbbbbbbbbb/other.collection/existing'}}));
});
