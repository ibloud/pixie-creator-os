/* PIXIE native bridge contract.
 * Safe in a normal browser: messages are no-ops unless a native WKWebView host listens.
 */
(() => {
  const native = window.webkit?.messageHandlers?.pixieNative;

  window.PIXIE_NATIVE = Object.freeze({
    available: Boolean(native),
    request(capability, action, payload = {}) {
      if (!native) {
        return { ok: false, state: 'NOT CONFIGURED', capability, action };
      }

      native.postMessage({
        version: 1,
        capability,
        action,
        payload
      });
      return { ok: true, state: 'REQUESTED', capability, action };
    }
  });
})();
