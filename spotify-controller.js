/* PIXIE Creator OS — Spotify iFrame API controller
   Uses Spotify's public embed API. No user credentials or tokens are stored. */
(() => {
  'use strict';
  const DEMO_URI = 'spotify:episode:7makk4oTQel546B0PZlDM5';
  let iframeApi = null;
  let controller = null;
  let pendingEntity = null;

  const nodes = () => ({
    mount: document.getElementById('spotifyEmbed'),
    url: document.getElementById('spotifyUrl'),
    load: document.getElementById('spotifyLoad'),
    toggle: document.getElementById('spotifyToggle'),
    restart: document.getElementById('spotifyRestart'),
    demo: document.getElementById('spotifyDemo'),
    state: document.getElementById('spotifyApiState'),
    playback: document.getElementById('spotifyPlayback')
  });

  function setState(message, kind = '') {
    const n = nodes();
    if (n.state) {
      n.state.textContent = message;
      n.state.className = 'stream-state' + (kind ? ' ' + kind : '');
    }
  }

  function setPlayback(message) {
    const output = nodes().playback;
    if (output) output.textContent = message;
  }

  function validEntity(value) {
    return /^spotify:(track|album|playlist|episode|show|artist):[A-Za-z0-9]+$/i.test(value)
      || /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/[A-Za-z0-9]+/i.test(value);
  }

  function connectController(entity) {
    const n = nodes();
    if (!iframeApi || !n.mount) {
      pendingEntity = entity;
      setState('API LOADING');
      return;
    }
    if (controller) {
      controller.loadEntity(entity);
      setPlayback('STREAM LOADED · PRESS PLAY');
      return;
    }
    n.mount.innerHTML = '';
    iframeApi.createController(n.mount, {
      uri: entity,
      width: '100%',
      height: 152
    }, embedController => {
      controller = embedController;
      n.toggle.disabled = false;
      n.restart.disabled = false;
      setState('CONNECTED', 'ready');
      setPlayback('STREAM READY · PRESS PLAY');
      controller.addListener('ready', () => setState('CONNECTED', 'ready'));
      controller.addListener('playback_started', event => {
        setPlayback('PLAYING · ' + (event?.data?.playingURI || 'SPOTIFY STREAM'));
      });
      controller.addListener('playback_update', event => {
        const data = event?.data;
        if (!data) return;
        const seconds = Math.floor((data.position || 0) / 1000);
        const total = Math.floor((data.duration || 0) / 1000);
        setPlayback((data.isPaused ? 'PAUSED' : data.isBuffering ? 'BUFFERING' : 'PLAYING') + ' · ' + seconds + ' / ' + total + ' SEC');
      });
    });
  }

  function loadFromInput() {
    const value = nodes().url?.value.trim();
    if (!value || !validEntity(value)) {
      setState('CHECK URL', 'error');
      setPlayback('ENTER A PUBLIC SPOTIFY URL OR URI');
      nodes().url?.focus();
      return;
    }
    connectController(value);
  }

  window.onSpotifyIframeApiReady = api => {
    iframeApi = api;
    setState('API READY', 'ready');
    if (pendingEntity) {
      const entity = pendingEntity;
      pendingEntity = null;
      connectController(entity);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const n = nodes();
    n.load?.addEventListener('click', loadFromInput);
    n.url?.addEventListener('keydown', event => {
      if (event.key === 'Enter') loadFromInput();
    });
    n.toggle?.addEventListener('click', () => controller?.togglePlay());
    n.restart?.addEventListener('click', () => controller?.restart());
    n.demo?.addEventListener('click', () => {
      if (n.url) n.url.value = DEMO_URI;
      connectController(DEMO_URI);
    });
  });
})();
