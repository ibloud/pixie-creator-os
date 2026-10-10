(() => {
  'use strict';
  const M = window.PixieCreator, $ = id => document.getElementById(id);
  const makeId = () => crypto.randomUUID?.() || 'work-' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  let state = M.create(makeId()), media = null, mediaURL = null, pendingImport = 0, pendingRestore = null, downloadedPrint = null, importedPrint = null;
  const fields = { 'work-title': 'title', 'work-link': 'link', caption: 'caption', credits: 'credits', description: 'description' };
  const tell = message => { $('workspace-status').textContent = message; };
  function closeImportConfirm() {
    pendingRestore = null;
    $('import-confirm').hidden = true;
  }
  function isBlank() {
    return !media && M.fingerprint(state) === M.fingerprint(M.create(state.pixie_id));
  }
  function commitImport(restored) {
    clearMedia(); state = restored; importedPrint = M.fingerprint(restored); downloadedPrint = null; syncFields(); render(); navigate('prepare'); tell('Draft restored. Select media separately and review again.');
  }
  const run = fn => { try { fn(); } catch (e) { tell(e.message + '.'); $('workspace-status').focus(); } };
  function navigate(view) {
    if (!['work', 'prepare', 'share', 'connections'].includes(view)) view = 'work';
    for (const name of ['work', 'prepare', 'share', 'connections']) $('view-' + name).hidden = name !== view;
    document.querySelectorAll('[data-view]').forEach(b => {
      if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    history.replaceState(null, '', '#' + view);
    $(view === 'work' ? 'work-heading' : view + '-heading').focus();
  }
  function render() {
    $('active-heading').textContent = state.title.trim() || 'Untitled work';
    const reviewed = state.reviewedRevision === state.revision;
    const confirmed = state.confirmedRevision === state.revision;
    $('review-block').hidden = !reviewed;
    $('handoff-block').hidden = !confirmed;
    $('confirm').disabled = confirmed;
    $('public-preview').value = reviewed ? M.sharingText(state) : '';
    $('accessibility-preview').value = reviewed ? M.accessibilityText(state) : '';
    $('copy-description').disabled = !state.description.trim();
    $('description-count').textContent = state.description.length + ' / 2000 text units. Keep it as short as the work needs; check the destination’s limit.';
    $('caption-suggestion').textContent = M.captionSuggestion(state, $('caption-style').value);
    $('publication-link').value = '';
    const repurpose = state.destination === 'repurpose';
    $('destination-help').textContent = repurpose ? 'Upload media to your chosen supported source, such as Dropbox. Then choose its workflow in Repurpose. PIXIE is not connected to that account.' : 'Finish in Bluesky: paste your text, attach your media, set accessibility descriptions, and review before posting. PIXIE is not signed in.';
    $('destination-check').textContent = repurpose ? 'For a Bluesky destination, Repurpose supports video, not text or image posts. Audio needs a supported destination or a video you make in another tool. A work link or PIXIE JSON is not a media source.' : 'Check the destination’s post and media limits. This workspace does not trim, split, transcode, or upload your work.';
    $('handoff-instructions').textContent = repurpose ? 'Keep the media file, upload it to a supported source, and set up or run the workflow in Repurpose. Sharing text is a separate reference; it is not imported automatically.' : 'Copy or download this text. Open Bluesky, attach the original media from Files, then review and publish there. You can shorten the text in Bluesky as needed.';
    $('open-destination').href = repurpose ? 'https://repurpose.io/' : 'https://bsky.app/';
    $('open-destination').textContent = repurpose ? 'Open Repurpose ↗' : 'Open Bluesky ↗';
    $('text-count').textContent = M.sharingText(state).length + ' text units. Review length in the destination composer; its limits and counting may differ.';
    $('download-media').hidden = !media;
    const list = $('receipt-list'); list.replaceChildren();
    if (!state.receipts.length) { const li = document.createElement('li'); li.textContent = 'No publication links recorded.'; list.append(li); }
    state.receipts.forEach(r => {
      const li = document.createElement('li'), link = document.createElement('a');
      link.href = r.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = r.title + ' · ' + (r.destination === 'bluesky' ? 'Bluesky' : 'Repurpose workflow');
      li.append(link, document.createTextNode(' — recorded by you; not verified. ' + new Date(r.recorded_at).toLocaleString())); list.append(li);
    });
  }
  function syncFields() {
    for (const [id, key] of Object.entries(fields)) $(id).value = state[key];
    $('rights').checked = state.rights; $('destination').value = state.destination;
  }
  function clearMedia() {
    const player = $('media-preview').querySelector('audio,video'); if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    mediaURL = null; media = null; $('media-file').value = ''; $('media-preview').replaceChildren();
    const p = document.createElement('p'); p.className = 'empty-preview'; p.textContent = 'Your media preview appears here.'; $('media-preview').append(p);
    $('media-status').textContent = 'No media selected.'; $('remove-media').hidden = true;
  }
  function invalidate(message) {
    closeImportConfirm(); pendingImport++; state = { ...state, revision: state.revision + 1, reviewedRevision: null, confirmedRevision: null }; render(); tell(message);
  }
  document.querySelectorAll('[data-view],[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.view || b.dataset.go)));
  for (const [id, key] of Object.entries(fields)) $(id).addEventListener('input', () => {
    closeImportConfirm(); pendingImport++;
    // Keep editing possible while a link is incomplete; validate it at review/export.
    state = { ...state, [key]: $(id).value, revision: state.revision + 1, reviewedRevision: null, confirmedRevision: null };
    render(); tell('Draft changed. Review again before sharing.');
  });
  $('rights').addEventListener('change', () => { state.rights = $('rights').checked; invalidate('Permission choice changed. Review again.'); });
  $('caption-style').addEventListener('change', render);
  $('use-caption').addEventListener('click', () => {
    state.caption = M.captionSuggestion(state, $('caption-style').value); $('caption').value = state.caption;
    invalidate('Caption template applied. Edit its placeholders and review again.');
  });
  $('destination').addEventListener('change', () => run(() => { state.destination = $('destination').value; invalidate('Destination changed. Review again.'); }));
  $('media-file').addEventListener('change', () => {
    const file = $('media-file').files[0]; if (!file) return;
    const kind = file.type.split('/')[0];
    if (!['audio', 'video', 'image'].includes(kind)) { $('media-file').value = ''; tell('Choose a supported audio, video, or image file. Current work retained.'); return; }
    closeImportConfirm(); clearMedia(); media = file; mediaURL = URL.createObjectURL(file);
    const el = document.createElement(kind === 'image' ? 'img' : kind); el.src = mediaURL;
    if (kind === 'image') el.alt = state.description || 'Selected work preview'; else { el.controls = true; el.preload = 'metadata'; el.setAttribute('aria-label', 'Selected local ' + kind); }
    el.addEventListener('error', () => tell('Your browser could not preview this format. The original file is still available; use another tool to check it.'));
    $('media-preview').replaceChildren(el); $('media-status').textContent = 'Selected ' + kind + ' · local preview only.'; $('remove-media').hidden = false;
    // Media choice changes never depend on a temporarily incomplete work link.
    pendingImport++; state = { ...state, revision: state.revision + 1, reviewedRevision: null, confirmedRevision: null }; render(); tell('Media selected. Add its title, caption, and credits in Prepare.');
  });
  $('remove-media').addEventListener('click', () => { closeImportConfirm(); clearMedia(); pendingImport++; state = { ...state, revision: state.revision + 1, reviewedRevision: null, confirmedRevision: null }; render(); tell('Media removed. Review again before sharing.'); });
  $('prepare-form').addEventListener('submit', e => { e.preventDefault(); run(() => { M.https(state.link.trim()); navigate('share'); tell('Choose a destination, then review.'); }); });
  $('review').addEventListener('click', () => run(() => { const valid = M.validate(M.exportDraft(state)); state = M.review({ ...valid, revision: state.revision }, !!media); render(); $('public-preview').focus(); tell('Review the exact sharing text. Nothing has been uploaded.'); }));
  $('confirm').addEventListener('click', () => run(() => { state = M.confirm(state); render(); $('copy-text').focus(); tell('Handoff confirmed locally. Finish publishing in your chosen service.'); }));
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    tell('Download requested. Verify it in Files before closing this tab.');
  }
  $('copy-text').addEventListener('click', async () => {
    const revision = state.revision;
    try { M.requireConfirmed(state); await navigator.clipboard.writeText(M.sharingText(state)); if (state.revision === revision) tell('Sharing text copied. Attach media separately in your chosen service.'); }
    catch { $('public-preview').focus(); $('public-preview').select(); tell('Copy unavailable. Select and copy the preview, or download the text.'); }
  });
  $('download-text').addEventListener('click', () => run(() => { M.requireConfirmed(state); download(new Blob([M.sharingText(state)], { type: 'text/plain;charset=utf-8' }), state.pixie_id + '-share.txt'); }));
  $('copy-description').addEventListener('click', async () => {
    const revision = state.revision;
    try { M.requireConfirmed(state); await navigator.clipboard.writeText(M.accessibilityText(state)); if (state.revision === revision) tell('Accessibility description copied. Paste it into the media accessibility field in your destination.'); }
    catch { $('accessibility-preview').focus(); $('accessibility-preview').select(); tell('Copy unavailable. Select and copy the accessibility preview.'); }
  });
  $('download-media').addEventListener('click', () => run(() => { M.requireConfirmed(state); if (!media) throw new Error('Select media again'); download(media, media.name); }));
  $('record-publication').addEventListener('click', () => run(() => { closeImportConfirm(); state = M.recordPublication(state, $('publication-link').value, new Date().toISOString()); pendingImport++; render(); tell('Publication link recorded by you; not independently verified. Download the draft to keep it.'); }));
  $('download-draft').addEventListener('click', () => run(() => { M.validate(M.exportDraft(state)); const fingerprint = M.fingerprint(state); download(new Blob([JSON.stringify(M.exportDraft(state), null, 2)], { type: 'application/json' }), state.pixie_id + '-draft.json'); downloadedPrint = fingerprint; }));
  $('draft-file').addEventListener('change', async () => {
    const file = $('draft-file').files[0]; if (!file) return;
    closeImportConfirm();
    const token = ++pendingImport;
    try {
      if (file.size > 512000) throw new Error('Draft file exceeds 512 KB');
      let parsed;
      try { parsed = JSON.parse(await file.text()); }
      catch { throw new Error('This file is not valid JSON'); }
      const restored = M.validate(parsed);
      if (token !== pendingImport) return;
      if (!isBlank()) {
        pendingRestore = { restored, token };
        const currentPrint = M.fingerprint(state);
        $('import-confirm-text').textContent = media
          ? 'This replaces your current draft and selected media. Media is not included in PIXIE drafts; reselect it if needed.' + (downloadedPrint && currentPrint !== downloadedPrint ? ' Text changes since your last download request may also be lost.' : '')
          : downloadedPrint && currentPrint === downloadedPrint
            ? 'This replaces your current work. It matches your last download request; check Files if unsure.'
            : importedPrint && currentPrint === importedPrint
              ? 'This replaces the draft you imported. No changes are detected; PIXIE cannot tell whether either draft is saved in Files.'
              : downloadedPrint
                ? 'This replaces your current draft. Changes since your last download request will be lost; check Files if unsure.'
                : 'This replaces your current draft. PIXIE has no download record for this work, so check Files if you may need a copy.';
        $('import-confirm').hidden = false;
        $('import-no').focus();
        return;
      }
      commitImport(restored);
    } catch (e) {
      if (token === pendingImport) tell('Import rejected: ' + e.message + '. Current work retained.');
    } finally {
      if ($('draft-file').files[0] === file) $('draft-file').value = '';
    }
  });
  $('import-yes').addEventListener('click', () => {
    const pending = pendingRestore;
    closeImportConfirm();
    if (!pending || pending.token !== pendingImport) {
      $('draft-file').focus();
      tell('Import cancelled because the draft changed. Current work retained.');
      return;
    }
    commitImport(pending.restored);
  });
  $('import-no').addEventListener('click', () => {
    closeImportConfirm(); $('draft-file').focus(); tell('Import cancelled. Current work retained.');
  });
  $('reset').addEventListener('click', () => { closeImportConfirm(); $('reset-confirm').hidden = false; $('reset-no').focus(); });
  $('reset-no').addEventListener('click', () => { $('reset-confirm').hidden = true; $('reset').focus(); });
  $('reset-yes').addEventListener('click', () => { closeImportConfirm(); pendingImport++; downloadedPrint = importedPrint = null; clearMedia(); state = M.create(makeId()); syncFields(); render(); $('draft-file').value = ''; $('reset-confirm').hidden = true; navigate('work'); tell('Workspace cleared from this tab. Existing files and downloads remain untouched.'); });
  window.addEventListener('pagehide', () => { const player = $('media-preview').querySelector('audio,video'); if (player) player.pause(); });
  window.addEventListener('beforeunload', e => { if (state.title || state.caption || state.credits || state.link || state.description || media || state.receipts.length) { e.preventDefault(); e.returnValue = ''; } });
  window.PixieStreamplace.mount($('streamplace-creator'));
  syncFields(); render(); navigate(location.hash.slice(1) || 'work');
})();
