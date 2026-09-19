/* PIXIE Story Engine smoke tests.
   Run with: node tests/story-engine-smoke.js
   No dependencies; exercises the local-first Story/Source Memory contracts.
*/
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const store = new Map();
const listeners = {};

const documentStub = {
  addEventListener(name, fn) { listeners[name] = fn; },
  getElementById() { return null; },
  querySelector() { return null; }
};

const context = vm.createContext({
  console,
  Date,
  Map,
  JSON,
  String,
  RegExp,
  CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init?.detail; },
  window: {
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    addEventListener() {},
    dispatchEvent() {}
  },
  document: documentStub
});
context.window.window = context.window;

function load(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

load('story-model.js');
load('story-engine.js');
load('source-memory.js');

const engine = context.window.PIXIE_STORY_ENGINE;
const model = context.window.PIXIE_STORY;
const memory = context.window.PIXIE_SOURCE_MEMORY;

assert.strictEqual(model.version, 4, 'Story model should be version 4');
assert.ok(memory.adapters.local, 'local source-memory adapter should exist');
assert.strictEqual(typeof memory.adapters.local.preserve, 'function');

const story = engine.capture({
  title: 'Smoke Test Signal',
  url: 'https://example.com/source',
  observation: 'A deterministic test observation.'
});

assert.ok(story.id, 'capture should create a Story id');
assert.strictEqual(story.sources.length, 1);
assert.strictEqual(story.sources[0].preservation.status, 'pending');
assert.strictEqual(engine.active().id, story.id, 'capture should establish the active Story');

model.visit(story, 'context');
model.choose(story, 'context->music', 'music');
engine.save(story);

const reloaded = engine.load(story.id);
assert.strictEqual(reloaded.flow.currentNode, 'music');
assert.deepStrictEqual(reloaded.flow.visited, ['signal', 'context', 'music']);
assert.strictEqual(reloaded.flow.choices.length, 1);

const preserved = memory.attach(reloaded, {
  id: 'source-smoke-test',
  type: 'web',
  url: 'https://example.com/source',
  title: 'Smoke Test Source',
  observation: 'The same observation remains attached to the source.'
});
engine.save(reloaded);

assert.strictEqual(preserved.preservation.status, 'preserved');
assert.strictEqual(preserved.preservation.provider, 'local');
assert.ok(preserved.preservation.snapshotId.startsWith('local-'));
assert.ok(preserved.preservation.snapshotPath.startsWith('local://'));
assert.ok(reloaded.provenance.some(x => x.type === 'source-memory' && x.sourceId === preserved.id));
assert.strictEqual(engine.load(story.id).sources[0].preservation.status, 'preserved');

const demo = engine.seedDemo();
assert.strictEqual(engine.load(demo.id).flow.variables.demo, true);

const jsFiles = fs.readdirSync(root).filter(name => name.endsWith('.js'));
for (const file of jsFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  new Function(source); // syntax-only validation for browser scripts
}

console.log('PIXIE Story Engine smoke tests: PASS');
console.log(`Stories persisted: ${engine.list().length}`);
console.log(`Active Story: ${engine.active().subject.title}`);
console.log(`Preserved source: ${preserved.preservation.snapshotId}`);
