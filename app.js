const tracks = [
  { title: 'NIGHT BUS', artist: 'PIXIE / LOCAL PROJECT', bpm: 124, key: 'Am' },
  { title: 'SIGNAL LOSS', artist: 'PIXIE / LOCAL PROJECT', bpm: 118, key: 'Dm' },
  { title: 'SUNSHINE CIRCUIT', artist: 'PIXIE / LOCAL PROJECT', bpm: 128, key: 'F#m' },
  { title: 'AFTER HOURS', artist: 'PIXIE / LOCAL PROJECT', bpm: 130, key: 'Gm' },
  { title: 'LAST TRAIN HOME', artist: 'PIXIE / LOCAL PROJECT', bpm: 126, key: 'Cm' }
];

const state = { playing: false, activeDeck: 'A', eq: 55, fader: 50, master: 78 };
const SELECTORS = { dockApps: '.dock-app', panels: '.panel', actions: '[data-action]', closeButtons: '.close-panel', platters: '.platter', crateRows: '.crate-row', controls: '.mixer input' };
let noticeTimer;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showNotice(message) {
  const notice = $('#notice');
  if (!notice) return;
  notice.textContent = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.textContent = 'LOCAL MODE · SAFE TO EXPLORE'; }, 2600);
}

function openPanel(panelName, moveFocus = true) {
  $$(SELECTORS.dockApps).forEach((button) => {
    const active = button.dataset.panel === panelName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  $$(SELECTORS.panels).forEach((panel) => {
    const active = panel.id === `panel-${panelName}`;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
    panel.setAttribute('aria-hidden', String(!active));
  });
  if (moveFocus) {
    const heading = $(`#panel-${panelName} h2`);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
}

function loadTrack(index, deck) {
  const track = tracks[index];
  const label = $(`#track${deck}`);
  if (!track || !label) return;
  state.activeDeck = deck;
  label.textContent = `${track.title} · ${track.artist}`;
  showNotice(`DECK ${deck} · ${track.title} selected from local crate`);
}

function renderCrate() {
  const crateList = $('#crateList');
  if (!crateList) return;
  crateList.innerHTML = tracks.map((track, index) => `
    <button class="crate-row" type="button" data-index="${index}" aria-label="Select ${track.title}, ${track.bpm} BPM, ${track.key}">
      <b aria-hidden="true">${String(index + 1).padStart(2, '0')}</b><span><strong>${track.title}</strong><small>${track.artist} · ${track.bpm} BPM · ${track.key}</small></span><span aria-hidden="true">${track.bpm}</span>
    </button>`).join('');
  $$(SELECTORS.crateRows, crateList).forEach((row) => row.addEventListener('click', () => loadTrack(Number(row.dataset.index), state.activeDeck)));
}

function setPlayback(playing) {
  state.playing = playing;
  $$(SELECTORS.platters).forEach((platter) => { platter.style.animationPlayState = playing ? 'running' : 'paused'; });
  const playButton = $('[data-action="play"]');
  if (playButton) {
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.textContent = playing ? '■ STOP' : '▶ PLAY';
  }
  showNotice(playing ? 'LOCAL VISUAL PLAYBACK · NO AUDIO' : 'LOCAL VISUAL PLAYBACK STOPPED');
}

function handleAction(action) {
  if (action === 'load-a') return loadTrack(0, 'A');
  if (action === 'load-b') return loadTrack(1, 'B');
  if (action === 'play') return setPlayback(!state.playing);
  if (action === 'cue') return showNotice('CUE · visual prototype only; no audio engine');
  if (action === 'sync') return showNotice('SYNC · visual prototype only; no external engine connected');
  showNotice(`ACTION · ${action} is not implemented`);
}

function updateMixer(control) {
  const value = Number(control.value);
  if (!Number.isFinite(value)) return;
  const name = control.id;
  state[name] = value;
  control.setAttribute('aria-valuetext', `${value} percent`);
  const output = $(`#${name}Value`);
  if (output) output.textContent = `${value}%`;
  showNotice(`LOCAL MIXER · ${name.toUpperCase()} · ${value}%`);
}

function requestNative(capability, action, payload = {}) {
  const result = window.PIXIE_NATIVE?.request(capability, action, payload);
  if (!result?.ok) showNotice(`${capability.toUpperCase()} · NOT CONFIGURED`);
  return result;
}

function renderNativeCapabilities() {
  const grid = $('#capabilityGrid');
  if (!grid) return;
  const capabilities = [
    'Apple Music', 'System media / Lock Screen', 'Background audio', 'Microphone', 'Camera', 'Photos', 'Files',
    'Share Sheet', 'Haptics', 'Notifications', 'Bluetooth / external audio', 'AirPlay', 'Siri / App Intents', 'Sign in with Apple'
  ];
  grid.innerHTML = capabilities.map((capability) => `
    <button class="capability" type="button" data-native-capability="${capability}" aria-label="${capability}: not configured">
      <strong>${capability}</strong><span>NOT CONFIGURED</span>
    </button>`).join('');
  $$('.capability', grid).forEach((button) => button.addEventListener('click', () => requestNative(button.dataset.nativeCapability, 'request')));
}

function bindEvents() {
  $$(SELECTORS.dockApps).forEach((button) => button.addEventListener('click', () => openPanel(button.dataset.panel)));
  $$(SELECTORS.actions).forEach((button) => button.addEventListener('click', () => handleAction(button.dataset.action)));
  $$(SELECTORS.closeButtons).forEach((button) => button.addEventListener('click', () => openPanel('deck')));
  $$(SELECTORS.controls).forEach((control) => {
    control.addEventListener('input', () => updateMixer(control));
    control.addEventListener('change', () => updateMixer(control));
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTextInput = (target instanceof HTMLInputElement && target.type !== 'range') || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if (event.code === 'Space' && !isTextInput) { event.preventDefault(); setPlayback(!state.playing); }
    if (event.key === 'Escape') openPanel('deck');
  });
}

function updateClock() { const clock = $('#clock'); if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour12: false }); }
function updateMeters() {
  if (!state.playing) return;
  const master = state.master / 100;
  const meterLeft = $('#meterL'); const meterRight = $('#meterR');
  if (meterLeft) meterLeft.style.width = `${25 + Math.random() * 65 * master}%`;
  if (meterRight) meterRight.style.width = `${25 + Math.random() * 65 * master}%`;
}

bindEvents();
renderCrate();
renderNativeCapabilities();
updateClock();
window.setInterval(updateClock, 1000);
window.setInterval(updateMeters, 180);
