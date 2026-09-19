/* PIXIE Creator OS — app.js
   Pre-Alpha: real dual-deck Web Audio playback from local files.
   No network. No accounts. Works in browser + Safari/iPad.
*/

'use strict';

// ── AUDIO ENGINE ─────────────────────────────────────────────────────────────

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Each deck: source, gainNode, eqNodes, buffer, playing state, start offset
const decks = {
  a: { buffer: null, source: null, gain: null, eq: null, startedAt: 0, offset: 0, playing: false, name: null },
  b: { buffer: null, source: null, gain: null, eq: null, startedAt: 0, offset: 0, playing: false, name: null },
};

// Master gain
let masterGain = null;
// Crossfader: 0 = full A, 100 = full B
let crossfaderVal = 50;

function initMaster() {
  const c = getCtx();
  if (masterGain) return;
  masterGain = c.createGain();
  masterGain.gain.value = 0.78;
  masterGain.connect(c.destination);
}

function buildDeckGraph(deck, eqVal) {
  const c = getCtx();
  initMaster();

  // Gain node (volume / crossfader)
  deck.gain = c.createGain();
  deck.gain.connect(masterGain);

  // Simple 3-band EQ via BiquadFilters
  const low  = c.createBiquadFilter(); low.type  = 'lowshelf';  low.frequency.value  = 200;
  const mid  = c.createBiquadFilter(); mid.type  = 'peaking';   mid.frequency.value  = 1000; mid.Q.value = 1;
  const high = c.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 4000;
  setEQ(low, mid, high, eqVal);

  low.connect(mid);
  mid.connect(high);
  high.connect(deck.gain);

  deck.eq = { low, mid, high };
  return low; // chain entry point
}

function setEQ(low, mid, high, val) {
  // val 0-100: centre (50) is flat. Below boosts low/cuts high, above cuts low/boosts high.
  const v = (val - 50) / 50; // -1 to +1
  low.gain.value  = -v * 12;
  mid.gain.value  =  0;
  high.gain.value =  v * 12;
}

function applyCrossfader(val) {
  crossfaderVal = val;
  // linear crossfade
  const a = Math.cos((val / 100) * Math.PI / 2);
  const b = Math.sin((val / 100) * Math.PI / 2);
  if (decks.a.gain) decks.a.gain.gain.value = a;
  if (decks.b.gain) decks.b.gain.gain.value = b;
}

function loadBuffer(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    getCtx().decodeAudioData(e.target.result.slice(0), buf => cb(null, buf), err => cb(err));
  };
  reader.readAsArrayBuffer(file);
}

function playDeck(id, eqVal) {
  const deck = decks[id];
  if (!deck.buffer) return;
  stopDeck(id, true); // stop without clearing offset

  const c = getCtx();
  const entryNode = buildDeckGraph(deck, eqVal);

  deck.source = c.createBufferSource();
  deck.source.buffer = deck.buffer;
  deck.source.loop = false;
  deck.source.connect(entryNode);
  deck.source.start(0, deck.offset);
  deck.startedAt = c.currentTime - deck.offset;
  deck.playing = true;

  deck.source.onended = () => {
    if (deck.playing) {
      deck.playing = false;
      deck.offset = 0;
      updatePlayButton();
      setPlatterSpin(id, false);
      setPosition(id, 0);
    }
  };

  setPlatterSpin(id, true);
  applyCrossfader(crossfaderVal);
}

function stopDeck(id, pause) {
  const deck = decks[id];
  if (deck.source) {
    try { deck.source.onended = null; deck.source.stop(); } catch(e) {}
    deck.source = null;
  }
  if (pause && deck.playing) {
    deck.offset = getCtx().currentTime - deck.startedAt;
  } else if (!pause) {
    deck.offset = 0;
  }
  deck.playing = false;
  setPlatterSpin(id, false);
}

