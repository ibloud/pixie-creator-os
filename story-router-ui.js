/* Atmosphere file import and local simulation UI. No credentials or external writes. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  if (!$('router-file')) return;
  const model = window.PIXIE_STORY, engine = window.PIXIE_STORY_ENGINE, api = window.PIXIE_STORY_ROUTER;
  let sources = [], story = null, reviewed = null;
  const destinations = [
    api.fakeDestination({ id: 'test-publication' }),
    api.fakeDestination({ id: 'pixie.pckt.blog' }),
    api.fakeDestination({ id: 'made-sick.pckt.blog', consentFirst: true }),
    api.fakeDestination({ id: 'reference-only', supports: ['reference'] }),
    api.fakeDestination({ id: 'lost-response', mode: 'lost-response' }),
    api.fakeDestination({ id: 'read-only', mode: 'read-only' }),
    api.fakeDestination({ id: 'offline', mode: 'offline' }),
    api.fakeDestination({ id: 'permission-denied', mode: 'permission-denied' })
  ];
  const router = api.createRouter({ save: s => engine.save(s) });
  const status = text => { $('router-status').textContent = text; };
  function invalidate() { reviewed = null; $('router-send').disabled = true; $('router-export').disabled = true; $('router-preview').textContent = ''; }
  function populateSaved() {
    const select = $('router-saved'); select.replaceChildren(new Option('Choose a saved routing story', ''));
    engine.list().filter(s => s.publish?.router).forEach(s => select.add(new Option(s.subject.title || s.id, s.id)));
  }
  destinations.forEach(d => $('router-destination').add(new Option(d.id + ' (simulation)', d.id)));
  function renderSources(selected = []) {
    $('router-sources').replaceChildren();
    sources.forEach(source => {
      const label = document.createElement('label'), input = document.createElement('input');
      input.type = 'checkbox'; input.value = source.uri; input.checked = selected.includes(source.uri);
      input.addEventListener('change', invalidate);
      label.append(input, ` ${source.authorDid} · ${source.createdAt || 'date unknown'} · ${source.provenance} · embedding ${source.embedding}`);
      const link = document.createElement('a'); link.href = source.url; link.textContent = 'Open source'; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const row = document.createElement('div'); row.append(label, ' ', link); $('router-sources').append(row);
    });
  }
  $('router-file').addEventListener('change', async event => {
    invalidate();
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a ledger smaller than 5 MB.');
      const ledger = window.PIXIE_LEDGER.importLedger(await file.text());
      sources = ledger.posts; story = null; renderSources();
      status(`${sources.length} sources imported into this tab. Reference-only: Creator OS sign-in is not connected. Selection does not grant publication consent.`);
    } catch (error) { sources = []; story = null; renderSources(); status(error.message); }
  });
  $('router-load-saved').addEventListener('click', () => {
    invalidate(); const loaded = engine.load($('router-saved').value);
    if (!loaded?.publish?.router) { status('Choose a saved routing story.'); return; }
    // Resanitize after reload: no signed-in identity exists on this surface.
    story = loaded; sources = loaded.sources.map(s => { const copy = { ...s }; delete copy.text; return copy; });
    story.sources = sources;
    $('router-title').value = loaded.subject.title; $('router-context').value = loaded.publish.router.context || '';
    $('router-destination').value = loaded.publish.router.intent?.destination || '';
    renderSources(loaded.publish.router.sources.map(s => s.uri));
    status('Saved routing story loaded. Review again before simulation.');
  });
  function composition() {
    const chosen = [...$('router-sources').querySelectorAll('input:checked')].map(x => ({ uri: x.value, form: 'reference', consent: $('router-consent').checked }));
    if (!story) story = model.create({ id: 'story-' + crypto.randomUUID(), subject: { type: 'PUBLIC_RESHARE', title: $('router-title').value }, sources, publish: { status: 'composing', router: { sources: [], context: '', receipts: [] } } });
    story.subject.title = $('router-title').value; story.sources = sources;
    story.publish.router.sources = chosen; story.publish.router.context = $('router-context').value;
    return story;
  }
  ['router-title', 'router-context', 'router-destination', 'router-consent'].forEach(id => $(id).addEventListener('input', invalidate));
  $('router-separate').addEventListener('click', () => {
    invalidate();
    try { if (!story) throw new Error('Choose a routing story first.'); api.startSeparateReshare(story); status('Separate reshare started. Choose a destination and review again. Existing receipts remain.'); }
    catch (error) { status(error.message); }
  });
  $('router-review').addEventListener('click', () => {
    invalidate();
    try {
      const destination = destinations.find(d => d.id === $('router-destination').value);
      reviewed = JSON.stringify(api.preview(composition(), destination));
      $('router-preview').textContent = JSON.stringify(JSON.parse(reviewed), null, 2);
      $('router-export').disabled = false; $('router-send').disabled = !destination.writable;
      status('Exact public representation shown below. This build can simulate or export it; live publishing is not connected.');
    } catch (error) { status(error.message); }
  });
  $('router-send').addEventListener('click', async () => {
    $('router-send').disabled = true;
    try {
      const destination = destinations.find(d => d.id === $('router-destination').value);
      const result = await router.publish(composition(), destination, { approvedPreview: reviewed });
      status(`Simulated receipt: ${result.receipt.uri} · ${result.receipt.cid}. Storage: ${result.persistence}. No public write occurred.`);
      populateSaved();
    } catch (error) { status(error.message); }
    finally { $('router-send').disabled = !reviewed; }
  });
  function download(value, filename) {
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('router-export').addEventListener('click', () => { if (reviewed) download(JSON.stringify(JSON.parse(reviewed), null, 2), 'pixie-story-reshare-preview.json'); });
  $('router-recovery').addEventListener('click', () => download(engine.exportRecovery(), 'pixie-story-recovery.json'));
  populateSaved();
})();
