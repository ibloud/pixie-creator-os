/* Explicit optional viewing adapter. No persistence or broadcasting. */
(function (root) {
  'use strict';
  function handle(value) {
    if (typeof value !== 'string') return null;
    const h = value.trim().toLowerCase(), labels = h.split('.');
    return h.length <= 253 && labels.length >= 2 && labels.every(x => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x)) && /^[a-z]/.test(labels.at(-1)) ? h : null;
  }
  function mount(tile, doc = document) {
    const input = tile.querySelector('input'), load = tile.querySelector('button[id^="streamplaceLoad"]');
    const target = tile.querySelector('[id^="streamplaceEmbed"]'), status = tile.querySelector('[id^="streamplaceState"]');
    const remove = doc.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove player'; load.after(remove);
    function clear() { target.replaceChildren(); status.textContent = 'Player removed. No viewing connection.'; }
    remove.addEventListener('click', clear); input.addEventListener('input', clear);
    function view() {
      const h = handle(input.value);
      if (!h) { clear(); status.textContent = 'Enter a public AT Protocol handle such as example.bsky.social. URLs and credentials are not accepted.'; return; }
      const iframe = doc.createElement('iframe'); iframe.title = 'Optional Streamplace player for ' + h;
      iframe.src = 'https://stream.place/embed/' + encodeURIComponent(h); iframe.referrerPolicy = 'no-referrer'; iframe.allowFullscreen = true;
      target.replaceChildren(iframe); status.textContent = 'Player requested. Stream availability is unverified; viewing only.';
    }
    load.addEventListener('click', view); input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); view(); } });
    return { clear, view };
  }
  root.PixieStreamplace = { handle, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = { handle, mount };
})(typeof window === 'undefined' ? globalThis : window);
