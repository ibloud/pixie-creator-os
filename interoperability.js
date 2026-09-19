/* PIXIE Creator OS — interoperability layer
 * Soundiiz-inspired architecture for creator records.
 * Local-only in this build: no third-party credentials, writes, or network sync.
 *
 * Contract:
 *   canonical PIXIE object -> source adapters -> normalized records
 *   -> deterministic match -> proposed transfer/sync plan
 *
 * Names are presentation. PIXIE IDs are identity. Source IDs remain source-owned.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const STATUS = Object.freeze({
    WORKING: 'WORKING',
    LOCAL_ONLY: 'LOCAL ONLY',
    ADAPTER_READY: 'ADAPTER READY',
    PLANNED: 'PLANNED',
    BLOCKED: 'BLOCKED'
  });

  const adapters = new Map();

  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function registerAdapter(adapter) {
    if (!adapter || !adapter.id) throw new TypeError('Adapter requires an id');
    adapters.set(adapter.id, Object.freeze({
      id: adapter.id,
      label: adapter.label || adapter.id,
      status: adapter.status || STATUS.PLANNED,
      capabilities: Object.freeze([...(adapter.capabilities || [])]),
      normalize: adapter.normalize || (record => normalizeRecord(record, adapter.id))
    }));
  }

  function normalizeRecord(record, source) {
    const r = record || {};
    return {
      source,
      source_id: r.source_id ?? r.id ?? null,
      pixie_id: r.pixie_id ?? null,
      type: r.type || 'work',
      title: r.title || r.name || '',
      creators: Array.isArray(r.creators) ? r.creators : (r.creator ? [r.creator] : []),
      url: r.url || null,
      metadata: { ...(r.metadata || {}) }
    };
  }

  function scoreMatch(a, b) {
    const titleA = normalizeText(a.title);
    const titleB = normalizeText(b.title);
    const creatorsA = normalizeText((a.creators || []).join(' '));
    const creatorsB = normalizeText((b.creators || []).join(' '));

    let score = 0;
    const reasons = [];

    if (a.pixie_id && b.pixie_id && a.pixie_id === b.pixie_id) {
      score += 1;
      reasons.push('PIXIE_ID');
    }
    if (titleA && titleA === titleB) {
      score += 0.65;
      reasons.push('TITLE');
    } else if (titleA && titleB && (titleA.includes(titleB) || titleB.includes(titleA))) {
      score += 0.35;
      reasons.push('TITLE_PARTIAL');
    }
    if (creatorsA && creatorsA === creatorsB) {
      score += 0.35;
      reasons.push('CREATORS');
    }
    return { score: Math.min(1, score), reasons };
  }

  function match(sourceRecord, targetRecords = []) {
    const source = normalizeRecord(sourceRecord, sourceRecord?.source || 'unknown');
    return targetRecords
      .map(targetRaw => {
        const target = normalizeRecord(targetRaw, targetRaw?.source || 'unknown');
        const result = scoreMatch(source, target);
        return { source, target, ...result };
      })
      .sort((a, b) => b.score - a.score);
  }

  function buildSyncPlan(sourceRecords, targetRecords, options = {}) {
    const threshold = Number.isFinite(options.threshold) ? options.threshold : 0.72;
    const targets = targetRecords || [];
    return (sourceRecords || []).map(raw => {
      const source = normalizeRecord(raw, raw?.source || options.source || 'unknown');
      const candidates = match(source, targets);
      const best = candidates[0] || null;
      return {
        action: best && best.score >= threshold ? 'LINK' : 'REVIEW',
        source,
        target: best && best.score >= threshold ? best.target : null,
        confidence: best ? best.score : 0,
        reasons: best ? best.reasons : [],
        alternatives: candidates.slice(1, 4)
      };
    });
  }

  function status() {
    return {
      version: VERSION,
      mode: 'LOCAL_ONLY',
      adapters: [...adapters.values()].map(a => ({
        id: a.id,
        label: a.label,
        status: a.status,
        capabilities: a.capabilities
      }))
    };
  }

  // Adapters are boundaries, not claims of live service connectivity.
  registerAdapter({ id: 'pixie', label: 'PIXIE', status: STATUS.WORKING, capabilities: ['canonical-records', 'identity'] });
  registerAdapter({ id: 'obsidian', label: 'OBSIDIAN', status: STATUS.ADAPTER_READY, capabilities: ['workspace-records', 'markdown'] });
  registerAdapter({ id: 'atproto', label: 'AT PROTOCOL', status: STATUS.PLANNED, capabilities: ['portable-records', 'identity'] });
  registerAdapter({ id: 'plyr-fm', label: 'PLYR.FM', status: STATUS.PLANNED, capabilities: ['audio-publishing'] });
  registerAdapter({ id: 'youtube', label: 'YOUTUBE', status: STATUS.PLANNED, capabilities: ['media-reference'] });
  registerAdapter({ id: 'spotify', label: 'SPOTIFY', status: STATUS.ADAPTER_READY, capabilities: ['media-reference'] });

  window.PIXIEInterop = Object.freeze({
    VERSION,
    STATUS,
    normalizeRecord,
    registerAdapter,
    match,
    buildSyncPlan,
    status
  });
})();