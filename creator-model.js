/* Portable local draft. Media bytes, filenames, paths and credentials stay out. */
(function (root) {
  'use strict';
  const schema = 'pixie-artist-draft/v1';
  const limits = { title: 160, link: 2000, caption: 5000, credits: 2000, description: 2000 };
  function text(value, limit) {
    if (typeof value !== 'string' || value.length > limit) throw new Error('Invalid or oversized draft text');
    return value;
  }
  function https(value) {
    if (!value) return '';
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password) throw new Error('Use a public HTTPS link without credentials');
    return u.href;
  }
  function environment(input={}) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid creative context');
    const event=input.event||null;
    if(event&&(!/^at:\/\/did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._%:-]+)\/community\.lexicon\.calendar\.event\/[A-Za-z0-9._~:-]+$/.test(event.uri)||typeof event.title!=='string'||!event.title.trim()||event.title.length>160))throw Error('Use a calendar event AT URI and title');
    let eventUrl='';if(event?.url){const u=new URL(event.url);if(u.protocol!=='https:'||!['atmo.rsvp','platform.openmeet.net','smokesignal.events'].includes(u.hostname)||u.port||u.username||u.password||u.search||u.hash)throw Error('Use a public event application URL without credentials or query parameters');eventUrl=u.href;}
    let music=null;
    if(input.music){const m=input.music,u=new URL(m.url);if(u.protocol!=='https:'||u.hostname!=='plyr.fm'||u.username||u.password||u.search||u.hash||!/^\/track\/[A-Za-z0-9_-]+$/.test(u.pathname))throw Error('Choose a plyr.fm track link without secrets');
      const uri=text(m.uri||'',2000);if(uri&&!/^at:\/\/did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._%:-]+)\/fm\.plyr\.track\/[A-Za-z0-9._~:-]+$/.test(uri))throw Error('Unsupported audio source URI');
      music={url:u.href,uri,cid:text(m.cid||'',300),title:text(m.title||'',160),attribution:text(m.attribution||'',1000),rights:text(m.rights||'',2000),verification:'public reference; ownership and playback not verified'};
    }
    const apps = input.apps === undefined ? [] : (root.PIXIEInterop || (typeof require === 'function' ? require('./interoperability.js') : null))?.appSelection(input.apps);
    if(!apps)throw Error('App registry unavailable');
    return {apps,event:event?{uri:event.uri,title:event.title,url:eventUrl,mode:event.fixture===true?'fixture; no registration or admission':'creator-supplied reference; not fetched or synchronized',fixture:event.fixture===true}:null,music};
  }
  function validate(input) {
    if (!input || input.schema !== schema || typeof input.pixie_id !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(input.pixie_id) || !['bluesky', 'repurpose'].includes(input.destination) || typeof input.rights !== 'boolean') throw new Error('Unsupported PIXIE draft');
    const fields = {};
    for (const [key, limit] of Object.entries(limits)) fields[key] = text(input[key], limit);
    fields.link = https(fields.link.trim());
    if (!Array.isArray(input.receipts) || input.receipts.length > 100) throw new Error('Invalid publication history');
    const receipts = input.receipts.map(r => {
      if (!r || !['bluesky', 'repurpose'].includes(r.destination) || !Number.isSafeInteger(r.revision) || r.revision < 0) throw new Error('Invalid publication record');
      const url = https(text(r.url, 2000));
      if (!url || !Number.isFinite(Date.parse(text(r.recorded_at, 64)))) throw new Error('Invalid publication record');
      return { url, title: text(r.title, 160), destination: r.destination, revision: r.revision, recorded_at: r.recorded_at, verification: 'user-reported; not independently verified' };
    });
    // Import is always an unreviewed draft; unknown fields are discarded.
    return { schema, pixie_id: input.pixie_id, ...fields, environment:environment(input.environment), rights: input.rights, destination: input.destination, receipts, revision: 0, reviewedRevision: null, confirmedRevision: null };
  }
  function create(id) {
    return validate({ schema, pixie_id: id, title: '', link: '', caption: '', credits: '', description: '', rights: false, destination: 'bluesky', receipts: [] });
  }
  function edit(s, patch) {
    const next = validate({ ...s, ...patch, pixie_id: s.pixie_id, receipts: s.receipts });
    return { ...next, revision: s.revision + 1 };
  }
  function sharingText(s) {
    return [s.title.trim(), s.caption.trim(), s.link.trim(), s.credits.trim() ? 'Credits and rights: ' + s.credits.trim() : ''].filter(Boolean).join('\n\n');
  }
  function accessibilityText(s) { return s.description.trim(); }
  function captionSuggestion(s, kind) {
    const subject = s.title.trim() || 'this piece';
    if (kind === 'feedback') return 'I would love your feedback on ' + subject + '. What stands out to you?';
    if (kind === 'process') return 'Behind ' + subject + ': [add what you tried, learned, or changed].';
    return 'Sharing ' + subject + '. [Add what you would like people to know.]';
  }
  function review(s, hasMedia) {
    if (!s.title.trim()) throw new Error('Give your work a title in Prepare');
    if (!s.rights) throw new Error('Confirm your right to share in Prepare');
    if (!hasMedia && !s.link) throw new Error('Choose media or add a public work link');
    if (s.destination === 'repurpose' && !hasMedia) throw new Error('Select media for the Repurpose source handoff');
    return { ...s, reviewedRevision: s.revision, confirmedRevision: null };
  }
  function confirm(s) {
    if (s.reviewedRevision !== s.revision) throw new Error('Review the current work before confirming');
    return { ...s, confirmedRevision: s.revision };
  }
  function requireConfirmed(s) {
    if (s.confirmedRevision !== s.revision) throw new Error('Review and confirm the current handoff first');
  }
  function recordPublication(s, url, now) {
    requireConfirmed(s);
    const publicUrl = https(text(url.trim(), 2000));
    if (!publicUrl) throw new Error('Enter the resulting publication link');
    if (s.receipts.length >= 100) throw new Error('Publication history is full; download this draft and start another');
    if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid recording time');
    const receipt = { url: publicUrl, title: s.title.trim(), destination: s.destination, revision: s.revision, recorded_at: now, verification: 'user-reported; not independently verified' };
    return { ...s, receipts: [...s.receipts, receipt] };
  }
  function exportDraft(s) {
    const out = { schema, pixie_id: s.pixie_id };
    for (const key of Object.keys(limits)) out[key] = s[key];
    return { ...out, environment:environment(s.environment), rights: s.rights, destination: s.destination, receipts: s.receipts.map(r => ({ ...r })), mediaIncluded: false, publication: 'manual; not independently verified' };
  }
  function parsePlyrSearch(value){
    if(!Array.isArray(value?.results)||value.results.length>50)throw Error('Unsupported music response');
    return value.results.filter(r=>r.type==='track').slice(0,5).map(r=>{if(!Number.isSafeInteger(r.id)||r.id<1||typeof r.title!=='string'||typeof r.artist_handle!=='string')throw Error('Unsupported track reference');return {url:'https://plyr.fm/track/'+r.id,uri:'',cid:'',title:text(r.title,160),attribution:text(r.artist_display_name||r.artist_handle,1000),rights:'Unverified: public availability is not permission to reuse'};});
  }
  async function searchPlyr(query,fetcher=fetch){
    if(typeof query!=='string'||query.trim().length<2||query.trim().length>100)throw Error('Use 2–100 characters');
    const response=await fetcher('https://api.plyr.fm/search/?'+new URLSearchParams({q:query.trim(),type:'tracks',limit:'5'}),{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Music search unavailable. Open plyr.fm directly; your work is unchanged');
    return parsePlyrSearch(await response.json());
  }
  function ticketPresentation(input){
    if(input?.mode!=='LOCAL TEST FIXTURE — not live inventory, payment or admission'||input.availability?.environment!=='test'||!Array.isArray(input.availability.ticketTypes)||input.availability.ticketTypes.length>20)throw Error('Only the reviewed local ticket fixture is supported');
    const types=input.availability.ticketTypes.map(t=>{if(typeof t.ticketTypeId!=='string'||typeof t.title!=='string'||(t.availableQuantity!==undefined&&(!Number.isSafeInteger(t.availableQuantity)||t.availableQuantity<0)))throw Error('Invalid fixture capacity');return {id:text(t.ticketTypeId,100),title:text(t.title,160),available:t.availableQuantity===undefined?'not supplied':String(t.availableQuantity)};});
    return {mode:input.mode,types};
  }
  function fingerprint(s) { return JSON.stringify(exportDraft(s)); }
  const api = { ticketPresentation,parsePlyrSearch,searchPlyr,environment, create, validate, edit, review, confirm, requireConfirmed, sharingText, accessibilityText, captionSuggestion, recordPublication, exportDraft, fingerprint, https };
  root.PixieCreator = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
