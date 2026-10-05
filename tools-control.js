/* Tools overview: explicit local actions; no accounts or remote writes. */
'use strict';
(() => {
  function refreshVault() {
    const node = document.getElementById('toolsVaultState');
    if (!node) return;
    const state = window.PIXIE_STORAGE?.getWorkspace?.();
    node.textContent = !window.showDirectoryPicker
      ? 'Use Files downloads in this browser'
      : state?.state || 'Not configured';
  }
  document.addEventListener('DOMContentLoaded', () => {
    refreshVault();
    document.addEventListener('pixie-storage-change', refreshVault);
    document.addEventListener('pixie-panel-change', refreshVault);
    document.getElementById('toolsRecovery')?.addEventListener('click', () => {
      const status = document.getElementById('toolsStatus');
      try {
        const recovery = window.PIXIE_STORY_ENGINE.exportRecovery();
        const url = URL.createObjectURL(new Blob([recovery], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url; link.download = 'pixie-story-recovery.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'Recovery download requested. Keep the file in your workspace; it can include local notes and permission evidence.';
      } catch (_) { status.textContent = 'Recovery export unavailable. Keep this tab open and copy your draft.'; }
    });
    // Static task links are bound by app.js. Start with a useful, keyboard-focusable overview.
    if (new URLSearchParams(window.location.search).get('from') !== 'superme') switchPanel('workshop');
  });
})();
