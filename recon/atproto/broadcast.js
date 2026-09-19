/* PIXIE Recon ATProto broadcast adapter — PLANNED.
   External publishing is deliberately not implemented in pre-alpha.
*/
'use strict';
window.PIXIEReconBroadcast = Object.freeze({
  status: 'PLANNED',
  publish: async function (post) {
    return { status:'PLANNED', operation:'client.create(app.bsky.feed.post, { text, createdAt })', post, sent:false };
  }
});