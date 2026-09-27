const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ raw = null, readFails = false, writeFails = false } = {}) {
  const values = new Map();
  if (raw !== null) values.set('pixie-stories', raw);
  const storage = {
    getItem(key) {
      if (readFails) throw new Error('Read denied');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (writeFails) { const error = new Error('Full'); error.name = 'QuotaExceededError'; throw error; }
      values.set(key, value);
    },
    removeItem(key) { values.delete(key); }
  };
  const context = vm.createContext({
    localStorage: storage, Date, JSON, Map, CustomEvent: function CustomEvent() {},
    document: { addEventListener() {} }, addEventListener() {}, dispatchEvent() {}
  });
  context.window = context;
  for (const file of ['story-model.js', 'story-engine.js', 'story-engine-bridge.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { engine: context.PIXIE_STORY_ENGINE, model: context.PIXIE_STORY, values };
}

const corrupt = fixture({ raw: '{broken' });
const a = corrupt.engine.capture({ title: 'Keep new work' });
assert.equal(a.persistence, 'QUARANTINED');
assert.equal(corrupt.values.get('pixie-stories'), '{broken');
assert.ok([...corrupt.values.keys()].some(key => key.startsWith('pixie-stories-quarantine:')));
assert.ok(corrupt.engine.exportRecovery().includes('{broken'));
assert.throws(() => corrupt.engine.write([]));

const denied = fixture({ raw: '[{"id":"original"}]', readFails: true });
const b = denied.engine.capture({ title: 'Read failure' });
assert.equal(b.persistence, 'QUARANTINED');
assert.equal(denied.values.get('pixie-stories'), '[{"id":"original"}]');
assert.ok(denied.engine.exportRecovery().includes('Read failure'));

const full = fixture({ raw: '[]', writeFails: true });
const c = full.engine.capture({ title: 'Full storage' });
assert.equal(c.persistence, 'MEMORY ONLY');
assert.equal(full.engine.storageStatus.state, 'MEMORY ONLY');
assert.equal(full.values.get('pixie-stories'), '[]');
assert.ok(full.engine.exportRecovery().includes('Full storage'));

const healthy = fixture();
const d = healthy.engine.capture({ title: 'Normal capture' });
assert.equal(d.persistence, 'PERSISTED');
assert.equal(healthy.engine.list().length, 1);
healthy.model.save(d);
assert.equal(healthy.engine.list().length, 1);
console.log('PASS: story storage recovery tests');
