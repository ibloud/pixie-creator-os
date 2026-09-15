const tracks = [
  { title: 'NIGHT BUS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 124, key: 'Am' },
  { title: 'SIGNAL LOSS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 118, key: 'Dm' },
  { title: 'SUNSHINE CIRCUIT', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 128, key: 'F#m' },
  { title: 'AFTER HOURS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 130, key: 'Gm' },
  { title: 'LAST TRAIN HOME', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 126, key: 'Cm' }
];

const state = {
  playing: false,
  activeDeck: 'A',
  eq: 55,
  fader: 50,
  master: 78
};

const SELECTORS = {
  dockApps: '.dock-app',
  panels: '.panel',
  actions: '[data-action]',
  closeButtons: '.close-panel',
  platters: '.platter',
  crateRows: '.crate-row',
  controls: '.mixer input'
};

let noticeTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showNotice(message) {
  const notice = $('#notice');
  if (!notice) return;

  notice.textContent = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.textContent = 'LOCAL MODE · SAFE TO EXPLORE';
  }, 2600);
}

function openPanel(panelName) {
  $$(SELECTORS.dockApps).forEach((button) => {
    const active = button.dataset.panel === panelName;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  $$(SELECTORS.panels).forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${panelName}`);
  });
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
    <button class="crate-row" type="button" data-index="${index}">
      <b>${String(index + 1).padStart(2, '0')}</b>
      <span>
        <strong>${track.title}</strong>
        <small>${track.artist} · ${track.bpm} BPM · ${track.key}</small>
      </span>
      <span aria-label="${track.bpm} BPM">${track.bpm}</span>
    </button>
  `).join('');

  $$(SELECTORS.crateRows, crateList).forEach((row) => {
    row.addEventListener('click', () => loadTrack(Number(row.dataset.index), state.activeDeck));
  });
}

function setPlayback(playing) {
  state.playing = playing;

  $$(SELECTORS.platters).forEach((platter) => {
    platter.style.animationPlayState = playing ? 'running' : 'paused';
  });

  const playButton = $('[data-action="play"]');
  if (playButton) {
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.textContent = playing ? '■ STOP' : '▶ PLAY';
  }

  showNotice(playing ? 'LOCAL VISUAL PLAYBACK · NO AUDIO' : 'LOCAL VISUAL PLAYBACK STOPPED');
}

function handleAction(action) {
  switch (action) {
    case 'load-a':
      loadTrack(0, 'A');
      break;
    case 'load-b':
      loadTrack(1, 'B');
      break;
    case 'play':
      setPlayback(!state.playing);
      break;
    case 'cue':
      showNotice('CUE · visual prototype only; no audio engine');
      break;
    case 'sync':
      showNotice('SYNC · visual prototype only; no external engine connected');
      break;
    default:
      showNotice(`ACTION · ${action} is not implemented`);
  }
}

function updateMixer(control) {
  const value = Number(control.value);
  const name = control.id;

  if (!Number.isFinite(value)) return;

  state[name] = value;
  control.setAttribute('aria-valuetext', `${value}%`);

  const messages = {
    eq: `EQ · ${value}%`,
    fader: `FADER · ${value}%`,
    master: `MASTER · ${value}%`
  };

  showNotice(`LOCAL MIXER · ${messages[name] || `${name.toUpperCase()} · ${value}%`}`);
}

function bindEvents() {
  $$(SELECTORS.dockApps).forEach((button) => {
    button.addEventListener('click', () => openPanel(button.dataset.panel));
  });

  $$(SELECTORS.actions).forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action));
  });

  $$(SELECTORS.closeButtons).forEach((button) => {
    button.addEventListener('click', () => openPanel('deck'));
  });

  $$(SELECTORS.controls).forEach((control) => {
    control.addEventListener('input', () => updateMixer(control));
    control.addEventListener('change', () => updateMixer(control));
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTextInput = target instanceof HTMLInputElement && target.type !== 'range'
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement;

    if (event.code === 'Space' && !isTextInput) {
      event.preventDefault();
      setPlayback(!state.playing);
    }

    if (event.key === 'Escape') {
      openPanel('deck');
    }
  });
}

function updateClock() {
  const clock = $('#clock');
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
  }
}

function updateMeters() {
  if (!state.playing) return;

  const meterLeft = $('#meterL');
  const meterRight = $('#meterR');
  const master = state.master / 100;

  if (meterLeft) meterLeft.style.width = `${25 + Math.random() * 65 * master}%`;
  if (meterRight) meterRight.style.width = `${25 + Math.random() * 65 * master}%`;
}

bindEvents();
renderCrate();
updateClock();
window.setInterval(updateClock, 1000);
window.setInterval(updateMeters, 180);
