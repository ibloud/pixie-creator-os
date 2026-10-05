const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture() {
  const events = new Map(), elements = new Map(), controls = new Map();
  function node(id) {
    const classes = new Set();
    const el = {id, hidden:false, value:'78', dataset:{}, style:{}, listeners:{}, attrs:{}, textContent:'',
      classList:{toggle(k,v){v ? classes.add(k):classes.delete(k);},add(k){classes.add(k);},remove(k){classes.delete(k);},contains(k){return classes.has(k);}},
      setAttribute(k,v){this.attrs[k]=v;}, addEventListener(k,fn){this.listeners[k]=fn;},
      querySelector(){return this.heading;}, focus(){document.focused=this;}, appendChild(){}};
    el.heading = {tabIndex:0,focus(){document.focused=this;}};
    return el;
  }
  for (const id of ['panel-workshop','panel-deck','panel-radar','panel-recon','notice','master','eq','posB']) elements.set(id,node(id));
  for (const action of ['play','sync','cue','load-a','load-b']) controls.set(`[data-action="${action}"]`,node(action));
  const meters=node('meters');
  const document={focused:null,
    getElementById:id=>elements.get(id)||null,
    querySelector:s=>s==='.meters'?meters:controls.get(s)||null,
    querySelectorAll:s=>s==='.panel'?[...elements.values()].filter(e=>e.id.startsWith('panel-')):[],
    createElement:()=>node('input'), body:{appendChild(){}},
    addEventListener:(k,fn)=>events.set(k,fn), dispatchEvent(){}};
  const context=vm.createContext({document,URLSearchParams,Date,CustomEvent:function(){},setInterval(){},requestAnimationFrame(){return 1;}});
  context.window=context;context.location={search:''};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context);
  events.get('DOMContentLoaded')();
  return {context,document,elements,controls,meters};
}

test('navigation focuses the chosen panel and rejects missing tools without blanking the workspace',()=>{
  const f=fixture();vm.runInContext("switchPanel('workshop')",f.context);
  assert.equal(f.document.focused,f.elements.get('panel-workshop').heading);
  vm.runInContext("switchPanel('missing')",f.context);
  assert.equal(f.elements.get('panel-workshop').hidden,false);
  vm.runInContext("switchPanel('deck')",f.context);assert.equal(f.meters.hidden,false);
  vm.runInContext("switchPanel(toolsHome())",f.context);assert.equal(f.meters.hidden,true);
});

test('position alignment preserves the new offset while deck B is playing',()=>{
  const f=fixture();
  vm.runInContext(`ctx={state:'running',currentTime:50};decks.a.buffer={duration:100};decks.a.offset=25;
    decks.b.buffer={duration:200};decks.b.playing=true;decks.b.startedAt=40;
    playDeck=(id)=>{decks[id].playing=true;};`,f.context);
  f.controls.get('[data-action="sync"]').listeners.click();
  assert.equal(vm.runInContext('decks.b.offset',f.context),50);
  assert.equal(vm.runInContext('decks.b.playing',f.context),true);
  assert.equal(f.elements.get('posB').textContent,'POSITION 00:50');
});

test('master volume set before first playback is applied to the audio graph',()=>{
  const f=fixture();f.elements.get('master').value='23';
  vm.runInContext(`ctx={state:'running',destination:{},createGain(){return {gain:{value:0},connect(){}};}};initMaster();`,f.context);
  assert.equal(vm.runInContext('masterGain.gain.value',f.context),0.23);
});
