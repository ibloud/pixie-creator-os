/* Capability-aware public reshare contract. Real publishing adapters are not connected. */
(function (root) {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  function hasPostConsent(consent) {
    return Boolean(consent && typeof consent === 'object' && consent.basis === 'post-author-permission' &&
      typeof consent.evidence === 'string' && consent.evidence.trim() &&
      typeof consent.recordedAt === 'string' && Number.isFinite(Date.parse(consent.recordedAt)));
  }
  function allowedForms(source, destination, { signedInDid = '', consent = null } = {}) {
    let allowed = ['reference'];
    if (source.provenance === 'v2-selection' && source.cid && source.availability !== 'unavailable' && source.textStatus !== 'edited-since-selection') {
      const own = Boolean(signedInDid && source.authorDid === signedInDid);
      if (source.embedding !== 'disabled' && (own || source.embedding === 'allowed')) allowed.push('embed');
      if (source.embedding !== 'disabled' && (own || (hasPostConsent(consent) && source.embedding === 'allowed'))) allowed.push('quote');
    }
    return allowed.filter(form => destination.supports.includes(form));
  }
  function preview(story, destination, { signedInDid = '' } = {}) {
    if (!destination?.id || !Array.isArray(destination.supports)) throw new Error('Choose a destination.');
    const routing = story.publish?.router;
    if (!routing || !routing.sources?.length) throw new Error('Choose at least one source.');
    const sources = routing.sources.map(selection => {
      const source = story.sources.find(x => x.uri === selection.uri);
      if (!source || !allowedForms(source, destination, { signedInDid, consent: selection.consent }).includes(selection.form)) throw new Error('This destination or source does not permit the selected format.');
      if (destination.consentFirst && source.authorDid !== signedInDid && !hasPostConsent(selection.consent)) throw new Error('This destination needs source publication consent.');
      const item = { uri: source.uri, cid: source.cid, url: source.url, form: selection.form, provenance: source.provenance, cidSource: source.cidSource };
      if (selection.form === 'quote') {
        const text = source.authorDid === signedInDid ? source.text : selection.consentedText;
        if (typeof text !== 'string') throw new Error('Quoted text is missing.');
        item.text = text;
      }
      if (selection.form === 'embed' && source.embedding === 'unknown') item.note = 'Embedding setting not verified.';
      return item;
    });
    return { destination: destination.id, visibility: 'public', title: story.subject.title, context: routing.context || '', sources };
  }
  function startSeparateReshare(story) {
    const routing = story.publish?.router;
    if (!routing) throw new Error('No routing story selected.');
    if (routing.intent && routing.intent.status !== 'confirmed') throw new Error('Reconcile the unconfirmed send before starting a separate reshare.');
    delete routing.intent;
    story.publish.status = 'composing';
  }
  function createKey() {
    if (root.crypto?.randomUUID) return root.crypto.randomUUID();
    if (!root.crypto?.getRandomValues) throw new Error('Secure random IDs are unavailable in this browser. Keep your draft open.');
    return Array.from(root.crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  }
  function createRouter({ save, now = () => new Date().toISOString(), newKey = createKey }) {
    const busy = new Set();
    async function publish(story, destination, { signedInDid = '', approvedPreview } = {}) {
      if (busy.has(story.id)) throw new Error('This story already has a send in progress.');
      busy.add(story.id);
      try {
        const payload = preview(story, destination, { signedInDid });
        const snapshot = JSON.stringify(payload);
        if (approvedPreview !== snapshot) throw new Error('Review the current destination and exact public payload before confirming.');
        if (!destination.writable || typeof destination.put !== 'function' || typeof destination.lookup !== 'function') throw new Error('Destination is not writable. Export the preview for handoff.');
        const routing = story.publish.router;
        const consentRecords = routing.sources.filter(x => hasPostConsent(x.consent)).map(x => ({ uri: x.uri, consent: clone(x.consent) }));
        let intent = routing.intent;
        if (intent && intent.snapshot !== snapshot) throw new Error('Resolve the earlier send before changing its payload or destination.');
        if (!intent) routing.intent = intent = { key: newKey(), destination: destination.id, snapshot, payload: clone(payload), status: 'pending', startedAt: now(), consentRecords };
        // Persist the intended key/payload before a remote write can happen.
        const saved = save(story);
        if (saved?.persistence !== 'PERSISTED') throw new Error('Story storage needs recovery. Export your work before sending.');
        let receipt;
        try {
          receipt = await destination.lookup(intent.key);
          if (!receipt) receipt = await destination.put(intent.key, clone(intent.payload));
          if (!receipt || typeof receipt.uri !== 'string' || !receipt.uri || typeof receipt.cid !== 'string' || !receipt.cid || receipt.snapshot !== snapshot) throw new Error('Destination returned an invalid or mismatched receipt.');
        } catch (error) {
          intent.status = 'unconfirmed'; save(story);
          throw new Error('Send not confirmed. Retry the same intention to reconcile it. ' + error.message);
        }
        const record = { destination: destination.id, key: intent.key, uri: receipt.uri, cid: receipt.cid, sentAt: now(), storySnapshot: snapshot, consentRecords: clone(intent.consentRecords || []), simulated: destination.simulated === true };
        routing.receipts = routing.receipts || [];
        if (!routing.receipts.some(x => x.key === intent.key && x.destination === destination.id)) routing.receipts.push(record);
        intent.status = 'confirmed';
        story.publish.status = destination.simulated ? 'simulated' : 'published';
        const stored = save(story);
        return { receipt: record, persistence: stored?.persistence || 'MEMORY ONLY' };
      } finally { busy.delete(story.id); }
    }
    return { publish };
  }
  function fakeDestination({ id = 'test-publication', supports = ['reference', 'embed', 'quote'], mode = 'ok', consentFirst = false } = {}) {
    const records = new Map(); let dropped = false;
    return { id, supports, writable: mode !== 'read-only', simulated: true, consentFirst, records,
      async lookup(key) { if (mode === 'offline') throw new Error('Offline'); return records.get(key) || null; },
      async put(key, payload) {
        if (mode === 'permission-denied' || mode === 'reject') throw new Error('Destination rejected the write');
        if (records.has(key)) return records.get(key);
        const receipt = { uri: `at://did:example:test/example.story/${key}`, cid: `simulated-${key}`, snapshot: JSON.stringify(payload) };
        records.set(key, receipt);
        if (mode === 'lost-response' && !dropped) { dropped = true; throw new Error('Response lost'); }
        return receipt;
      } };
  }
  const api = { createKey, hasPostConsent, allowedForms, preview, startSeparateReshare, createRouter, fakeDestination };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PIXIE_STORY_ROUTER = api;
})(globalThis);