function cueDeck(id) {
  stopDeck(id, false);
  decks[id].offset = 0;
  setPosition(id, 0);
  updatePlayButton();
}

// ── CLOCK / POSITION ─────────────────────────────────────────────────────────

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function currentOffset(id) {
  const deck = decks[id];
  if (!deck.playing) return deck.offset;
  return getCtx().currentTime - deck.startedAt;
}

function setPosition(id, sec) {
  const el = document.getElementById('pos' + id.toUpperCase());
  if (el) el.textContent = 'POSITION ' + fmt(sec);
}

// Meters
let meterRaf = null;
function startMeterLoop() {
  if (meterRaf) return;
  const mL = document.getElementById('meterL');
  const mR = document.getElementById('meterR');
  function tick() {
    // Use position progress as a proxy for meter activity (no analyser for simplicity)
    const aPlaying = decks.a.playing;
    const bPlaying = decks.b.playing;
    const aOff = aPlaying ? currentOffset('a') : decks.a.offset;
    const bOff = bPlaying ? currentOffset('b') : decks.b.offset;
    const aDur = decks.a.buffer ? decks.a.buffer.duration : 1;
    const bDur = decks.b.buffer ? decks.b.buffer.duration : 1;

    if (aPlaying) setPosition('a', aOff);
    if (bPlaying) setPosition('b', bOff);

    // fake VU: random flicker when playing
    const lVal = aPlaying ? 30 + Math.random() * 60 : 0;
    const rVal = bPlaying ? 30 + Math.random() * 60 : 0;
    if (mL) mL.style.width = lVal + '%';
    if (mR) mR.style.width = rVal + '%';

    meterRaf = requestAnimationFrame(tick);
  }
  meterRaf = requestAnimationFrame(tick);
}

// ── CLOCK ─────────────────────────────────────────────────────────────────────

function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }
  tick();
  setInterval(tick, 1000);
}

// ── ACTIVE DECK TRACKING ─────────────────────────────────────────────────────

let activeDeck = 'a'; // which deck the transport controls target

function setActiveDeck(id) {
  activeDeck = id;
  document.querySelectorAll('.deck').forEach(d => d.classList.remove('deck-active'));
  const el = document.querySelector(`.deck[data-deck="${id}"]`);
  if (el) el.classList.add('deck-active');
  updatePlayButton();
}

function updatePlayButton() {
  const btn = document.querySelector('[data-action="play"]');
  if (!btn) return;
  const playing = decks[activeDeck].playing;
  btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  btn.textContent = playing ? '⏸ PAUSE' : '▶ PLAY';
}

// ── PLATTER ───────────────────────────────────────────────────────────────────

function setPlatterSpin(id, on) {
  const el = document.querySelector(`.deck[data-deck="${id}"] .platter`);
  if (!el) return;
  if (on) el.classList.add('spinning');
  else el.classList.remove('spinning');
}

// ── FILE LOADING ──────────────────────────────────────────────────────────────

function handleFileLoad(id, file) {
  const notice = document.getElementById('notice');
  if (notice) notice.textContent = 'LOADING ' + file.name.toUpperCase() + '…';
  stopDeck(id, false);

  loadBuffer(file, (err, buf) => {
    if (err) {
      if (notice) notice.textContent = 'DECODE ERROR — try another file';
      return;
    }
    decks[id].buffer = buf;
    decks[id].offset = 0;
    decks[id].name = file.name.replace(/\.[^.]+$/, '').toUpperCase();

    const trackEl = document.getElementById('track' + id.toUpperCase());
    if (trackEl) trackEl.textContent = decks[id].name;
    setPosition(id, 0);

    const dur = document.getElementById('dur' + id.toUpperCase());
    if (dur) dur.textContent = 'DURATION ' + fmt(buf.duration);

    if (notice) notice.textContent = 'LOADED · ' + decks[id].name;
    setActiveDeck(id);
    updatePlayButton();
  });
}

