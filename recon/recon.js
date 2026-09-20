/* PIXIE Recon — IMPLEMENTED local review queue + state machine.
   External crawling, legal validation, and ATProto actions remain PLANNED.
*/
'use strict';

(function () {
  const STORAGE_KEY = 'pixie-recon-jobs-v1';
  const ESCALATED_STORAGE_KEY = 'pixie_recon_escalated';
  const STATES = Object.freeze({
    DRAFT: 'DRAFT',
    QUEUED: 'QUEUED',
    SWEEP_PENDING: 'SWEEP_PENDING',
    CLEARED: 'CLEARED',
    FLAGGED: 'FLAGGED',
    UPLINK_SCHEDULED: 'UPLINK_SCHEDULED',
    BROADCAST: 'BROADCAST',
    BLACKOUT: 'BLACKOUT',
    GHOST: 'GHOST',
    TERMINATE: 'TERMINATE'
  });

  const REVIEWABLE = new Set([
    'DRAFT', 'QUEUED', 'SWEEP_PENDING', 'FLAGGED', 'CLEARED',
    'UPLINK_SCHEDULED', 'BROADCAST', 'BLACKOUT'
  ]);

  const TRANSITIONS = Object.freeze({
    DRAFT: ['QUEUED'],
    QUEUED: ['SWEEP_PENDING'],
    SWEEP_PENDING: ['CLEARED', 'FLAGGED'],
    FLAGGED: ['DRAFT'],
    CLEARED: ['UPLINK_SCHEDULED'],
    UPLINK_SCHEDULED: ['BROADCAST'],
    BROADCAST: ['BLACKOUT'],
    BLACKOUT: ['GHOST', 'TERMINATE'],
    GHOST: [],
    TERMINATE: []
  });

  const ACTIONS = Object.freeze({
    approve: 'APPROVE',
    dismiss: 'DISMISS',
    escalate: 'ESCALATE',
    schedule: 'SCHEDULE',
    blackout: 'BLACKOUT',
    ghost: 'GHOST',
    terminate: 'TERMINATE'
  });

  function now() { return new Date().toISOString(); }
  function id() {
    return 'recon-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function readJobs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[PIXIE Recon] local job store unavailable', error);
      return [];
    }
  }

  function readEscalations() {
    try {
      const raw = localStorage.getItem(ESCALATED_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[PIXIE Recon] escalation store unavailable', error);
      return [];
    }
  }

  function appendEscalation(record) {
    const records = readEscalations();
    if (records.some(item => item.id === record.id)) {
      throw new Error('Escalation records are write-once: ' + record.id);
    }
    localStorage.setItem(ESCALATED_STORAGE_KEY, JSON.stringify(records.concat([record]), null, 2));
    return record;
  }

  function writeJobs(jobs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs, null, 2));
    render();
  }

  function auditEntry(action, from, to, reason, actor) {
    return {
      timestamp: now(),
      action,
      from,
      to,
      actor: actor || 'HUMAN',
      reason: reason || ''
    };
  }

  function createJob(input) {
    const timestamp = now();
    const job = {
      id: id(),
      createdAt: timestamp,
      updatedAt: timestamp,
      target: input?.target || 'UNKNOWN TARGET',
      artist: input?.artist || input?.target || 'UNKNOWN ARTIST',
      sourceUrl: input?.sourceUrl || '',
      summary: input?.summary || '',
      state: STATES.DRAFT,
      sourceValidity: input?.sourceValidity || 'UNVERIFIED',
      contentAnalysis: input?.contentAnalysis || null,
      legalRisk: input?.legalRisk || null,
      quarantine: null,
      intelNotes: Array.isArray(input?.intelNotes) ? input.intelNotes : [],
      review: null,
      audit: [auditEntry('CREATE', null, STATES.DRAFT, 'Job created in local Recon store.', 'HUMAN')]
    };
    const jobs = readJobs();
    jobs.unshift(job);
    writeJobs(jobs);
    return job;
  }

  function getJob(jobId) {
    return readJobs().find(job => job.id === jobId) || null;
  }

  function saveJob(updated) {
    if (updated.escalationRecordId) {
      throw new Error('Escalated Recon records are immutable; create a new job for further processing.');
    }
    const jobs = readJobs().map(job => job.id === updated.id ? updated : job);
    writeJobs(jobs);
    return updated;
  }

  function canTransition(job, nextState) {
    return Boolean(job && TRANSITIONS[job.state]?.includes(nextState));
  }

  function transition(jobId, nextState, options) {
    const job = getJob(jobId);
    if (!job) throw new Error('Recon target not found: ' + jobId);
    if (!canTransition(job, nextState)) {
      throw new Error('Invalid Recon transition: ' + job.state + ' → ' + nextState);
    }

    const opts = options || {};
    const governance = window.PIXIE_CONSTITUTION_ENGINE?.checkAction?.({
      capability: 'automation',
      action: nextState === STATES.BROADCAST ? 'PUBLISH' : 'EXECUTE',
      task: `Recon transition ${job.state} → ${nextState} for ${job.target}`
    });
    if (governance?.decision === 'BLOCKED') {
      throw new Error('Constitution blocked Recon transition: ' + governance.reasons.join(' '));
    }
    if (nextState !== STATES.FLAGGED && opts.humanApproved !== true) {
      throw new Error('Human approval is required for every state transition.');
    }

    const previous = job.state;
    job.state = nextState;
    job.updatedAt = now();
    job.review = {
      actor: opts.actor || 'HUMAN',
      approvedAt: now(),
      rationale: opts.reason || ''
    };
    if (nextState === STATES.FLAGGED) {
      job.intelNotes = job.intelNotes.concat(opts.notes ? [opts.notes] : []);
    }
    if (nextState === STATES.GHOST) {
      job.quarantine = null;
      job.ghostedAt = now();
    }
    if (nextState === STATES.TERMINATE) {
      job.terminatedAt = now();
    }
    job.audit.push(auditEntry(
      opts.action || 'TRANSITION',
      previous,
      nextState,
      opts.reason || 'Human-approved transition.',
      opts.actor || 'HUMAN'
    ));
    return saveJob(job);
  }

  function approve(jobId, nextState, reason) {
    return transition(jobId, nextState, {
      humanApproved: true,
      action: ACTIONS.approve,
      reason
    });
  }

  function quarantine(jobId, priority, reason) {
    const job = getJob(jobId);
    if (!job) throw new Error('Recon target not found: ' + jobId);
    job.quarantine = {
      level: priority ? 'PRIORITY' : 'STANDARD',
      enteredAt: now(),
      reason: reason || 'Uncertain rights/content signal.',
      dismissed: false
    };
    job.audit.push(auditEntry(
      'QUARANTINE',
      job.state,
      job.state,
      reason || 'Uncertain rights/content signal.',
      'SYSTEM'
    ));
    return saveJob(job);
  }

  function reviewDecision(jobId, decision, reason) {
    const job = getJob(jobId);
    if (!job) throw new Error('Recon target not found: ' + jobId);
    if (!job.quarantine) throw new Error('No quarantine record exists for this target.');

    if (job.escalationRecordId) {
      throw new Error('This Recon target has already been escalated; its escalation record is write-once.');
    }

    const decisionMap = {
      DISMISS: { state: job.state, action: ACTIONS.dismiss },
      ESCALATE: { state: job.state, action: ACTIONS.escalate },
      REPORT: { state: job.state, action: 'REPORT' }
    };
    const selected = decisionMap[decision];
    if (!selected) throw new Error('Unknown quarantine decision.');

    if (decision === 'ESCALATE') {
      const escalation = {
        id: 'esc-' + id(),
        createdAt: now(),
        jobId: job.id,
        state: job.state,
        quarantine: JSON.parse(JSON.stringify(job.quarantine)),
        reason: reason || 'Human escalation.',
        actor: 'HUMAN',
        writeOnce: true
      };
      appendEscalation(escalation);
      job.escalationRecordId = escalation.id;
      job.quarantine = null;
      job.review = null;
      job.audit = job.audit.concat([auditEntry(
        selected.action,
        job.state,
        job.state,
        'Escalated to immutable record ' + escalation.id + '.',
        'HUMAN'
      )]);
      job.updatedAt = now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readJobs().map(item => item.id === job.id ? job : item), null, 2));
      render();
      return job;
    }

    job.review = {
      actor: 'HUMAN',
      approvedAt: now(),
      rationale: reason || ''
    };
    job.quarantine.dismissed = decision === 'DISMISS';
    job.audit.push(auditEntry(
      selected.action,
      job.state,
      selected.state,
      reason || 'Human quarantine decision.',
      'HUMAN'
    ));
    return saveJob(job);
  }

  function evaluateSweepResult(jobId, result) {
    const job = getJob(jobId);
    if (!job) throw new Error('Recon target not found: ' + jobId);

    if (job.escalationRecordId) throw new Error('Escalated Recon targets are immutable.');

    job.sourceValidity = result.sourceValidity || 'UNVERIFIED';
    job.contentAnalysis = result.contentAnalysis || null;
    job.legalRisk = result.legalRisk || null;
    job.updatedAt = now();

    if (job.sourceValidity === 'UNVERIFIED') {
      job.intelNotes.push('Source validity: UNVERIFIED — blocked from queue.');
      return transition(jobId, STATES.FLAGGED, { humanApproved: true, action: 'SWEEP_FLAG', reason: 'Source is unverified.', notes: 'Source validity: UNVERIFIED — blocked from queue.' });
      return saveJob(job);
    }

    if (job.sourceValidity === 'CONTESTED') {
      job.quarantine = {
        level: 'PRIORITY',
        enteredAt: now(),
        reason: 'Source validity is contested; human decision required.',
        dismissed: false
      };
      job.audit.push(auditEntry('SWEEP_QUARANTINE', STATES.SWEEP_PENDING, STATES.SWEEP_PENDING, 'Contested source requires human decision.', 'SWEEP'));
      return saveJob(job);
    }

    if (job.contentAnalysis === 'FABRICATED') {
      return transition(jobId, STATES.FLAGGED, { humanApproved: true, action: 'SWEEP_FLAG', reason: 'Fabricated content.', notes: 'Content analysis: FABRICATED — never queues for uplink.' });
    }

    if (job.contentAnalysis === 'EMBELLISHED') {
      job.legalRisk = job.legalRisk || 'LEGAL_TRIAGE';
      job.intelNotes.push('Content analysis: EMBELLISHED — legal triage required.');
      job.quarantine = {
        level: job.legalRisk === 'DEFAMATORY_IP_RISK' ? 'PRIORITY' : 'STANDARD',
        enteredAt: now(),
        reason: 'Embellished content requires legal triage.',
        dismissed: false
      };
      job.audit.push(auditEntry('LEGAL_TRIAGE', STATES.SWEEP_PENDING, STATES.SWEEP_PENDING, 'Embellished content routed to legal triage.', 'SWEEP'));
      return saveJob(job);
    }

    return transition(jobId, STATES.CLEARED, { humanApproved: true, action: 'SWEEP_CLEAR', reason: 'Source cleared and content marked accurate.' });
  }

  function nextAction(job) {
    if (!job) return null;
    if (job.quarantine?.level === 'PRIORITY') return 'PRIORITY REVIEW';
    const map = {
      DRAFT: 'QUEUE',
      QUEUED: 'RUN SWEEP',
      SWEEP_PENDING: 'AWAIT SWEEP',
      FLAGGED: 'REVIEW FLAG',
      CLEARED: 'APPROVE UPLINK',
      UPLINK_SCHEDULED: 'APPROVE BROADCAST',
      BROADCAST: 'BLACKOUT',
      BLACKOUT: 'GHOST / TERMINATE',
      GHOST: 'CLOSED',
      TERMINATE: 'CLOSED'
    };
    return map[job.state] || 'REVIEW';
  }

  function seedDemo() {
    if (readJobs().length) return;
    createJob({
      artist: 'DEMO TARGET',
      target: 'COLLABORATOR SIGNAL 01',
      summary: 'Local-only Recon demonstration target.',
      sourceValidity: 'VERIFIED',
      intelNotes: ['IMPLEMENTED: local state machine and review queue.']
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function render() {
    const list = document.getElementById('reconQueue');
    const count = document.getElementById('reconQueueCount');
    const detail = document.getElementById('reconDetail');
    if (!list) return;

    const jobs = readJobs();
    if (count) count.textContent = String(jobs.length).padStart(2, '0');

    list.innerHTML = jobs.length ? jobs.map(job => {
      const priority = job.quarantine?.level === 'PRIORITY';
      return '<button class="recon-target ' + (priority ? 'priority' : '') + '" data-recon-id="' + escapeHtml(job.id) + '" type="button">' +
        '<span class="recon-target-state">' + escapeHtml(job.state) + '</span>' +
        '<strong>' + escapeHtml(job.target) + '</strong>' +
        '<small>' + escapeHtml(job.artist) + ' · ' + escapeHtml(nextAction(job)) + '</small>' +
        '</button>';
    }).join('') : '<div class="recon-empty">NO ACTIVE SIGNALS</div>';

    list.querySelectorAll('[data-recon-id]').forEach(button => {
      button.addEventListener('click', () => showDetail(button.dataset.reconId));
    });

    if (!detail && jobs[0]) return;
    if (detail && !detail.dataset.bound) {
      detail.dataset.bound = 'true';
      detail.addEventListener('click', handleDetailAction);
    }
  }

  function showDetail(jobId) {
    const detail = document.getElementById('reconDetail');
    const job = getJob(jobId);
    if (!detail || !job) return;
    detail.dataset.jobId = job.id;
    detail.innerHTML =
      '<div class="recon-detail-head"><span class="status-chip">' + escapeHtml(job.state) + '</span>' +
      '<span class="recon-id">' + escapeHtml(job.id) + '</span></div>' +
      '<h3>' + escapeHtml(job.target) + '</h3>' +
      '<p>' + escapeHtml(job.summary || 'No intel summary.') + '</p>' +
      '<div class="recon-facts"><span>SOURCE <b>' + escapeHtml(job.sourceValidity) + '</b></span>' +
      '<span>ANALYSIS <b>' + escapeHtml(job.contentAnalysis || 'PENDING') + '</b></span>' +
      '<span>RISK <b>' + escapeHtml(job.legalRisk || 'NONE DECLARED') + '</b></span></div>' +
      (job.quarantine ? '<div class="recon-alert"><b>QUARANTINE_' + escapeHtml(job.quarantine.level) + '</b><span>' + escapeHtml(job.quarantine.reason) + '</span></div>' : '') +
      '<div class="recon-actions">' + actionButtons(job) + '</div>' +
      '<details><summary>INTEL / AUDIT TRAIL</summary><pre>' + escapeHtml(JSON.stringify(job.audit, null, 2)) + '</pre></details>';
  }

  function actionButtons(job) {
    const b = (action, label, disabled) =>
      '<button type="button" data-recon-action="' + action + '" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';

    if (job.quarantine) {
      return b('DISMISS', 'DISMISS', false) + b('ESCALATE', 'ESCALATE', false) + b('REPORT', 'REPORT · PLANNED', true);
    }
    if (job.state === STATES.DRAFT) return b('QUEUE', 'APPROVE → QUEUED', false);
    if (job.state === STATES.QUEUED) return b('SWEEP', 'APPROVE → SWEEP', false);
    if (job.state === STATES.FLAGGED) return b('DRAFT', 'RETURN TO DRAFT', false);
    if (job.state === STATES.CLEARED) return b('UPLINK', 'APPROVE → UPLINK', false);
    if (job.state === STATES.UPLINK_SCHEDULED) return b('BROADCAST', 'APPROVE → BROADCAST', false);
    if (job.state === STATES.BROADCAST) return b('BLACKOUT', 'BLACKOUT', false);
    if (job.state === STATES.BLACKOUT) return b('GHOST', 'GHOST', false) + b('TERMINATE', 'TERMINATE', false);
    return '';
  }

  function handleDetailAction(event) {
    const button = event.target.closest('[data-recon-action]');
    if (!button || button.disabled) return;
    const detail = event.currentTarget;
    const jobId = detail.dataset.jobId;
    const action = button.dataset.reconAction;
    const reason = window.prompt('Human review rationale (required):', '');
    if (reason === null || !reason.trim()) return;

    try {
      const targets = {
        QUEUE: STATES.QUEUED,
        SWEEP: STATES.SWEEP_PENDING,
        DRAFT: STATES.DRAFT,
        UPLINK: STATES.UPLINK_SCHEDULED,
        BROADCAST: STATES.BROADCAST,
        BLACKOUT: STATES.BLACKOUT,
        GHOST: STATES.GHOST,
        TERMINATE: STATES.TERMINATE
      };
      if (targets[action]) {
        transition(jobId, targets[action], { humanApproved: true, reason });
      } else {
        reviewDecision(jobId, action, reason);
      }
      showDetail(jobId);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function focusRecon() {
    const target = document.getElementById('reconLaunchDemo') || document.getElementById('reconAddTarget');
    if (target) target.focus();
  }

  function init() {
    seedDemo();
    render();
    const launch = document.getElementById('reconLaunchDemo');
    if (launch && !launch.dataset.bound) {
      launch.dataset.bound = 'true';
      launch.addEventListener('click', () => {
        const target = document.getElementById('reconAddTarget');
        if (target) target.focus();
        const notice = document.getElementById('notice');
        if (notice) notice.textContent = 'SIGNAL CAPTURED · DEMO MODE · LOCAL ONLY';
      });
    }

    const add = document.getElementById('reconAddTarget');
    if (add && !add.dataset.bound) {
      add.dataset.bound = 'true';
      add.addEventListener('click', () => {
        const target = window.prompt('Target / artist name:');
        if (!target) return;
        createJob({ target, artist: target, summary: 'Manually seeded Recon target.' });
      });
    }
    focusRecon();
  }

  window.PIXIERecon = Object.freeze({
    version: 'pre-alpha',
    status: 'IMPLEMENTED',
    states: STATES,
    createJob,
    getJob,
    transition,
    approve,
    quarantine,
    reviewDecision,
    evaluateSweepResult,
    init,
    render
  });
})();