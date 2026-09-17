/* PIXIE storage router — browser-side control plane.
 * Rule: names are presentation, IDs are identity, paths are implementation details.
 * Durable workspace state prefers an Obsidian vault; writable PDS is a fallback.
 * Source-owned records remain authoritative at their source when writable.
 */
(() => {
  'use strict';

  const NS = 'pixie';
  const STORAGE_KEY = `${NS}.workspace.v1`;

  const now = () => new Date().toISOString();
  const makeId = () => {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `pixie-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const state = {
    schema: 1,
    workspace: { provider: 'obsidian', state: 'NOT CONFIGURED', vault: null },
    objects: {},
    updatedAt: now()
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.schema === 1) Object.assign(state, saved);
    } catch (_) {}
    return state;
  }

  function saveState() {
    state.updatedAt = now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function slug(value) {
    return String(value || 'object')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
      .toLowerCase() || 'object';
  }

  function machinePath(id, extension = 'json') {
    return `PIXIE/Objects/${id}.${extension}`;
  }

  function assetPath(id, extension) {
    return `PIXIE/Assets/${id}.${extension}`;
  }

  function createObject(input = {}) {
    const object = {
      pixie_id: input.pixie_id || makeId(),
      type: input.type || 'asset',
      title: input.title || 'Untitled',
      source: input.source || 'local',
      source_id: input.source_id || null,
      human_name: input.human_name || input.title || 'Untitled',
      machine_path: input.machine_path || machinePath(input.pixie_id || 'pending'),
      workspace_path: input.workspace_path || null,
      status: input.status || 'LOCAL',
      created_at: input.created_at || now(),
      updated_at: now(),
      provenance: input.provenance || []
    };
    if (object.machine_path.includes('pending')) object.machine_path = machinePath(object.pixie_id);
    state.objects[object.pixie_id] = object;
    saveState();
    return object;
  }

  function updateObject(id, patch = {}) {
    if (!state.objects[id]) throw new Error(`Unknown PIXIE object: ${id}`);
    state.objects[id] = { ...state.objects[id], ...patch, pixie_id: id, updated_at: now() };
    saveState();
    return state.objects[id];
  }

  function toObsidianMarkdown(object) {
    const frontmatter = [
      '---',
      `pixie_id: ${object.pixie_id}`,
      `type: ${object.type}`,
      `source: ${object.source}`,
      `source_id: ${object.source_id || ''}`,
      `status: ${object.status}`,
      `machine_path: ${object.machine_path}`,
      `updated_at: ${object.updated_at}`,
      '---'
    ].join('\n');
    return `${frontmatter}\n\n# ${object.human_name}\n\nPIXIE ID: \`${object.pixie_id}\`\n\nSource: ${object.source}\n\nStatus: ${object.status}\n`;
  }

  function openObsidian(object) {
    const vaultPath = state.workspace.vault;
    if (!vaultPath) return { ok: false, state: 'NOT CONFIGURED', object };
    const relative = object.workspace_path || `PIXIE/Library/${slug(object.human_name)}.md`;
    const uri = `obsidian://open?vault=${encodeURIComponent(vaultPath)}&file=${encodeURIComponent(relative.replace(/\.md$/, ''))}`;
    window.open(uri, '_blank', 'noopener');
    return { ok: true, state: 'REQUESTED', uri, object };
  }

  async function chooseVault() {
    if (!window.showDirectoryPicker) return { ok: false, state: 'FILE SYSTEM ACCESS UNAVAILABLE' };
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    state.workspace = { provider: 'obsidian', state: 'CONNECTED', vault: handle.name };
    saveState();
    return { ok: true, state: 'CONNECTED', vault: handle.name };
  }

  function renderWorkspacePanel() {
    const panels = document.querySelector('.panels');
    const dock = document.querySelector('.dock');
    if (!panels || !dock || document.getElementById('panel-workspace')) return;

    const nav = document.createElement('button');
    nav.className = 'dock-app';
    nav.dataset.panel = 'workspace';
    nav.type = 'button';
    nav.setAttribute('aria-controls', 'panel-workspace');
    nav.setAttribute('aria-pressed', 'false');
    nav.innerHTML = 'WORKSPACE<span>STORAGE</span>';
    dock.appendChild(nav);

    const panel = document.createElement('article');
    panel.className = 'panel';
    panel.id = 'panel-workspace';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="panel-head"><h2>WORKSPACE // STORAGE CONTROL PLANE</h2><button class="close-panel" type="button" aria-label="Return to Story Radar">×</button></div>
      <div class="storage-wrap">
        <section class="storage-card storage-primary">
          <div><small>WORKSPACE PERSISTENCE</small><strong>OBSIDIAN</strong><p id="storageState">NOT CONFIGURED</p></div>
          <button class="action" id="connectObsidian" type="button">CONNECT VAULT</button>
        </section>
        <section class="storage-card"><div><small>IDENTITY</small><strong>PIXIE ID</strong><p>Stable identity survives human filename and folder changes.</p></div><code id="storageExample">PIXIE/Objects/&lt;pixie_id&gt;.json</code></section>
        <section class="storage-card"><div><small>FALLBACK</small><strong>WRITABLE PDS</strong><p>Use when a connected source cannot accept the user's durable edit.</p></div><span class="tag">STAGED</span></section>
        <section class="storage-policy"><strong>NAMES ARE PRESENTATION. IDs ARE IDENTITY. PATHS ARE IMPLEMENTATION DETAILS.</strong><p>Source-owned data stays authoritative at its source when writable. Workspace-owned sessions, notes, setlists and project metadata belong in Obsidian. Local/browser state is never treated as canonical.</p></section>
        <div class="storage-actions"><button class="action" id="createWorkspaceObject" type="button">CREATE TEST OBJECT</button><button class="action" id="openWorkspaceObject" type="button">OPEN IN OBSIDIAN</button></div>
        <pre id="storageLog" class="storage-log" aria-live="polite"></pre>
      </div>`;
    panels.appendChild(panel);

    const switchWorkspace = () => {
      document.querySelectorAll('.panel').forEach(p => { const active = p === panel; p.classList.toggle('active', active); p.hidden = !active; p.setAttribute('aria-hidden', active ? 'false' : 'true'); });
      document.querySelectorAll('.dock-app').forEach(b => { const active = b === nav; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active ? 'true' : 'false'); b.setAttribute('aria-current', active ? 'page' : 'false'); });
      refresh();
    };
    nav.addEventListener('click', switchWorkspace);
    panel.querySelector('.close-panel').addEventListener('click', () => document.querySelector('.dock-app[data-panel="radar"]')?.click());

    let lastObject = null;
    const refresh = () => {
      const s = loadState();
      panel.querySelector('#storageState').textContent = `${s.workspace.state}${s.workspace.vault ? ` · ${s.workspace.vault}` : ''}`;
      panel.querySelector('#storageExample').textContent = lastObject?.machine_path || 'PIXIE/Objects/<pixie_id>.json';
      panel.querySelector('#storageLog').textContent = lastObject ? JSON.stringify(lastObject, null, 2) : 'No workspace object created in this session.';
    };
    panel.querySelector('#connectObsidian').addEventListener('click', async () => {
      try { const result = await chooseVault(); panel.querySelector('#storageLog').textContent = JSON.stringify(result, null, 2); refresh(); }
      catch (err) { panel.querySelector('#storageLog').textContent = `VAULT SELECTION CANCELLED OR DENIED\n${err.message || err}`; }
    });
    panel.querySelector('#createWorkspaceObject').addEventListener('click', () => {
      lastObject = createObject({ type: 'session', title: 'Night Bus Session', human_name: 'Night Bus Session', source: 'pixie-workspace', status: 'LOCAL' });
      panel.querySelector('#storageLog').textContent = toObsidianMarkdown(lastObject);
      refresh();
    });
    panel.querySelector('#openWorkspaceObject').addEventListener('click', () => {
      if (!lastObject) lastObject = createObject({ type: 'session', title: 'Night Bus Session', human_name: 'Night Bus Session' });
      const result = openObsidian(lastObject);
      panel.querySelector('#storageLog').textContent = JSON.stringify(result, null, 2);
    });
    refresh();
  }

  loadState();
  window.PIXIE_STORAGE = Object.freeze({ loadState, saveState, createObject, updateObject, toObsidianMarkdown, openObsidian, chooseVault, machinePath, assetPath });
  document.addEventListener('DOMContentLoaded', renderWorkspacePanel);
})();
