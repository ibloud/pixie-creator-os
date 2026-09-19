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

  const VERSION = '0.2.0';
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

  function normalizeProvenance(value) {
    const p = value || {};
    const attribution = p.attribution || {};
    return {
      source: p.source || null,
      source_id: p.source_id || null,
      creator: p.creator || null,
      creator_profile: p.creator_profile || null,
      source_url: p.source_url || null,
      rights: p.rights || null,
      license: p.license || null,
      attribution_required: Boolean(p.attribution_required),
      attribution_text: attribution.text || p.attribution_text || null,
      attribution_url: attribution.url || p.attribution_url || null,
      transformations: Array.isArray(p.transformations) ? p.transformations : [],
      lineage: Array.isArray(p.lineage) ? p.lineage : []
    };
  }

  function validateProvenance(record) {
    const p = normalizeProvenance(record?.provenance);
    const missing = [];
    if (!p.source) missing.push('source');
    if (p.attribution_required && !p.creator) missing.push('creator');
    if (p.attribution_required && !p.attribution_text && !p.attribution_url) missing.push('attribution');
    return { valid: missing.length === 0, missing, provenance: p };
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
      metadata: { ...(r.metadata || {}) },
      provenance: normalizeProvenance(r.provenance || { source })
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
      const provenanceCheck = validateProvenance(source);
      const candidates = match(source, targets);
      const best = candidates[0] || null;

      if (!provenanceCheck.valid) {
        return {
          action: 'PROVENANCE_REVIEW',
          source,
          target: null,
          confidence: 0,
          reasons: provenanceCheck.missing.map(field => 'MISSING_' + field.toUpperCase()),
          alternatives: candidates.slice(0, 4),
          provenance: provenanceCheck.provenance
        };
      }

      return {
        action: best && best.score >= threshold ? 'LINK' : 'REVIEW',
        source,
        target: best && best.score >= threshold ? best.target : null,
        confidence: best ? best.score : 0,
        reasons: best ? best.reasons : [],
        alternatives: candidates.slice(1, 4),
        provenance: provenanceCheck.provenance
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
  registerAdapter({ id: 'atproto', label: 'AT PROTOCOL', status: STATUS.PLANNED, capabilities: ['portable-records', 'identity', 'provenance-aware-publishing'] });
  registerAdapter({ id: 'unsplash', label: 'UNSPLASH', status: STATUS.ADAPTER_READY, capabilities: ['media-source', 'attribution', 'provenance'] });
  registerAdapter({ id: 'plyr-fm', label: 'PLYR.FM', status: STATUS.PLANNED, capabilities: ['audio-publishing'] });
  registerAdapter({ id: 'youtube', label: 'YOUTUBE', status: STATUS.PLANNED, capabilities: ['media-reference'] });
  registerAdapter({ id: 'spotify', label: 'SPOTIFY', status: STATUS.ADAPTER_READY, capabilities: ['media-reference'] });

  function installUI() {
    const run = document.getElementById('interopRun');
    const result = document.getElementById('interopResult');
    const adaptersEl = document.getElementById('interopAdapters');
    if (adaptersEl) {
      adaptersEl.innerHTML = status().adapters.map(a =>
        '<div class="interop-adapter"><strong>' + a.label + '</strong><span>' + a.status + '</span></div>'
      ).join('');
    }
    run?.addEventListener('click', () => {
      const title = document.getElementById('interopTitle')?.value || '';
      const creator = document.getElementById('interopCreator')?.value || '';
      const pixieId = document.getElementById('interopPixieId')?.value || null;
      const targetId = document.getElementById('interopTarget')?.value || 'spotify';
      const target = { source: targetId, source_id: 'demo-' + targetId, title, creators: [creator] };
      const plan = buildSyncPlan(
        [{ source: 'pixie', pixie_id: pixieId, title, creators: [creator] }],
        [target],
        { threshold: 0.72 }
      )[0];
      if (result) {
        result.textContent = plan.action === 'PROVENANCE_REVIEW'\n          ? 'PROVENANCE REVIEW REQUIRED · attribution/lineage incomplete · NO EXTERNAL WRITE'\n          : plan.action === 'LINK'
          ? 'MATCHED · ' + Math.round(plan.confidence * 100) + '% · ' + plan.reasons.join(' + ') + ' · HUMAN REVIEW REQUIRED BEFORE SYNC'
          : 'REVIEW REQUIRED · no sufficiently confident match · NO EXTERNAL WRITE';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', installUI);

  window.PIXIEInterop = Object.freeze({
    VERSION,
    STATUS,
    normalizeRecord,
    normalizeProvenance,
    validateProvenance,
    registerAdapter,
    match,
    buildSyncPlan,
    status
  });
})();