// ── PANEL NAV ─────────────────────────────────────────────────────────────────

function switchPanel(name) {
  document.querySelector('.workspace')?.classList.toggle('recon-mode', name === 'recon');
  document.querySelectorAll('.panel').forEach(p => {
    const active = p.id === 'panel-' + name;
    p.classList.toggle('active', active);
    p.hidden = !active;
    p.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  document.querySelectorAll('.dock-app').forEach(b => {
    const active = b.dataset.panel === name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
    b.setAttribute('aria-current', active ? 'page' : 'false');
  });
  if (name === 'deck') {
    const h = document.getElementById('deck-title');
    if (h) h.focus();
  }
  if (name === 'radar') {
    const h = document.getElementById('radar-title');
    if (h) h.focus();
  }
  // ── RECON (IMPLEMENTED local review shell; external actions PLANNED)
  if (name === 'recon') {
    window.PIXIERecon?.init();
  }
}

// ── CRATE ─────────────────────────────────────────────────────────────────────

const DEMO_TRACKS = [
  { title: 'NIGHT BUS',       meta: '124 BPM · Am' },
  { title: 'SIGNAL LOSS',     meta: '118 BPM · Dm' },
  { title: 'SUNSHINE CIRCUIT',meta: '128 BPM · F#m' },
  { title: 'AFTER HOURS',     meta: '130 BPM · Gm' },
  { title: 'LAST TRAIN HOME', meta: '126 BPM · Cm' },
];

let selectedCrateIdx = null;

function buildCrate() {
  const list = document.getElementById('crateList');
  if (!list) return;
  list.innerHTML = '';
  DEMO_TRACKS.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'crate-item';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.innerHTML = `<span class="crate-num">0${i+1}</span>
      <span class="crate-title">${t.title}</span>
      <span class="crate-meta">${t.meta} · DEMO</span>`;
    row.addEventListener('click', () => {
      selectedCrateIdx = i;
      list.querySelectorAll('.crate-item').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      document.getElementById('notice').textContent = 'SELECTED · ' + t.title + ' (demo — load a real file to play)';
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') row.click(); });
    list.appendChild(row);
  });
}

// ── CAPABILITY GRID ───────────────────────────────────────────────────────────

const CAPABILITIES = [
  { label: 'MICROPHONE',        status: 'blocked' },
  { label: 'CAMERA',            status: 'blocked' },
  { label: 'PHOTOS LIBRARY',    status: 'blocked' },
  { label: 'FILES / STORAGE',   status: 'ready'   },
  { label: 'MIDI / HID',        status: 'blocked' },
  { label: 'BLUETOOTH',         status: 'blocked' },
  { label: 'AIRPLAY',           status: 'blocked' },
  { label: 'NOTIFICATIONS',     status: 'blocked' },
  { label: 'SIRI / APP INTENTS',status: 'blocked' },
  { label: 'SIGN IN W/ APPLE',  status: 'blocked' },
  { label: 'APPLE MUSIC',       status: 'blocked' },
  { label: 'AT PROTOCOL',       status: 'planned' },
  { label: 'PLYR.FM',           status: 'planned' },
  { label: 'MIXXX BRIDGE',      status: 'planned' },
  { label: 'WEB AUDIO API',     status: 'ready'   },
  { label: 'LOCAL FILE PLAY',   status: 'ready'   },
];

function buildCapabilities() {
  const grid = document.getElementById('capabilityGrid');
  if (!grid) return;
  grid.innerHTML = '';
  CAPABILITIES.forEach(c => {
    const div = document.createElement('div');
    div.className = 'cap-item';
    div.innerHTML = `<span class="cap-label">${c.label}</span>
      <span class="cap-status ${c.status}">${c.status.toUpperCase()}</span>`;
    grid.appendChild(div);
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  startMeterLoop();
  buildCrate();
  buildCapabilities();

  // ── DOCK NAV
  document.querySelectorAll('.dock-app').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  document.querySelectorAll('.close-panel').forEach(btn => {
    btn.addEventListener('click', () => switchPanel('radar'));
  });

  // ── FILE INPUTS (hidden, triggered by LOAD buttons)
  ['a','b'].forEach(id => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.style.display = 'none';
    input.id = 'fileInput' + id.toUpperCase();
    document.body.appendChild(input);
    input.addEventListener('change', e => {
      if (e.target.files[0]) handleFileLoad(id, e.target.files[0]);
    });
  });

  // ── DECK CLICK = set active deck
  document.querySelectorAll('.deck').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.deck;
      if (id) setActiveDeck(id);
    });
  });

  // ── LOAD BUTTONS
  document.querySelector('[data-action="load-a"]')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('fileInputA').click();
  });
  document.querySelector('[data-action="load-b"]')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('fileInputB').click();
  });

  // ── TRANSPORT
  document.querySelector('[data-action="play"]')?.addEventListener('click', () => {
    const deck = decks[activeDeck];
    if (!deck.buffer) {
      document.getElementById('notice').textContent = 'NO TRACK LOADED ON DECK ' + activeDeck.toUpperCase() + ' — tap LOAD FILE';
      return;
    }
    if (deck.playing) {
      stopDeck(activeDeck, true); // pause
    } else {
      const eqVal = parseInt(document.getElementById('eq')?.value ?? 55);
      playDeck(activeDeck, eqVal);
    }
    updatePlayButton();
  });

  document.querySelector('[data-action="cue"]')?.addEventListener('click', () => {
    cueDeck(activeDeck);
    updatePlayButton();
  });

  document.querySelector('[data-action="sync"]')?.addEventListener('click', () => {
    // Sync: align offsets so both decks are at same relative position
    const notice = document.getElementById('notice');
    if (!decks.a.buffer || !decks.b.buffer) {
      if (notice) notice.textContent = 'SYNC — both decks need a track loaded';
      return;
    }
    // Simple sync: set B offset to match A's proportional position
    const aProgress = decks.a.buffer ? currentOffset('a') / decks.a.buffer.duration : 0;
    decks.b.offset = aProgress * (decks.b.buffer?.duration ?? 0);
    if (decks.b.playing) {
      const eqVal = parseInt(document.getElementById('eq')?.value ?? 55);
      playDeck('b', eqVal);
    }
    if (notice) notice.textContent = 'SYNCED · DECK B ALIGNED TO DECK A';
  });

  // ── MIXER CONTROLS
  document.getElementById('eq')?.addEventListener('input', e => {
    const val = parseInt(e.target.value);
    document.getElementById('eqValue').textContent = val + '%';
    e.target.setAttribute('aria-valuetext', val + ' percent');
    ['a','b'].forEach(id => {
      const eq = decks[id].eq;
      if (eq) setEQ(eq.low, eq.mid, eq.high, val);
    });
  });

  document.getElementById('fader')?.addEventListener('input', e => {
    const val = parseInt(e.target.value);
    document.getElementById('faderValue').textContent = val + '%';
    e.target.setAttribute('aria-valuetext', val + ' percent');
    applyCrossfader(val);
  });

  document.getElementById('master')?.addEventListener('input', e => {
    const val = parseInt(e.target.value);
    document.getElementById('masterValue').textContent = val + '%';
    e.target.setAttribute('aria-valuetext', val + ' percent');
    if (masterGain) masterGain.gain.value = val / 100;
  });

  // ── KEYBOARD SHORTCUTS
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      document.querySelector('[data-action="play"]')?.click();
    }
    if (e.code === 'Escape') switchPanel('deck');
    if (e.code === 'KeyA') setActiveDeck('a');
    if (e.code === 'KeyB') setActiveDeck('b');
  });

  // initial state
  updatePlayButton();
  setActiveDeck('a');
});
