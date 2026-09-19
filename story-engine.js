/* PIXIE Story Engine — funding-ready vertical-slice foundation.
   Keeps the narrative UI local-first while making Stories durable, typed, and inspectable.
*/
'use strict';

window.PIXIE_STORY_ENGINE = window.PIXIE_STORY_ENGINE || (() => {
  const KEY = 'pixie-stories';
  const ACTIVE_KEY = 'pixie-active-story';
  const DEMO_ID = 'demo-department-of-truth';
  const NODE_TYPES = ['signal','context','claim','narrative','culturalMemory','music','conversation','voice','publish'];

  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; } }
  function write(stories){ localStorage.setItem(KEY, JSON.stringify(stories)); }
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
    const all = read().filter(x => x.id !== s.id); all.unshift(s); write(all);
    window.PIXIE_STORY?.save?.(s);
    return s;
  }
  function load(id){ return read().map(normalize).find(x => x.id === id) || window.PIXIE_STORY?.load?.(id) || null; }
  function list(){ return read().map(normalize); }
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
    setActive(story.id);
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
  return {KEY,ACTIVE_KEY,NODE_TYPES,read,write,save,load,list,setActive,active,capture,seedDemo};
})();
