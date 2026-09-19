/* PIXIE Recon ATProto terminate adapter — PLANNED. */
'use strict';
window.PIXIEReconTerminate = Object.freeze({
  status: 'PLANNED',
  terminate: async function (rkey) {
    return { status:'PLANNED', operation:'client.delete(app.bsky.feed.post, { rkey })', rkey, sent:false };
  }
});