/* PIXIE Creator Constitution — creator-owned AI governance layer. */
(() => {
  'use strict';
  const KEY='pixie-creator-constitution-v1';
  const fields=[
    ['identity','IDENTITY','Who am I? What roles do I operate in?'],
    ['purpose','PURPOSE','What am I trying to accomplish?'],
    ['principles','PRINCIPLES','What should guide the work?'],
    ['voice','VOICE','How should the work sound?'],
    ['audience','AUDIENCE','Who am I speaking to, serving, or collaborating with?'],
    ['methods','METHODS','How do I prefer to work, build, collaborate, and communicate?'],
    ['boundaries','BOUNDARIES','What must AI never say, imply, fabricate, or do in my name?'],
    ['permissions','PERMISSIONS','What may AI suggest, draft, modify, execute, or publish?'],
    ['review_gates','REVIEW GATES','What always requires explicit human approval?'],
    ['context','CONTEXT','Projects, terminology, references, collaborators, current priorities.']
  ];
  const labels=Object.fromEntries(fields.map(([k,l])=>[k,l]));
  const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}};
  const state={data:{version:1,...load()}};
  const save=()=>{state.data.updated_at=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state.data));return state.data};
  const prompt=c=>['CREATOR CONSTITUTION — GOVERNING CONTEXT','',...fields.map(([k,l])=>`${l}: ${c[k]||'Not defined'}`),'','RULE: Follow this constitution when generating or acting on the creator’s behalf.','RULE: Never silently rewrite the constitution to improve a metric or outcome.','RULE: If an action conflicts with a boundary or review gate, surface it for human approval.'].join('\n');
  const markdown=c=>`---\npixie_object: creator-constitution\nversion: ${c.version}\nupdated_at: ${c.updated_at||''}\n---\n\n# Creator Constitution\n\n${fields.map(([k,l])=>`## ${l}\n\n${c[k]||'_Not defined._'}`).join('\n\n')}\n`;
  const test=(task,c)=>{const flags=[];if(!c.identity||!c.purpose||!c.boundaries)flags.push('Define Identity, Purpose, and Boundaries before relying on this as governance.');if(/publish|post|send|delete|pay|purchase|message|contact/i.test(task)&&!c.permissions)flags.push('Externally consequential task detected; define Permissions.');if(/publish|post|send|delete|pay|purchase|message|contact/i.test(task)&&!c.review_gates)flags.push('Externally consequential task detected; define Review Gates.');return {status:flags.length?'REVIEW REQUIRED':'CONSTITUTION ALIGNED',flags}};
  function render(){
    const dock=document.querySelector('.dock'),panels=document.querySelector('.panels');if(!dock||!panels||document.getElementById('panel-constitution'))return;
    const nav=document.createElement('button');nav.className='dock-app';nav.dataset.panel='constitution';nav.type='button';nav.innerHTML='CONSTITUTION<span>GOVERNANCE</span>';nav.setAttribute('aria-controls','panel-constitution');nav.setAttribute('aria-pressed','false');dock.appendChild(nav);
    const p=document.createElement('article');p.className='panel';p.id='panel-constitution';p.hidden=true;p.setAttribute('aria-hidden','true');
    p.innerHTML=`<div class="panel-head"><div><span class="constitution-kicker">PIXIE // CREATOR GOVERNANCE</span><h2>CREATOR CONSTITUTION</h2></div><button class="close-panel" type="button" aria-label="Return to Home">×</button></div><div class="constitution-shell"><div class="constitution-intro"><div><small>PERSISTENT CREATOR-OWNED OPERATING SPECIFICATION</small><p>Govern how AI may interpret, create, recommend, and act on your behalf. AI cannot silently rewrite it.</p></div><span id="constitutionState" class="constitution-state">LOCAL DRAFT</span></div><div class="constitution-grid">${fields.map(([k,l,h])=>`<label class="constitution-field ${['boundaries','permissions','review_gates','context'].includes(k)?'wide':''}"><span>${l}</span><small>${h}</small><textarea data-constitution-field="${k}" rows="${k==='voice'||k==='boundaries'?4:3}">${esc(state.data[k])}</textarea></label>`).join('')}</div><div class="constitution-actions"><button id="constitutionSave" class="constitution-primary" type="button">SAVE TO WORKSPACE</button><button id="constitutionCopy" type="button">COPY GOVERNING PROMPT</button><button id="constitutionTest" type="button">TEST CONSTITUTION</button></div><section class="constitution-test"><small>TEST HARNESS</small><h3>GIVE IT A REAL TASK</h3><p>Example: “Write a post inviting creators into the project.”</p><textarea id="constitutionTask" rows="4" placeholder="Enter a task you would actually give an AI…"></textarea><div id="constitutionResult" role="status" aria-live="polite">No test run yet.</div></section><details><summary>GOVERNANCE MODEL</summary><p>Identity, Purpose, Principles, Voice, Audience, Methods, Boundaries, Permissions, Review Gates, and Context are structured state. A metric never gets authority to rewrite the Constitution.</p></details></div>`;
    panels.appendChild(p);
    const activate=()=>{document.querySelectorAll('.panel').forEach(x=>{const a=x===p;x.classList.toggle('active',a);x.hidden=!a;x.setAttribute('aria-hidden',a?'false':'true')});document.querySelectorAll('.dock-app').forEach(b=>{const a=b===nav;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a?'true':'false');b.setAttribute('aria-current',a?'page':'false')})};
    nav.onclick=activate;p.querySelector('.close-panel').onclick=()=>document.querySelector('[data-panel="radar"]')?.click();
    p.querySelector('#constitutionSave').onclick=async()=>{const c=collect(p);let ok=false;try{if(globalThis.PIXIE_STORAGE?.persistObject){const o=globalThis.PIXIE_STORAGE.createObject({type:'creator-constitution',title:'Creator Constitution',human_name:'Creator Constitution',source:'pixie-governance',status:'LOCAL',workspace_path:'PIXIE/Creator/Creator-Constitution.md'});o.constitution=c;await globalThis.PIXIE_STORAGE.persistObject(o);ok=true}}catch(e){p.querySelector('#constitutionResult').textContent='Local save only: '+e.message}p.querySelector('#constitutionState').textContent=ok?'SYNCED TO OBSIDIAN':'LOCAL DRAFT';if(ok)p.querySelector('#constitutionResult').textContent='Creator Constitution saved to PIXIE/Creator/Creator-Constitution.md'};
    p.querySelector('#constitutionCopy').onclick=async()=>{const c=collect(p);try{await navigator.clipboard.writeText(prompt(c));p.querySelector('#constitutionResult').textContent='GOVERNING PROMPT COPIED.'}catch(_){p.querySelector('#constitutionResult').textContent=prompt(c)}};
    p.querySelector('#constitutionTest').onclick=()=>{
      const c=collect(p),task=p.querySelector('#constitutionTask').value;
      const local=test(task,c);
      const engine=globalThis.PIXIE_CONSTITUTION_ENGINE;
      const governed=engine ? engine.checkAction({capability:'agent',action:'SUGGEST',task}) : null;
      const status=governed?.decision || local.status;
      const flags=[...local.flags,...(governed?.reasons||[])];
      const invoked=governed?.invoked_rules?.length ? '<p><small>RULES INVOKED</small> '+esc(governed.invoked_rules.join(' · '))+'</p>' : '';
      p.querySelector('#constitutionResult').innerHTML='<strong>'+esc(status)+'</strong>'+invoked+(flags.length?'<ul>'+flags.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>No governance conflicts detected.</p>');
    };
  }
  function collect(p){p.querySelectorAll('[data-constitution-field]').forEach(e=>state.data[e.dataset.constitutionField]=e.value.trim());return save()}
  globalThis.PIXIE_CONSTITUTION=Object.freeze({get:()=>({...state.data}),save,prompt,test,markdown});
  function governance(task, action='SUGGEST', capability='agent'){
    return globalThis.PIXIE_CONSTITUTION_ENGINE?.checkAction?.({task, action, capability}) ||
      {decision:'ENGINE UNAVAILABLE', task, action, capability};
  }
  globalThis.PIXIE_CONSTITUTION_GOVERNANCE = Object.freeze({
    check: governance,
    context: (capability='agent') => globalThis.PIXIE_CONSTITUTION_ENGINE?.compileContext?.(capability) || null,
    trace: (output, request) => globalThis.PIXIE_CONSTITUTION_ENGINE?.trace?.(output, request) || null
  });
  document.addEventListener('DOMContentLoaded',render);
})();