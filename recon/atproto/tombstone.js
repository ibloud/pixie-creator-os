/* PIXIE Recon ATProto tombstone adapter — PLANNED. */
'use strict';
window.PIXIEReconTombstone = Object.freeze({
  status: 'PLANNED',
  create: async function (target) {
    return { status:'PLANNED', text:'This signal has gone dark.', target, sent:false };
  }
});