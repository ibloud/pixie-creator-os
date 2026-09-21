/* PIXIE storage router — browser-side control plane.
 * Durable rule: user content belongs in Obsidian or a writable PDS.
 * Runtime caches/config are never canonical content.
 * Rule: names are presentation, IDs are identity, paths are implementation details.
 */
(() => {
  'use strict';

  const DB_NAME = 'pixie-capabilities';
  const DB_VERSION = 1;
  const HANDLE_STORE = 'handles';
  const HANDLE_KEY = 'obsidian-vault';

  const now = () => new Date().toISOString();
  const makeId = () => {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `pixie-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const runtime = {
    workspace: { provider: 'obsidian', state: 'NOT CONFIGURED', vault: null },
    lastObject: null
  };

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
    const pixieId = input.pixie_id || makeId();
    return {
      pixie_id: pixieId,
      type: input.type || 'asset',
      title: input.title || 'Untitled',
      source: input.source || 'local',
      source_id: input.source_id || null,
      human_name: input.human_name || input.title || 'Untitled',
      machine_path: input.machine_path || machinePath(pixieId),
      workspace_path: input.workspace_path || null,
      status: input.status || 'LOCAL',
      created_at: input.created_at || now(),
      updated_at: now(),
      provenance: input.provenance || []
    };
  }

  function updateObject(object, patch = {}) {
    if (!object?.pixie_id) throw new Error('PIXIE object requires pixie_id');
    return { ...object, ...patch, pixie_id: object.pixie_id, updated_at: now() };
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

  function openDatabase() {
    if (!('indexedDB' in globalThis)) return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(HANDLE_STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }

  async function putVaultHandle(handle) {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Could not persist vault capability'));
    });
    db.close();
  }

  async function getVaultHandle() {
    try {
      const db = await openDatabase();
      const value = await new Promise((resolve, reject) => {
        const tx = db.transaction(HANDLE_STORE, 'readonly');
        const request = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return value;
    } catch (_) {
      return null;
    }
  }

  async function verifyWritePermission(handle, request = false) {
    if (!handle?.queryPermission) return true;
    let permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted' && request) permission = await handle.requestPermission({ mode: 'readwrite' });
    return permission === 'granted';
  }

  async function ensureDirectory(root, parts) {
    let current = root;
    for (const part of parts) current = await current.getDirectoryHandle(part, { create: true });
    return current;
  }

  async function writeTextFile(relativePath, text) {
    const root = await getVaultHandle();
    if (!root) throw new Error('No Obsidian vault is connected');
    if (!(await verifyWritePermission(root, true))) throw new Error('Obsidian vault write permission was not granted');

    const parts = relativePath.split('/').filter(Boolean);
    const filename = parts.pop();
    const directory = await ensureDirectory(root, parts);
    const file = await directory.getFileHandle(filename, { create: true });
    const writable = await file.createWritable();
    try { await writable.write(text); }
    finally { await writable.close(); }
    return relativePath;
  }

  async function persistObject(object) {
    const jsonPath = object.machine_path;
    const markdownPath = object.workspace_path || `PIXIE/Library/${slug(object.human_name)}.md`;
    await writeTextFile(jsonPath, JSON.stringify(object, null, 2));
    await writeTextFile(markdownPath, toObsidianMarkdown(object));
    runtime.lastObject = object;
    return { ok: true, state: 'SYNCED', jsonPath, markdownPath, object };
  }

  function openObsidian(object = runtime.lastObject) {
    if (!object) return { ok: false, state: 'NO OBJECT' };
    const vault = runtime.workspace.vault;
    if (!vault) return { ok: false, state: 'NOT CONFIGURED', object };
    const relative = object.workspace_path || `PIXIE/Library/${slug(object.human_name)}.md`;
    const uri = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(relative.replace(/\.md$/, ''))}`;
    globalThis.open(uri, '_blank', 'noopener');
    return { ok: true, state: 'REQUESTED', uri, object };
  }

  async function restoreVault() {
    const handle = await getVaultHandle();
    if (!handle) return { ok: false, state: 'NOT CONFIGURED' };
    const granted = await verifyWritePermission(handle, false);
    runtime.workspace = { provider: 'obsidian', state: granted ? 'CONNECTED' : 'PERMISSION REQUIRED', vault: handle.name, handle };
    return { ok: granted, state: runtime.workspace.state, vault: handle.name };
  }

  async function chooseVault() {
    if (!globalThis.showDirectoryPicker) return { ok: false, state: 'FILE SYSTEM ACCESS UNAVAILABLE' };
    const handle = await globalThis.showDirectoryPicker({ mode: 'readwrite' });
    if (!(await verifyWritePermission(handle, true))) throw new Error('Write permission was not granted');
    await putVaultHandle(handle);
    runtime.workspace = { provider: 'obsidian', state: 'CONNECTED', vault: handle.name, handle };
    return { ok: true, state: 'CONNECTED', vault: handle.name };
  }

  function renderWorkspacePanel() {
    const panels = document.querySelector('.panels');
    if (!panels || document.getElementById('panel-workspace')) return;

    const panel = document.createElement('article');
    panel.className = 'panel';
    panel.id = 'panel-workspace';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="panel-head"><h2>WORKSPACE // STORAGE CONTROL PLANE</h2><button class="close-panel" type="button" aria-label="Return to Home">×</button></div>
      <div class="storage-wrap">
        <section class="storage-card storage-primary">
          <div><small>WORKSPACE PERSISTENCE</small><strong>OBSIDIAN</strong><p id="storageState">NOT CONFIGURED</p></div>
          <button class="action" id="connectObsidian" type="button">CONNECT VAULT</button>
        </section>
        <section class="storage-card"><div><small>IDENTITY</small><strong>PIXIE ID</strong><p>Stable identity survives human filename and folder changes.</p></div><code id="storageExample">PIXIE/Objects/&lt;pixie_id&gt;.json</code></section>
        <section class="storage-card"><div><small>FALLBACK</small><strong>WRITABLE PDS</strong><p>Use when a connected source cannot accept the user's durable edit.</p></div><span class="tag">STAGED</span></section>
        <section class="storage-policy"><strong>NAMES ARE PRESENTATION. IDs ARE IDENTITY. PATHS ARE IMPLEMENTATION DETAILS.</strong><p>Source-owned data stays authoritative at its source when writable. Workspace-owned sessions, notes, setlists and project metadata belong in Obsidian. Browser state is runtime-only and never canonical.</p></section>
        <div class="storage-actions"><button class="action" id="createWorkspaceObject" type="button">CREATE + SAVE OBJECT</button><button class="action" id="openWorkspaceObject" type="button">OPEN IN OBSIDIAN</button></div>
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

    const refresh = () => {
      const s = runtime.workspace;
      panel.querySelector('#storageState').textContent = `${s.state}${s.vault ? ` · ${s.vault}` : ''}`;
      panel.querySelector('#storageExample').textContent = runtime.lastObject?.machine_path || 'PIXIE/Objects/<pixie_id>.json';
      panel.querySelector('#storageLog').textContent = runtime.lastObject ? JSON.stringify(runtime.lastObject, null, 2) : 'No workspace object created in this session.';
    };

    panel.querySelector('#connectObsidian').addEventListener('click', async () => {
      try { const result = await chooseVault(); panel.querySelector('#storageLog').textContent = JSON.stringify(result, null, 2); refresh(); }
      catch (err) { panel.querySelector('#storageLog').textContent = `VAULT SELECTION CANCELLED OR DENIED\n${err.message || err}`; }
    });

    panel.querySelector('#createWorkspaceObject').addEventListener('click', async () => {
      const object = createObject({ type: 'session', title: 'Night Bus Session', human_name: 'Night Bus Session', source: 'pixie-workspace', status: 'LOCAL' });
      try {
        const result = await persistObject(object);
        runtime.lastObject = { ...result.object, status: 'SYNCED' };
        panel.querySelector('#storageLog').textContent = JSON.stringify(result, null, 2);
      } catch (err) {
        runtime.lastObject = object;
        panel.querySelector('#storageLog').textContent = `SAVE FAILED\n${err.message || err}\n\nNo durable workspace content was written.`;
      }
      refresh();
    });

    panel.querySelector('#openWorkspaceObject').addEventListener('click', () => {
      const result = openObsidian();
      panel.querySelector('#storageLog').textContent = JSON.stringify(result, null, 2);
    });

    refresh();
  }

  globalThis.PIXIE_STORAGE = Object.freeze({
    createObject,
    updateObject,
    toObsidianMarkdown,
    openObsidian,
    chooseVault,
    restoreVault,
    persistObject,
    machinePath,
    assetPath,
    getWorkspace: () => ({ ...runtime.workspace, handle: undefined })
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await restoreVault();
    renderWorkspacePanel();
  });
})();
