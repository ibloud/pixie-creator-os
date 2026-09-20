/* PIXIE Constitution Engine — runtime governance boundary.
 * The Creator Constitution is policy, not prompt decoration.
 *
 * Contract:
 *   request -> normalize -> compile context -> check action -> trace
 *
 * The engine never mutates the Constitution as a side effect of optimization.
 * It returns ALLOWED / REVIEW_REQUIRED / BLOCKED; execution remains the caller's job.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const ACTIONS = Object.freeze({
    SUGGEST: 'SUGGEST',
    DRAFT: 'DRAFT',
    MODIFY: 'MODIFY',
    EXECUTE: 'EXECUTE',
    PUBLISH: 'PUBLISH'
  });
  const DECISIONS = Object.freeze({
    ALLOWED: 'ALLOWED',
    REVIEW_REQUIRED: 'REVIEW REQUIRED',
    BLOCKED: 'BLOCKED'
  });

  const CAPABILITY_FIELDS = Object.freeze({
    narrative: ['purpose', 'voice', 'audience', 'boundaries', 'context'],
    research: ['purpose', 'principles', 'context', 'boundaries'],
    planning: ['purpose', 'principles', 'methods', 'context', 'boundaries'],
    content: ['purpose', 'voice', 'audience', 'boundaries', 'context'],
    publishing: ['voice', 'audience', 'boundaries', 'permissions', 'review_gates', 'context'],
    collaboration: ['audience', 'methods', 'boundaries', 'permissions', 'review_gates', 'context'],
    automation: ['purpose', 'principles', 'boundaries', 'permissions', 'review_gates', 'context'],
    agent: ['identity', 'purpose', 'principles', 'voice', 'audience', 'methods', 'boundaries', 'permissions', 'review_gates', 'context']
  });

  const EXTERNAL_ACTION = /publish|post|send|delete|pay|purchase|message|contact|broadcast|uplink|sync|execute|schedule|blackout|terminate|ghost/i;

  function constitution() {
    return globalThis.PIXIE_CONSTITUTION?.get?.() || { version: 1 };
  }

  function text(value) {
    return String(value ?? '').trim();
  }

  function words(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function compileContext(capability = 'agent', overrides = {}) {
    const c = { ...constitution(), ...overrides };
    const fields = CAPABILITY_FIELDS[capability] || CAPABILITY_FIELDS.agent;
    const compiled = {};
    fields.forEach(field => { compiled[field] = c[field] || ''; });
    return {
      version: c.version || 1,
      capability,
      fields,
      context: compiled,
      governing_rules: [
        'Follow the Creator Constitution when interpreting, creating, recommending, or acting.',
        'Never silently rewrite the Constitution to improve a metric or outcome.',
        'Surface conflicts with boundaries, permissions, or review gates for human approval.'
      ]
    };
  }

  function hasPermission(permissionText, action, task) {
    const p = text(permissionText).toLowerCase();
    if (!p) return false;
    if (/never|none|do not|don\'t|no permission|not allowed/.test(p) && action !== ACTIONS.SUGGEST) {
      const negative = action.toLowerCase();
      if (p.includes(negative) || p.includes('all actions')) return false;
    }
    if (/all|anything|without approval|autonomous/.test(p)) return true;

    const aliases = {
      SUGGEST: ['suggest', 'recommend'],
      DRAFT: ['draft', 'write', 'compose', 'generate'],
      MODIFY: ['modify', 'edit', 'revise', 'change'],
      EXECUTE: ['execute', 'run', 'act', 'perform', 'send', 'delete', 'pay', 'purchase', 'schedule', 'sync'],
      PUBLISH: ['publish', 'post', 'broadcast', 'uplink', 'share']
    };
    const terms = aliases[action] || [action.toLowerCase()];
    return terms.some(term => p.includes(term)) || (action === ACTIONS.SUGGEST && !EXTERNAL_ACTION.test(task));
  }

  function requiresReview(reviewText, action, task) {
    const r = text(reviewText).toLowerCase();
    if (!r) return EXTERNAL_ACTION.test(task) || action === ACTIONS.PUBLISH || action === ACTIONS.EXECUTE;
    if (/none|no approval|without approval|never/.test(r)) return false;
    if (/publish|post|send|delete|pay|purchase|message|contact|broadcast|uplink|sync|execute|external|public|all actions|anything/i.test(r)) return true;
    return EXTERNAL_ACTION.test(task) || action === ACTIONS.PUBLISH || action === ACTIONS.EXECUTE;
  }

  function boundaryConflict(boundaryText, task) {
    const b = text(boundaryText);
    const t = text(task).toLowerCase();
    if (!b || !t) return null;

    const rules = b.split(/\n|[.;]/).map(x => x.trim()).filter(Boolean);
    for (const rule of rules) {
      const lower = rule.toLowerCase();
      const negative = lower.match(/(?:never|do not|don't|must not|no)\s+(.+)/);
      if (!negative) continue;
      const terms = words(negative[1]).filter(x => x.length > 3 && !['with','from','into','that','this','your','what'].includes(x));
      const hits = terms.filter(term => t.includes(term));
      if (hits.length >= Math.max(1, Math.min(2, Math.ceil(terms.length * 0.4)))) {
        return { rule, matched_terms: hits };
      }
    }
    return null;
  }

  function checkAction(request = {}) {
    const c = constitution();
    const task = text(request.task || request.description || request.action);
    const action = text(request.action || ACTIONS.SUGGEST).toUpperCase();
    const capability = text(request.capability || 'agent').toLowerCase();
    const reasons = [];
    const invoked = [];
    const boundary = boundaryConflict(c.boundaries, task);

    if (boundary) {
      invoked.push('BOUNDARIES');
      reasons.push('Task conflicts with a creator-defined boundary.');
      return result(DECISIONS.BLOCKED, request, { capability, action, task, reasons, invoked, boundary });
    }

    if (!c.identity || !c.purpose || !c.boundaries) {
      reasons.push('Identity, Purpose, and Boundaries are incomplete.');
      invoked.push('IDENTITY', 'PURPOSE', 'BOUNDARIES');
      return result(DECISIONS.REVIEW_REQUIRED, request, { capability, action, task, reasons, invoked });
    }

    const permission = hasPermission(c.permissions, action, task);
    invoked.push('PERMISSIONS');
    if (!permission && action !== ACTIONS.SUGGEST) {
      reasons.push('The Constitution does not explicitly grant this action.');
      return result(DECISIONS.REVIEW_REQUIRED, request, { capability, action, task, reasons, invoked });
    }

    const review = requiresReview(c.review_gates, action, task);
    invoked.push('REVIEW GATES');
    if (review) {
      reasons.push('Creator-defined review gates require human approval before this action.');
      return result(DECISIONS.REVIEW_REQUIRED, request, { capability, action, task, reasons, invoked });
    }

    invoked.push('PURPOSE');
    if (c.voice && ['DRAFT', 'MODIFY', 'PUBLISH'].includes(action)) invoked.push('VOICE');
    if (c.audience && ['DRAFT', 'MODIFY', 'PUBLISH'].includes(action)) invoked.push('AUDIENCE');
    if (c.context) invoked.push('CONTEXT');

    return result(DECISIONS.ALLOWED, request, { capability, action, task, reasons: ['No constitutional conflict detected.'], invoked });
  }

  function result(decision, request, data) {
    return Object.freeze({
      version: VERSION,
      timestamp: new Date().toISOString(),
      decision,
      action: data.action,
      capability: data.capability,
      task: data.task,
      reasons: data.reasons,
      invoked_rules: [...new Set(data.invoked)],
      boundary: data.boundary || null,
      request: { ...request }
    });
  }

  function authorize(request = {}) {
    return checkAction(request);
  }

  function explain(request = {}) {
    const r = checkAction(request);
    return {
      decision: r.decision,
      summary: r.reasons.join(' '),
      invoked_rules: r.invoked_rules,
      boundary: r.boundary,
      trace: r
    };
  }

  function trace(output = {}, request = {}) {
    const check = checkAction(request);
    return Object.freeze({
      timestamp: new Date().toISOString(),
      decision: check.decision,
      action: check.action,
      capability: check.capability,
      invoked_rules: check.invoked_rules,
      constitutional_check: check,
      output_type: output.type || 'AI_OUTPUT',
      output_id: output.id || null
    });
  }

  function selfTest() {
    const original = globalThis.PIXIE_CONSTITUTION?.get?.();
    const sample = {
      version: 1,
      identity: 'Creator',
      purpose: 'Make useful cultural work.',
      principles: 'Truth and human control.',
      voice: 'Clear and human.',
      audience: 'Smart peers.',
      methods: 'Evidence first.',
      boundaries: 'Never fabricate sources.\nNever publish without review.',
      permissions: 'suggest draft modify',
      review_gates: 'publish, post, send, delete require approval',
      context: 'Creator OS'
    };
    const cases = [
      { name: 'draft allowed', request: { capability: 'content', action: 'DRAFT', task: 'Draft a post about Creator OS.' }, expected: DECISIONS.ALLOWED },
      { name: 'publish review', request: { capability: 'publishing', action: 'PUBLISH', task: 'Publish the post.' }, expected: DECISIONS.REVIEW_REQUIRED },
      { name: 'boundary blocked', request: { capability: 'content', action: 'DRAFT', task: 'Invent a source for this claim.' }, expected: DECISIONS.BLOCKED }
    ];
    const originalGet = globalThis.PIXIE_CONSTITUTION?.get;
    if (globalThis.PIXIE_CONSTITUTION) {
      globalThis.PIXIE_CONSTITUTION.get = () => sample;
    }
    const results = cases.map(item => ({ ...item, actual: checkAction(item.request), pass: checkAction(item.request).decision === item.expected }));
    if (globalThis.PIXIE_CONSTITUTION && originalGet) globalThis.PIXIE_CONSTITUTION.get = originalGet;
    return { pass: results.every(x => x.pass), results };
  }

  globalThis.PIXIE_CONSTITUTION_ENGINE = Object.freeze({
    VERSION, ACTIONS, DECISIONS, compileContext, checkAction, authorize, explain, trace, selfTest
  });
})();