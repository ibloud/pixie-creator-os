/* PIXIE Source Memory — replaceable preservation boundary.
   Phase 1/2: local deterministic adapter. A real ArchiveBox adapter can implement
   the same preserve() contract later without changing Story or narrative code.
*/
'use strict';

window.PIXIE_SOURCE_MEMORY = window.PIXIE_SOURCE_MEMORY || (() => {
  const VERSION = 1;
  const PROVIDER = 'local';
  const FORMATS = ['metadata'];

  function normalize(source = {}) {
    const now = source.capturedAt || source.observedAt || new Date().toISOString();
    return {
      id: source.id || `source-${Date.now()}`,
      type: source.type || 'web',
      url: source.url || '',
      title: source.title || '',
      observation: source.observation || '',
      observedAt: source.observedAt || now,
      capturedAt: source.capturedAt || now,
      relationship: source.relationship || 'prompted-observation',
      preservation: {
        status: source.preservation?.status || 'pending',
        provider: source.preservation?.provider || PROVIDER,
        snapshotId: source.preservation?.snapshotId || '',
        snapshotPath: source.preservation?.snapshotPath || '',
        reference: source.preservation?.reference || '',
        capturedAt: source.preservation?.capturedAt || '',
        formats: Array.isArray(source.preservation?.formats) ? source.preservation.formats : []
      },
      provenance: Array.isArray(source.provenance) ? source.provenance : []
    };
  }

  const adapters = {};

  adapters.local = {
    name: 'local',
    preserve(source) {
      const s = normalize(source);
      const snapshotId = `local-${s.id}`;
      s.preservation = {
        status: 'preserved',
        provider: 'local',
        snapshotId,
        snapshotPath: `local://pixie/source-memory/${snapshotId}`,
        reference: `PIXIE SOURCE MEMORY / ${snapshotId}`,
        capturedAt: new Date().toISOString(),
        formats: FORMATS.slice()
      };
      return s;
    }
  };

  function register(name, adapter) {
    if (!name || !adapter || typeof adapter.preserve !== 'function') return;
    adapters[name] = adapter;
  }

  function preserve(source, provider = 'local') {
    const adapter = adapters[provider] || adapters.local;
    return adapter.preserve(normalize(source));
  }

  function attach(story, source, provider = 'local') {
    if (!story) return null;
    story.sources = Array.isArray(story.sources) ? story.sources : [];
    const preserved = preserve(source, provider);
    const existing = story.sources.findIndex(x => x.id === preserved.id);
    if (existing >= 0) story.sources[existing] = preserved;
    else story.sources.unshift(preserved);
    story.provenance = Array.isArray(story.provenance) ? story.provenance : [];
    story.provenance.unshift({
      type: 'source-memory',
      sourceId: preserved.id,
      provider: preserved.preservation.provider,
      snapshotId: preserved.preservation.snapshotId,
      relationship: preserved.relationship,
      capturedAt: preserved.preservation.capturedAt
    });
    return preserved;
  }

  return { VERSION, adapters, register, normalize, preserve, attach };
})();

(function initSourceMemoryUI(){
  function renderStatus(source) {
    const el = document.getElementById('sourceMemoryStatus');
    if (!el) return;
    if (!source) {
      el.innerHTML = '<span class="a11y-note">No source attached. Capture a URL or source title first.</span>';
      return;
    }
    const p = source.preservation || {};
    const status = (p.status || 'pending').toUpperCase();
    el.innerHTML = `<div class="context-row"><span>STATUS</span><span class="confidence">${status}</span></div><div class="context-row"><span>PROVIDER</span><span>${escapeSourceText(p.provider || '—')}</span></div><div class="context-row"><span>SNAPSHOT</span><span>${escapeSourceText(p.snapshotId || '—')}</span></div><div class="context-row"><span>FORMATS</span><span>${escapeSourceText((p.formats || []).join(' · ') || '—')}</span></div>`;
  }

  function escapeSourceText(value) {
    return String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]));
  }

  function getActiveStory() {
    if (!window.PIXIE_STORY_ENGINE) return null;
    return window.PIXIE_STORY_ENGINE.active?.() || null;
  }

  function attachLatest() {
    const input = document.getElementById('narrativeSource');
    const note = document.getElementById('narrativeNote');
    const title = input?.value?.trim() || '';
    if (!title || !window.PIXIE_STORY_ENGINE || !window.PIXIE_SOURCE_MEMORY) return;
    const story = getActiveStory();
    if (!story) return;
    const isUrl = /^https?:\/\//i.test(title);
    const source = {
      id: `source-${story.id}`,
      type: isUrl ? 'web' : 'signal',
      url: isUrl ? title : (story.source?.url || ''),
      title: isUrl ? (story.subject?.title || title) : title,
      observation: note?.value?.trim() || story.signal?.observation || '',
      observedAt: story.signal?.capturedAt || new Date().toISOString(),
      relationship: 'prompted-observation'
    };
    const preserved = window.PIXIE_SOURCE_MEMORY.attach(story, source);
    window.PIXIE_STORY_ENGINE.save(story);
    window.PIXIE_STORY_ENGINE.setActive?.(story.id);
    renderStatus(preserved);
    const notice = document.getElementById('notice');
    if (notice) notice.textContent = `SOURCE PRESERVED · ${preserved.preservation.snapshotId}`;
  }

  function renderActiveSource() {
    const story = getActiveStory();
    const source = story?.sources?.[0] || null;
    renderStatus(source);
  }

  function install() {
    const side = document.querySelector('.narrative-side .narrative-stack');
    if (side && !document.getElementById('sourceMemoryCard')) {
      const card = document.createElement('div');
      card.className = 'narrative-card';
      card.id = 'sourceMemoryCard';
      card.innerHTML = '<small>SOURCE MEMORY</small><p>Preserve the source separately from your interpretation. This local adapter is deterministic and can be replaced by ArchiveBox later.</p><div id="sourceMemoryStatus"><span class="a11y-note">No source attached.</span></div><div class="actions"><button type="button" id="preserveSource">PRESERVE SOURCE</button></div>';
      side.insertBefore(card, side.firstChild);
      document.getElementById('preserveSource').addEventListener('click', attachLatest);
    }
    const capture = document.getElementById('narrativeAdd');
    if (capture && !capture.dataset.sourceMemoryBound) {
      capture.dataset.sourceMemoryBound = 'true';
      capture.addEventListener('click', () => setTimeout(attachLatest, 0));
    }
    window.addEventListener?.('pixie:story-active', renderActiveSource);
    renderActiveSource();
  }

  document.addEventListener('DOMContentLoaded', install);
})();
