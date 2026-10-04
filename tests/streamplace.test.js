const test = require('node:test');
const assert = require('node:assert/strict');
const { handle, mount } = require('../streamplace.js');
test('accepts domain handles and rejects URLs, credentials and malformed labels', () => {
  for (const v of ['example.bsky.social', 'iame.li', 'my-name.example']) assert.equal(handle(v), v);
  for (const v of ['https://stream.place/example.com', '@example.com', 'foo', 'a..com', '-x.com', 'a.123', 'user:pass@example.com', 'a_b.com', 'a/' , 'x'.repeat(64) + '.com']) assert.equal(handle(v), null);
});
test('viewer contacts no service before explicit load and clears on edit/removal', () => {
  class Element {
    constructor() { this.handlers = {}; this.children = []; this.value = ''; }
    addEventListener(type, fn) { this.handlers[type] = fn; }
    after(el) { this.afterElement = el; }
    replaceChildren(...els) { this.children = els; }
  }
  const input = new Element(), load = new Element(), target = new Element(), status = new Element();
  const tile = { querySelector: selector => selector === 'input' ? input : selector.startsWith('button') ? load : selector.includes('Embed') ? target : status };
  const doc = { createElement: tag => Object.assign(new Element(), { tag }) };
  mount(tile, doc); assert.equal(target.children.length, 0);
  input.value = 'iame.li'; load.handlers.click(); assert.equal(target.children[0].src, 'https://stream.place/embed/iame.li');
  assert.equal(target.children[0].referrerPolicy, 'no-referrer'); assert.match(status.textContent, /unverified/);
  input.handlers.input(); assert.equal(target.children.length, 0);
  load.handlers.click(); load.afterElement.handlers.click(); assert.equal(target.children.length, 0);
  input.value = 'https://evil.test'; load.handlers.click(); assert.equal(target.children.length, 0);
});
