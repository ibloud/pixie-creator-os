const crate = [
  { title: 'NIGHT BUS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 124, key: 'Am' },
  { title: 'SIGNAL LOSS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 118, key: 'Dm' },
  { title: 'SUNSHINE CIRCUIT', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 128, key: 'F#m' },
  { title: 'AFTER HOURS', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 130, key: 'Gm' },
  { title: 'LAST TRAIN HOME', artist: 'CHARLIE / FICTIONAL PROJECT', bpm: 126, key: 'Cm' }
];

const SELECTORS = {
  dockApps: '.dock-app',
  panels: '.panel',
  actions: '[data-action]',
  closeButtons: '.close-panel',
  platters: '.platter',
  crateRows: '.crate-row'
};

let isPlaying = false;
let noticeTimer;

const query = (selector) => document.querySelector(selector);
const queryAll = (selector) => document.querySelectorAll(selector);

function showNotice(message) {
  const notice = query('#notice');
  if (!notice) return;

  notice.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.textContent = 'LOCAL MODE · SAFE TO EXPLORE';
  }, 2600);
}

function openPanel(panelName) {
  queryAll(SELECTORS.dockApps).forEach((button) => {
    const isActive = button.dataset.panel === panelName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  queryAll(SELECTORS.panels).forEach((panel) => {
    panel.classList.toggle('active', panel.id === `panel-${panelName}`);
  });
}

function loadTrack(trackIndex, deck) {
  const track = crate[trackIndex];
  const trackLabel = query(`#track${deck}`);

  if (!track || !trackLabel) return;

  trackLabel.textContent = `${track.title} · ${track.artist}`;
  showNotice(`DECK ${deck} · ${track.title} selected from local crate`);
}

function renderCrate() {
  const crateList = query('#crateList');
  if (!crateList) return;

  crateList.innerHTML = crate
    .map(
      (track, index) => `
        <button class="crate-row" type="button" data-index="${index}">
          <b>${String(index + 1).padStart(2, '0')}</b>
          <span>
            <strong>${track.title}</strong>
            <small>${track.artist} · ${track.bpm} BPM · ${track.key}</small>
          </span>
          <span aria-label="${track.bpm} BPM">${track.bpm}</span>
        </button>
      `
    )
    .join('');

  queryAll(SELECTORS.crateRows).forEach((row) => {
    row.addEventListener('click', () => {
      loadTrack(Number(row.dataset.index), 'A');
    });
  });
}

function togglePlayback() {
  isPlaying = !isPlaying;

  queryAll(SELECTORS.platters).forEach((platter) => {
    platter.style.animationPlayState = isPlaying ? 'running' : 'paused';
  });

  const playButton = query('[data-action="play"]');
  if (playButton) {
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.textContent = isPlaying ? '■ STOP' : '▶ PLAY';
  }

  showNotice(
    isPlaying
      ? 'LOCAL VISUAL PLAYBACK · NO AUDIO'
      : 'LOCAL VISUAL PLAYBACK STOPPED'
  );
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
      togglePlayback();
      break;
    case 'cue':
      showNotice('CUE · visual prototype only; no audio engine');
      break;
    case 'sync':
      showNotice('SYNC · visual prototype only; no external engine connected');
      break;
    default:
      break;
  }
}

queryAll(SELECTORS.dockApps).forEach((button) => {
  button.addEventListener('click', () => openPanel(button.dataset.panel));
});

queryAll(SELECTORS.actions).forEach((button) => {
  button.addEventListener('click', () => handleAction(button.dataset.action));
});

queryAll(SELECTORS.closeButtons).forEach((button) => {
  button.addEventListener('click', () => openPanel('deck'));
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isTextInput =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;

  if (event.code === 'Space' && !isTextInput) {
    event.preventDefault();
    togglePlayback();
  }

  if (event.key === 'Escape') {
    openPanel('deck');
  }
});

setInterval(() => {
  const clock = query('#clock');
  if (clock) {
    clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
  }
}, 1000);

setInterval(() => {
  const meterLeft = query('#meterL');
  const meterRight = query('#meterR');

  if (meterLeft) meterLeft.style.width = `${25 + Math.random() * 65}%`;
  if (meterRight) meterRight.style.width = `${25 + Math.random() * 65}%`;
}, 180);

renderCrate();
