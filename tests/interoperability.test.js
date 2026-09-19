const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('interoperability.js', 'utf8');
const context = {
  window: {},
  document: { addEventListener() {}, getElementById() { return null; } }
};
vm.runInNewContext(source, context, { filename: 'interoperability.js' });
const api = context.window.PIXIEInterop;

assert.equal(api.VERSION, '0.2.0');

const normalized = api.normalizeRecord(
  { id: '1', name: 'Café Noir', creator: 'Ada' },
  'demo'
);
assert.equal(normalized.title, 'Café Noir');
assert.deepEqual(normalized.creators, ['Ada']);
assert.equal(normalized.source, 'demo');

const match = api.match(
  { pixie_id: 'px1', title: 'Cafe Noir', creators: ['Ada'] },
  [{ pixie_id: 'px1', title: 'Cafe Noir', creators: ['Ada'], source: 'spotify' }]
)[0];
assert.equal(match.score, 1);
assert.deepEqual(match.reasons, ['PIXIE_ID', 'TITLE', 'CREATORS']);

const blocked = api.buildSyncPlan(
  [{
    source: 'unsplash',
    title: 'Photo',
    creators: ['Ada'],
    provenance: { source: 'unsplash', attribution_required: true }
  }],
  [{ source: 'spotify', title: 'Photo', creators: ['Ada'] }]
)[0];
assert.equal(blocked.action, 'PROVENANCE_REVIEW');
assert.ok(blocked.reasons.includes('MISSING_CREATOR'));
assert.ok(blocked.reasons.includes('MISSING_ATTRIBUTION'));

const allowed = api.buildSyncPlan(
  [{
    source: 'pixie',
    pixie_id: 'px1',
    title: 'Track',
    creators: ['Ada'],
    provenance: { source: 'pixie' }
  }],
  [{
    source: 'spotify',
    pixie_id: 'px1',
    title: 'Track',
    creators: ['Ada'],
    provenance: { source: 'spotify' }
  }]
)[0];
assert.equal(allowed.action, 'LINK');
assert.equal(allowed.confidence, 1);

const status = api.status();
assert.equal(status.mode, 'LOCAL_ONLY');
assert.equal(status.adapters.length, 7);
assert.equal(
  status.adapters.find(a => a.id === 'unsplash').status,
  'ADAPTER READY'
);

console.log('PASS: interoperability tests');
