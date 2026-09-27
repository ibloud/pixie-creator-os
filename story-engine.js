/* PIXIE Story Engine — funding-ready vertical-slice foundation.
   Keeps the narrative UI local-first while making Stories durable, typed, and inspectable.
*/
'use strict';

window.PIXIE_STORY_ENGINE = window.PIXIE_STORY_ENGINE || (() => {
  const KEY = 'pixie-stories';
  const ACTIVE_KEY = 'pixie-active-story';
  const DEMO_ID = 'demo-department-of-truth';
  const QUARANTINE_PREFIX = 'pixie-stories-quarantine:';
  let readFailure = null;
  const pending = [];
  const storageStatus = { state: 'READY', message: '' };
  function announce(state, message) {
    storageStatus.state = state;
    storageStatus.message = message;
    window.dispatchEvent?.(new CustomEvent('pixie:storage-status', { detail: { state, message } }));
  }
  const NODE_TYPES = ['signal','context','claim','narrative','culturalMemory','music','conversation','voice','publish'];

  function read(){
    if (readFailure) throw readFailure;
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(value)) throw new Error('Story library has an unexpected format');
      return value;
    } catch (error) {
      readFailure = error;
      announce('RECOVERY REQUIRED', 'Story library could not be read. The original has not been overwritten. Export new captures before closing this tab.');
      throw error;
    }
  }
  function write(stories){
    if (readFailure) throw readFailure;
    localStorage.setItem(KEY, JSON.stringify(stories));
  }
  function queueForRecovery(story) {
    pending.push(story);
    let stored = false;
    try {
      const key = QUARANTINE_PREFIX + story.id + ':' + Date.now();
      localStorage.setItem(key, JSON.stringify(story));
      stored = true;
    } catch (_) { /* A full or unavailable store cannot hold quarantine data. */ }
    story.persistence = stored ? 'QUARANTINED' : 'MEMORY ONLY';
    announce(story.persistence, stored
      ? 'Story saved separately for recovery; the original library was not changed. Export a backup before leaving.'
      : 'Story was not saved to durable storage. Export it before closing this tab.');
    return story;
  }
  function exportRecovery() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (_) {}
    return JSON.stringify({ originalRaw: raw, pending, exportedAt: new Date().toISOString() }, null, 2);
  }
  function normalize(story){
    const s = window.PIXIE_STORY?.create ? window.PIXIE_STORY.create(story) : story;
    s.flow = s.flow || {currentNode:'signal',visited:['signal'],choices:[],variables:{},history:[]};
    s.sources = Array.isArray(s.sources) ? s.sources : [];
    s.provenance = Array.isArray(s.provenance) ? s.provenance : [];
    s.context = s.context || {facts:[],history:[],entities:[],status:'unverified'};
    s.claims = Array.isArray(s.claims) ? s.claims : [];
    s.narratives = Array.isArray(s.narratives) ? s.narratives : [];
    s.culturalMemory = s.culturalMemory || {notes:[],persistence:''};
    s.media = Array.isArray(s.media) ? s.media : [];
    s.music = s.music || {candidates:[],selected:null,rationale:''};
    s.conversation = s.conversation || {candidates:[],replyDraft:'',promoFit:''};
    s.voice = s.voice || {draft:'',variants:[]};
    s.publish = s.publish || {status:'draft',channels:[],references:[]};
    return s;
  }
  function save(story){
    const s = normalize(story); s.updatedAt = new Date().toISOString();
    try {
      const all = read().filter(x => x.id !== s.id); all.unshift(s); write(all);
      s.persistence = 'PERSISTED';
      if (pending.length) announce('RECOVERY REQUIRED', 'Earlier captures still need recovery. Export them before closing this tab.');
      else announce('READY', 'Story saved.');
    } catch (_) { return queueForRecovery(s); }
    return s;
  }
  function load(id){ try { return read().map(normalize).find(x => x.id === id) || window.PIXIE_STORY?.load?.(id) || null; } catch (_) { return null; } }
  function list(){ try { return read().map(normalize); } catch (_) { return []; } }
  function setActive(id){
    if (!id) { localStorage.removeItem(ACTIVE_KEY); return null; }
    const story = load(id);
    if (!story) return null;
    localStorage.setItem(ACTIVE_KEY, story.id);
    window.PIXIE_ACTIVE_STORY_ID = story.id;
    window.dispatchEvent?.(new CustomEvent('pixie:story-active', {detail:{storyId:story.id}}));
    return story;
  }
  function active(){
    const id = window.PIXIE_ACTIVE_STORY_ID || localStorage.getItem(ACTIVE_KEY) || '';
    return id ? load(id) : null;
  }
  function capture({title, url='', observation=''}){
    const now = new Date().toISOString();
    const story = save(window.PIXIE_STORY.create({
      id:`story-${Date.now()}`,
      subject:{type:'SIGNAL',title},
      signal:{observation,capturedAt:now},
      source:{url,title,capturedAt:now},
      sources:[{
        id:`source-${Date.now()}`,
        type:/^https?:\/\//i.test(url) ? 'web' : 'signal',
        url,
        title,
        observation,
        observedAt:now,
        capturedAt:now,
        relationship:'prompted-observation',
        preservation:{status:'pending',provider:'local',snapshotId:'',snapshotPath:'',reference:'',capturedAt:'',formats:[]}
      }],
      provenance:url ? [{type:'source',url,title,capturedAt:now}] : [],
      status:'signal'
    }));
    if (story.persistence === 'PERSISTED') setActive(story.id);
    return story;
  }
  function seedDemo(){
    if(load(DEMO_ID)) return load(DEMO_ID);
    return save(window.PIXIE_STORY.create({
      id:DEMO_ID,
      subject:{type:'CULTURE',title:'HOW A STORY BECOMES CULTURAL MEMORY'},
      signal:{observation:'A recurring cultural story keeps resurfacing through media, music, fiction, and community discussion.',capturedAt:'2026-01-01T00:00:00.000Z'},
      source:{url:'',title:'PIXIE narrative-method demo',capturedAt:'2026-01-01T00:00:00.000Z'},
      sources:[],
      context:{facts:[
        {type:'historical',text:'Cultural stories can persist through repeated retelling and new media forms.'},
        {type:'fact',text:'A source should be preserved alongside the observation it prompted.'}
      ],history:[],entities:['media','music','community'],status:'demo'},
      claims:[{type:'claim',text:'Repetition can increase cultural visibility without establishing truth.',speaker:'PIXIE demo'}],
      narratives:[{type:'interpretation',text:'The path from signal to memory is itself part of the story.'}],
      culturalMemory:{notes:['Track recurring motifs, references, scenes, songs, and communities.'],persistence:'REPETITION + MEDIA + MEMORY'},
      music:{candidates:['Local crate track'],selected:null,rationale:'Music is a cultural bridge, not evidence by itself.'},
      conversation:{candidates:['Original source','Commentary','Community discussion'],replyDraft:'',promoFit:''},
      voice:{draft:'The interesting part is not only what the story says, but how it survives.',variants:[]},
      publish:{status:'draft',channels:[],references:[]},
      provenance:[{type:'method',label:'PIXIE demo dataset',note:'Synthetic demonstration data; not a claim about a real event.'}],
      flow:{currentNode:'signal',visited:['signal'],choices:[],variables:{demo:true},history:[]},
      status:'signal'
    }));
  }
  document.addEventListener('DOMContentLoaded', () => {
    const notice = document.createElement('div');
    notice.setAttribute('role', 'alert');
    notice.hidden = true;
    notice.style.cssText = 'position:fixed;z-index:10000;bottom:3rem;left:1rem;right:1rem;padding:1rem;background:#282033;color:white;border:2px solid #ffcf75';
    const message = document.createElement('span');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'EXPORT RECOVERY DATA';
    button.style.marginLeft = '1rem';
    button.addEventListener('click', () => {
      const blob = new Blob([exportRecovery()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pixie-story-recovery.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
    notice.append(message, button);
    document.body.appendChild(notice);
    const render = () => {
      notice.hidden = storageStatus.state === 'READY';
      message.textContent = storageStatus.message + ' ';
    };
    window.addEventListener('pixie:storage-status', render);
    render();
  });
  return {KEY,ACTIVE_KEY,NODE_TYPES,read,write,save,load,list,setActive,active,capture,seedDemo,storageStatus,exportRecovery};
})();
