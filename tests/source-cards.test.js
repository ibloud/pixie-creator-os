const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(values = new Map(), writeFails = false) {
  const buttons = [];
  const element = () => ({ innerHTML: '', textContent: '', value: '', querySelectorAll: () => [] });
  const grid = element();
  grid.querySelectorAll = selector => {
    if (selector !== '[data-source-card]') return [];
    buttons.length = 0;
    for (const match of grid.innerHTML.matchAll(/data-source-card="(\d+)"/g)) {
      buttons.push({ dataset: { sourceCard: match[1] } });
    }
    return buttons;
  };
  const elements = new Map([['sourceCardGrid', grid]]);
  const getElement = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const context = vm.createContext({
    URL, Date, JSON, Map, CustomEvent: function () {},
    document: { addEventListener() {}, getElementById: getElement },
    addEventListener() {}, dispatchEvent() {},
    localStorage: {
      get length() { return values.size; },
      key: i => [...values.keys()][i] ?? null,
      getItem: key => values.get(key) ?? null,
      setItem(key, value) { if (writeFails) throw new Error('Storage unavailable'); values.set(key, value); },
      removeItem: key => values.delete(key)
    }
  });
  context.window = context;
  for (const file of ['story-model.js', 'story-engine.js', 'story-engine-bridge.js', 'narrative.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  return { context, grid, buttons, getElement, engine: context.PIXIE_STORY_ENGINE,
    open: card => context.openSourceCardStory(card) };
}
const card = { title: 'Public source', url: 'https://example.org/post', observation: 'Reference only' };

test('curated card reopening and reload reuse the saved story and preserve writing', () => {
  const values = new Map();
  const first = fixture(values);
  const story = first.open(card);
  story.voice.draft = 'My words cite this source.';
  first.engine.save(story);
  assert.equal(first.open(card).id, story.id);
  assert.equal(first.engine.list().length, 1);
  const reloaded = fixture(values);
  const reopened = reloaded.open(card);
  assert.equal(reopened.id, story.id);
  assert.equal(reopened.voice.draft, 'My words cite this source.');
  assert.equal(reloaded.engine.list().length, 1);
});

test('a preexisting URL capture is reused rather than duplicated', () => {
  const { engine, open } = fixture();
  const existing = engine.capture(card);
  assert.equal(open(card).id, existing.id);
  assert.equal(engine.list().length, 1);
});

test('repeated opens with failed storage reuse the session recovery story', () => {
  const { engine, open } = fixture(new Map(), true);
  const existing = open(card);
  assert.equal(open(card), existing);
  assert.notEqual(existing.persistence, 'PERSISTED');
  assert.ok(engine.exportRecovery().includes('Public source'));
});

test('client references load by ID and disclose unchecked freshness and self-reported reviewer', () => {
  const { context, engine, grid, open } = fixture();
  const story = engine.capture(card);
  story.provenance.push({ type: 'client-card-acceptance', scope: 'device-local-reference',
    recordedBy: '<Reviewer>', recordedAt: '2026-09-30T21:00:00.000Z' });
  engine.save(story);
  assert.equal(open({ ...card, storyId: story.id }).id, story.id);
  context.renderSourceCards();
  assert.match(grid.innerHTML, /Freshness: Unchecked/);
  assert.match(grid.innerHTML, /&lt;Reviewer&gt; \(self-reported on this device\)/);
  assert.match(context.narrativeInner(), /Accepted by \(self-reported on this device\)/);
});

test('unsafe source URLs cannot create stories and examples point to published posts', () => {
  const { context, engine, open } = fixture();
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://user:password@example.org']) {
    assert.equal(open({ ...card, url }), null);
  }
  assert.equal(engine.list().length, 0);
  const examples = vm.runInContext('SOURCE_EXAMPLES', context);
  assert.ok(examples.every(example => example.url.startsWith('https://pixie.pckt.blog/')));
});

 test('actual Open in workbench button reuses the story and restores its draft', () => {
  const { context, engine, buttons, getElement } = fixture();
  context.renderSourceCards();
  buttons[0].onclick();
  const story = engine.list()[0];
  getElement('storyDraft').value = 'Writing that must survive reopening.';
  context.persistActiveStory();
  buttons[0].onclick();
  assert.equal(engine.list().length, 1);
  assert.equal(engine.list()[0].id, story.id);
  assert.equal(getElement('storyDraft').value, 'Writing that must survive reopening.');
});
