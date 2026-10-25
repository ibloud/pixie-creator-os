/* PIXIE public account picker. Canonical source: ibloud/made-sick/shared. */
(function (root) {
  'use strict';
  const API = 'https://public.api.bsky.app/xrpc/';
  const mounted = new WeakMap();
  let nextId = 0;
  function normalize(value) { return String(value || '').trim().replace(/^@/, '').toLowerCase(); }
  function isHandle(value) {
    const name = normalize(value), labels = name.split('.');
    return name.length <= 253 && labels.length > 1 && /^[a-z]/.test(labels.at(-1)) &&
      labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
  }
  function profile(value) {
    if (!value || !isHandle(value.handle) || typeof value.did !== 'string' || !/^did:(plc|web):\S+$/.test(value.did)) return null;
    return { handle: normalize(value.handle), did: value.did, name: String(value.displayName || value.handle).slice(0, 160) };
  }
  function mount(input, options = {}) {
    if (mounted.has(input)) return mounted.get(input);
    const doc = input.ownerDocument, win = doc.defaultView;
    const fetcher = options.fetch || win.fetch.bind(win);
    const wrapper = doc.createElement('div'); wrapper.className = 'account-picker';
    input.before(wrapper); wrapper.append(input);
    const list = doc.createElement('ul'); list.id = 'pixie-accounts-' + (++nextId); list.className = 'account-options';
    list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Matching public accounts'); list.hidden = true;
    const status = doc.createElement('p'); status.id = list.id + '-status'; status.className = 'account-hint';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const notice = doc.createElement('p'); notice.id = list.id + '-notice'; notice.className = 'account-hint';
    notice.textContent = 'As you type, suggestions use Bluesky’s public search. You can also enter a full custom handle.';
    wrapper.append(list, status, notice);
    const original = new Map(['role','aria-autocomplete','aria-expanded','aria-controls','aria-activedescendant','aria-describedby','autocomplete','spellcheck','autocapitalize'].map(key => [key,input.getAttribute(key)]));
    input.setAttribute('role','combobox'); input.setAttribute('aria-autocomplete','list');
    input.setAttribute('aria-controls',list.id); input.setAttribute('aria-expanded','false');
    input.setAttribute('aria-describedby',[original.get('aria-describedby'),notice.id,status.id].filter(Boolean).join(' '));
    input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize','none');
    let timer, controller, revision = 0, actors = [], active = -1, composing = false, destroyed = false;
    const listeners = [];
    function listen(target, type, fn, capture = false) { target.addEventListener(type,fn,capture); listeners.push(() => target.removeEventListener(type,fn,capture)); }
    function close() {
      revision++; win.clearTimeout(timer); controller?.abort(); controller = null;
      list.hidden = true; list.removeAttribute('aria-busy'); input.setAttribute('aria-expanded','false');
      input.removeAttribute('aria-activedescendant'); active = -1;
    }
    function highlight(index) {
      active = index;
      Array.from(list.children).forEach((item,i) => item.setAttribute('aria-selected',String(i === active)));
      if (active < 0) input.removeAttribute('aria-activedescendant');
      else { input.setAttribute('aria-activedescendant',list.children[active].id); list.children[active].scrollIntoView?.({block:'nearest'}); }
    }
    function choose(index) {
      const actor = actors[index]; if (!actor) return;
      close(); input.value = actor.handle;
      // Notify existing form/viewer logic before closing any request it schedules.
      input.dispatchEvent(new win.Event('input',{bubbles:true})); close();
      status.textContent = 'Selected @' + actor.handle + '. Continue when ready.';
      input.dispatchEvent(new win.CustomEvent('atproto-account-selected',{bubbles:true,detail:actor}));
    }
    function show(values) {
      actors = values; list.replaceChildren(); active = -1;
      values.forEach((actor,i) => {
        const item = doc.createElement('li'); item.id = list.id + '-' + i; item.setAttribute('role','option'); item.setAttribute('aria-selected','false');
        const name = doc.createElement('strong'); name.textContent = actor.name;
        const handle = doc.createElement('span'); handle.textContent = '@' + actor.handle;
        item.append(name,handle); item.addEventListener('pointerdown',event => event.preventDefault()); item.addEventListener('click',() => choose(i));
        list.append(item);
      });
      list.hidden = values.length === 0; input.setAttribute('aria-expanded',String(values.length > 0));
      status.textContent = values.length ? values.length + ' matching accounts. Use arrow keys and Enter to choose, or keep typing.' : 'No matches. You can still enter a full handle and continue.';
    }
    async function search(query, version) {
      controller = new win.AbortController(); const signal = controller.signal;
      const timeout = win.setTimeout(() => controller?.signal === signal && controller.abort(),8000);
      status.textContent = 'Finding public accounts…'; list.setAttribute('aria-busy','true');
      try {
        const response = await fetcher(API + 'app.bsky.actor.searchActorsTypeahead?' + new URLSearchParams({q:query,limit:'6'}),{signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if (!response.ok) throw new Error('Public search unavailable');
        const data = await response.json();
        if (destroyed || version !== revision || doc.activeElement !== input || normalize(input.value) !== query) return;
        const seen = new Set();
        show((Array.isArray(data.actors) ? data.actors : []).map(profile).filter(actor => actor && !seen.has(actor.did) && seen.add(actor.did)).slice(0,6));
      } catch {
        if (!destroyed && version === revision) { close(); status.textContent = 'Suggestions unavailable. Enter your full handle and continue.'; }
      } finally { win.clearTimeout(timeout); if (version === revision) list.removeAttribute('aria-busy'); }
    }
    function changed() {
      close(); status.textContent = ''; if (composing) return;
      const query = normalize(input.value);
      if (query.length < 2 || query.length > 253 || /[\s/:?#]/.test(query)) return;
      const version = revision; timer = win.setTimeout(() => search(query,version),options.delay ?? 250);
    }
    listen(input,'input',changed);
    listen(input,'compositionstart',() => { composing = true; close(); });
    listen(input,'compositionend',() => { composing = false; changed(); });
    listen(input,'keydown',event => {
      if (composing || event.isComposing) return;
      if (event.key === 'Escape') { if (!list.hidden) event.preventDefault(); close(); status.textContent = ''; }
      if (event.key === 'Tab') close();
      if (list.hidden) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); event.stopImmediatePropagation();
        highlight(event.key === 'ArrowDown' ? (active + 1) % actors.length : (active < 0 ? actors.length - 1 : (active - 1 + actors.length) % actors.length));
      } else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); event.stopImmediatePropagation(); choose(active); }
    },true);
    listen(input,'blur',() => { close(); status.textContent = ''; });
    listen(doc,'pointerdown',event => { if (!wrapper.contains(event.target)) close(); });
    const api = {close,destroy() { destroyed = true; close(); listeners.forEach(remove => remove()); wrapper.before(input); wrapper.remove(); original.forEach((value,key) => value === null ? input.removeAttribute(key) : input.setAttribute(key,value)); mounted.delete(input); }};
    mounted.set(input,api); return api;
  }
  function mountAll(scope = root.document) { return Array.from(scope.querySelectorAll('[data-atproto-account]')).map(input => mount(input)); }
  const api = {normalize,isHandle,mount,mountAll}; root.PixieAccounts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',() => mountAll(),{once:true});
    else mountAll();
  }
})(typeof window === 'undefined' ? globalThis : window);
