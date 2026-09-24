/* PIXIE Creator OS — network intelligence
 * Local demo adapter for creator networks, upcoming signals, cards and invitations.
 * No live crawling or external messaging occurs in this build.
 *
 * Design rule: discovery -> review -> human action.
 * Made-Sick is treated as a source boundary; its records retain provenance.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const STORAGE_KEY = 'pixie-network-intelligence-v1';

  const DEMO_SIGNALS = [
    {
      id: 'ren-network-chris-webby',
      person: 'Chris Webby',
      relationship: 'Inpatient collaborator',
      upcoming: 'Upcoming activity — verify current announcement',
      type: 'PROJECT',
      date: null,
      sourceUrl: 'https://renmakesmusic.com/',
      source: 'Ren / public source',
      status: 'REVIEW',
      provenance: ['ren-network-demo'],
      tags: ['ren-gill', 'inpatient', 'collaborator'],
      demo: true
    },
    {
      id: 'ren-network-skinner-brothers',
      person: 'The Skinner Brothers',
      relationship: 'Collaborating artists',
      upcoming: 'Upcoming activity — verify current announcement',
      type: 'RELEASE',
      date: null,
      sourceUrl: 'https://renmakesmusic.com/',
      source: 'Ren / public source',
      status: 'REVIEW',
      provenance: ['ren-network-demo'],
      tags: ['ren-gill', 'skinner-brothers', 'collaborator'],
      demo: true
    },
    {
      id: 'ren-network-made-sick',
      person: 'Made-Sick collaborator',
      relationship: 'Made-Sick network connection',
      upcoming: 'New card available for review',
      type: 'SIGNAL',
      date: null,
      sourceUrl: 'https://made-sick.org/',
      source: 'Made-Sick',
      status: 'SOURCE',
      provenance: ['made-sick-demo'],
      tags: ['made-sick', 'ren-gill'],
      demo: true
    }
  ];

  const state = {
    signals: [],
    cards: [],
    invitations: [],
    activity: []
  };

  let installObserver = null;
  let installTimer = null;

  function uid(prefix) {
    if (globalThis.crypto?.randomUUID) return prefix + '-' + crypto.randomUUID();
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function now() { return new Date().toISOString(); }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.cards = Array.isArray(saved.cards) ? saved.cards : [];
      state.invitations = Array.isArray(saved.invitations) ? saved.invitations : [];
      state.activity = Array.isArray(saved.activity) ? saved.activity : [];
    } catch (_) {}
    state.signals = DEMO_SIGNALS.map(x => ({ ...x }));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cards: state.cards,
      invitations: state.invitations,
      activity: state.activity.slice(-50)
    }));
  }

  function log(kind, message) {
    state.activity.push({ id: uid('activity'), at: now(), kind, message });
    save();
    renderActivity();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[c]));
  }

  function formatDate(value) {
    if (!value) return 'DATE TO VERIFY';
    const d = new Date(value + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function addCard(signal, overrides = {}) {
    const existing = state.cards.find(card =>
      card.signalId === signal.id || (
        card.person === signal.person &&
        card.title === (overrides.title || signal.upcoming) &&
        card.sourceUrl === signal.sourceUrl
      )
    );
    if (existing) {
      log('CARD', `Card already exists for ${signal.person}`);
      return existing;
    }

    const card = {
      signalId: signal.id,
      id: uid('card'),
      type: 'network-signal',
      title: overrides.title || signal.upcoming,
      person: signal.person,
      relationship: signal.relationship,
      date: overrides.date || signal.date || null,
      kind: signal.type,
      status: 'PROPOSED',
      source: signal.source,
      sourceUrl: overrides.sourceUrl || signal.sourceUrl,
      provenance: signal.provenance || [],
      tags: signal.tags || [],
      createdAt: now(),
      createdBy: 'PIXIE'
    };

    state.cards.push(card);
    log('CARD', `Card proposed for ${card.person}: ${card.title}`);
    render();
    return card;
  }

  async function persistCard(card) {
    if (!globalThis.PIXIE_STORAGE?.createObject || !globalThis.PIXIE_STORAGE?.persistObject) {
      return { ok: false, state: 'DEMO ONLY', card };
    }

    const object = globalThis.PIXIE_STORAGE.createObject({
      type: 'network-card',
      title: card.title,
      human_name: `${card.person} — ${card.title}`,
      source: card.source,
      source_id: card.id,
      status: 'PROPOSED',
      workspace_path: `PIXIE/Network/${safeName(card.person)} — ${safeName(card.title)}.md`,
      provenance: [{
        source: card.source,
        source_url: card.sourceUrl,
        lineage: card.provenance
      }]
    });

    try {
      const result = await globalThis.PIXIE_STORAGE.persistObject(object);
      log('STORAGE', `Saved ${card.person} to the connected PIXIE workspace`);
      return { ok: true, state: result.state, object: result.object };
    } catch (err) {
      log('STORAGE', `Workspace save unavailable: ${err.message || err}`);
      return { ok: false, state: 'NOT SAVED', error: err.message || String(err), card };
    }
  }

  function safeName(value) {
    return String(value || 'network-card')
      .replace(/[^a-z0-9 _-]/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'network-card';
  }

  function invite(signal) {
    const email = window.prompt(
      `Invitation target for ${signal.person}. Enter an email address for the demo invitation record:`
    );
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('Invitation not created: enter a valid email address.');
      return;
    }

    const existing = state.invitations.find(inv =>
      inv.person === signal.person && inv.email.toLowerCase() === email.trim().toLowerCase() && inv.status === 'PENDING'
    );
    if (existing) {
      setStatus(`Invitation already pending for ${signal.person}.`);
      return;
    }
    const invitation = {
      id: uid('invite'),
      person: signal.person,
      email,
      reason: signal.relationship,
      sourceUrl: signal.sourceUrl,
      status: 'PENDING',
      createdAt: now(),
      createdBy: 'PIXIE'
    };
    state.invitations.push(invitation);
    log('INVITE', `Invitation prepared for ${signal.person}`);
    render();
  }

  function importMadeSick() {
    const url = document.getElementById('pixieMadeSickUrl')?.value.trim();
    if (!url) {
      setStatus('Paste a Made-Sick card URL first.');
      return;
    }

    let parsed;
    try { parsed = new URL(url); } catch (_) {
      setStatus('That is not a valid URL.');
      return;
    }

    if (!/made-sick\.org$/i.test(parsed.hostname) && !/\.made-sick\.org$/i.test(parsed.hostname)) {
      setStatus('Source check: use a Made-Sick.org URL.');
      return;
    }

    const signal = {
      id: uid('made-sick'),
      person: 'Made-Sick source card',
      relationship: 'Imported source record',
      upcoming: 'Imported card — metadata pending review',
      type: 'SOURCE CARD',
      date: null,
      sourceUrl: url,
      source: 'Made-Sick',
      status: 'IMPORTED',
      provenance: ['made-sick-url'],
      tags: ['made-sick'],
      demo: false
    };

    state.signals.unshift(signal);
    log('INGEST', `Made-Sick source card received: ${parsed.pathname || '/'}`);
    render();
    setStatus('Source card received locally. PIXIE has not crawled or contacted Made-Sick.');
  }

  function setStatus(message) {
    const el = document.getElementById('pixieNetworkStatus');
    if (el) el.textContent = message;
  }

  function renderSignals() {
    const el = document.getElementById('pixieNetworkSignals');
    if (!el) return;
    el.innerHTML = state.signals.map(signal => `
      <article class="pixie-network-item">
        <div class="pixie-network-item-main">
          <span class="pixie-network-kind">${escapeHtml(signal.type)}</span>
          <h4>${escapeHtml(signal.person)}</h4>
          <p class="pixie-network-relationship">${escapeHtml(signal.relationship)}</p>
          <strong>${escapeHtml(signal.upcoming)}</strong>
          <div class="pixie-network-meta">
            <span>${signal.date ? escapeHtml(formatDate(signal.date)) : 'DATE UNVERIFIED'}</span>
            <span>${escapeHtml(signal.status || 'REVIEW')}</span>
            <span>${escapeHtml(signal.source)}</span>
            <a href="${escapeHtml(signal.sourceUrl)}" target="_blank" rel="noopener">SOURCE ↗</a>
          </div>
        </div>
        <div class="pixie-network-actions">
          <button type="button" data-network-add="${escapeHtml(signal.id)}">ADD CARD</button>
          <button type="button" data-network-invite="${escapeHtml(signal.id)}">SEND INVITATION</button>
        </div>
      </article>
    `).join('');

    el.querySelectorAll('[data-network-add]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const signal = state.signals.find(x => x.id === btn.dataset.networkAdd);
        if (!signal) return;
        const card = addCard(signal);
        const result = await persistCard(card);
        setStatus(result.ok
          ? `Card saved to PIXIE workspace: ${result.object?.machine_path || 'workspace object'}`
          : 'Card added to the local demo queue. Connect a workspace to persist it.');
      });
    });

    el.querySelectorAll('[data-network-invite]').forEach(btn => {
      btn.addEventListener('click', () => {
        const signal = state.signals.find(x => x.id === btn.dataset.networkInvite);
        if (signal) invite(signal);
      });
    });
  }

  function renderCards() {
    const el = document.getElementById('pixieNetworkCards');
    if (!el) return;
    el.innerHTML = state.cards.length
      ? state.cards.slice().reverse().map(card => `
        <div class="pixie-network-card-row">
          <span><b>${escapeHtml(card.person)}</b><small>${escapeHtml(card.relationship)}</small></span>
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.status)}</span>
          <a href="${escapeHtml(card.sourceUrl)}" target="_blank" rel="noopener">SOURCE ↗</a>
        </div>
      `).join('')
      : '<p class="pixie-network-empty">No cards added yet. PIXIE is waiting for a human decision.</p>';
  }

  function renderInvites() {
    const el = document.getElementById('pixieNetworkInvites');
    if (!el) return;
    el.innerHTML = state.invitations.length
      ? state.invitations.slice().reverse().map(inv => `
        <div class="pixie-network-card-row">
          <span><b>${escapeHtml(inv.person)}</b><small>${escapeHtml(inv.reason)}</small></span>
          <strong>${escapeHtml(inv.email)}</strong>
          <span>${escapeHtml(inv.status)}</span>
          <span>${escapeHtml(formatDate(inv.createdAt.slice(0,10)))}</span>
        </div>
      `).join('')
      : '<p class="pixie-network-empty">No invitations prepared.</p>';
  }

  function renderActivity() {
    const el = document.getElementById('pixieNetworkActivity');
    if (!el) return;
    el.innerHTML = state.activity.slice().reverse().slice(0, 8).map(item => `
      <div><time>${escapeHtml(new Date(item.at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}))}</time><b>${escapeHtml(item.kind)}</b><span>${escapeHtml(item.message)}</span></div>
    `).join('') || '<div><span>PIXIE has not acted yet.</span></div>';
  }

  function render() {
    renderSignals();
    renderCards();
    renderInvites();
    renderActivity();
    const count = document.getElementById('pixieNetworkCount');
    if (count) count.textContent = `${state.signals.length} SIGNALS · ${state.cards.length} CARDS · ${state.invitations.length} INVITES`;
  }

  function install() {
    load();

    const reconPage = document.querySelector('#panel-recon .recon-page');
    if (!reconPage) return;
    if (document.getElementById('pixie-network')) {
      render();
      return;
    }

    const section = document.createElement('section');
    section.id = 'pixie-network';
    section.className = 'pixie-network-section';
    section.innerHTML = `
      <div class="pixie-network-head">
        <div>
          <span class="recon-kicker">PIXIE // NETWORK INTELLIGENCE</span>
          <h3>PEOPLE. CONNECTIONS. WHAT'S NEXT.</h3>
          <p>PIXIE finds a documented connection, surfaces a signal for verification, and leaves the decision with the human.</p>
        </div>
        <span id="pixieNetworkCount" class="pixie-network-count"></span>
      </div>

      <div class="pixie-network-ingest">
        <label for="pixieMadeSickUrl">MADE-SICK CARD / SOURCE URL</label>
        <div>
          <input id="pixieMadeSickUrl" type="url" placeholder="https://made-sick.org/…" autocomplete="off">
          <button id="pixieImportMadeSick" type="button">RECEIVE CARD</button>
        </div>
        <p id="pixieNetworkStatus" role="status" aria-live="polite">LOCAL DEMO · no external crawl or message is sent.</p>
      </div>

      <div class="pixie-network-grid">
        <div class="pixie-network-feed">
          <header><div><small>DISCOVERY QUEUE</small><strong>REN GILL NETWORK</strong></div><span>HUMAN REVIEW</span></header>
          <div id="pixieNetworkSignals"></div>
        </div>

        <aside class="pixie-network-side">
          <section>
            <header><small>CARDS CREATED</small><strong>PIXIE QUEUE</strong></header>
            <div id="pixieNetworkCards"></div>
          </section>
          <section>
            <header><small>INVITATIONS</small><strong>OUTREACH QUEUE</strong></header>
            <div id="pixieNetworkInvites"></div>
          </section>
          <section>
            <header><small>ACTIVITY</small><strong>PIXIE TELEMETRY</strong></header>
            <div id="pixieNetworkActivity" class="pixie-network-activity"></div>
          </section>
        </aside>
      </div>
    `;

    reconPage.appendChild(section);

    document.getElementById('pixieImportMadeSick')?.addEventListener('click', importMadeSick);
    render();
  }

  function waitForRecon() {
    install();
    if (document.getElementById('pixie-network')) return;

    if (!installObserver && document.body) {
      installObserver = new MutationObserver(() => {
        if (document.querySelector('#panel-recon .recon-page')) {
          install();
          if (document.getElementById('pixie-network')) {
            installObserver.disconnect();
            installObserver = null;
          }
        }
      });
      installObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!installTimer) {
      installTimer = setInterval(() => {
        install();
        if (document.getElementById('pixie-network')) {
          clearInterval(installTimer);
          installTimer = null;
        }
      }, 250);
      setTimeout(() => {
        if (installTimer) {
          clearInterval(installTimer);
          installTimer = null;
        }
      }, 10000);
    }
  }

  globalThis.PIXIENetwork = Object.freeze({
    VERSION,
    getState: () => ({
      signals: state.signals.map(x => ({...x})),
      cards: state.cards.map(x => ({...x})),
      invitations: state.invitations.map(x => ({...x})),
      activity: state.activity.map(x => ({...x}))
    }),
    addCard,
    invite
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForRecon, { once: true });
  else waitForRecon();
})();
