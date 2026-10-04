(() => {
  'use strict';
  const M = window.PixieSession, $ = id => document.getElementById(id);
  const makeId = () => globalThis.crypto?.randomUUID?.() || 'session-' + Date.now().toString(36) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  let s = M.create(makeId()), audioURL = null, generation = 0;
  const tell = message => { $('status').textContent = message; };
  function render() {
    const paused = s.status === 'paused';
    for (const id of ['title', 'note', 'keep-note', 'review', 'pause', 'audio-file', 'import-session']) $(id).disabled = paused;
    $('resume').disabled = !paused;
    $('confirm').disabled = s.status !== 'reviewed';
    $('download').disabled = s.status !== 'confirmed';
    if (s.status !== 'confirmed') $('preview').value = '';
  }
  function clearAudio() {
    $('audio').pause(); $('audio').removeAttribute('src'); $('audio').load();
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL = null; $('audio-file').value = ''; $('audio-status').textContent = 'Audio cleared. No file was modified.';
  }
  $('audio-file').addEventListener('change', () => {
    const file = $('audio-file').files[0]; if (!file) return;
    clearAudio(); audioURL = URL.createObjectURL(file); $('audio').src = audioURL;
    $('audio-status').textContent = 'Selected audio stays local. Use the player controls to listen.';
  });
  $('audio').addEventListener('play', () => { if (s.status === 'paused') $('audio').pause(); });
  $('audio').addEventListener('error', () => { $('audio-status').textContent = 'This audio could not be played. Choose a supported file or skip.'; });
  $('skip-audio').addEventListener('click', clearAudio);
  for (const id of ['title', 'note', 'keep-note']) $(id).addEventListener('input', () => {
    generation++; s = M.edit(s, { title: $('title').value, note: $('note').value, keepNote: $('keep-note').checked });
    render(); tell('Choices changed. Review and confirm again.');
  });
  $('session-form').addEventListener('submit', e => {
    e.preventDefault(); s = M.review(s); render();
    const preview = M.record(M.confirm(s)); $('preview').value = JSON.stringify(preview, null, 2);
    tell('Review the exact record. Nothing has been saved.'); $('preview').focus();
  });
  $('confirm').addEventListener('click', () => { s = M.confirm(s); render(); $('preview').value = JSON.stringify(M.record(s), null, 2); tell('Confirmed locally. Choose download or copy the preview to keep it.'); });
  $('pause').addEventListener('click', () => { generation++; $('audio').pause(); s = M.pause(s); render(); tell('Paused. Choices remain in this tab; confirmation cleared.'); $('resume').focus(); });
  $('resume').addEventListener('click', () => { s = M.resume(s); render(); tell('Resumed. Audio does not restart automatically.'); $('title').focus(); });
  $('clear').addEventListener('click', () => { generation++; clearAudio(); s = M.create(makeId()); $('session-form').reset(); $('import-session').value = ''; render(); tell('Stopped and cleared from this tab. Existing downloads remain under your control.'); $('title').focus(); });
  $('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(M.record(s), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = s.pixie_id + '.json'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000); tell('Download requested. Verify it in Files. No upload occurred.');
  });
  $('import-session').addEventListener('change', async () => {
    const file = $('import-session').files[0]; if (!file) return;
    const token = ++generation;
    try {
      if (file.size > 20000) throw new Error('Session file is too large');
      const next = M.validate(JSON.parse(await file.text()));
      if (token !== generation) return;
      clearAudio(); s = next; $('title').value = s.title; $('note').value = s.note; $('keep-note').checked = s.keepNote;
      render(); tell('Session restored as a draft. Select audio separately; review before export.');
    } catch (err) { tell('Import rejected: ' + err.message + '. Current choices retained.'); }
    $('import-session').value = '';
  });
  window.addEventListener('pagehide', clearAudio);
  render();
})();
