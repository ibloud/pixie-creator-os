/* PIXIE Ink-style flow layer.
   Keeps the existing narrative UI intact while giving each Story a navigable
   state graph. No Ink runtime is bundled yet; this is the compatibility seam.
*/
'use strict';

const PIXIE_FLOW = [
  {id:'signal', label:'SIGNAL', next:['context']},
  {id:'context', label:'CONTEXT', next:['claims','memory']},
  {id:'claims', label:'CLAIMS', next:['memory']},
  {id:'memory', label:'CULTURAL MEMORY', next:['music','conversation']},
  {id:'music', label:'MUSIC', next:['conversation']},
  {id:'conversation', label:'CONVERSATION', next:['voice']},
  {id:'voice', label:'VOICE', next:[]}
];

function pixieFlowNode(id){return PIXIE_FLOW.find(n=>n.id===id)||PIXIE_FLOW[0];}
function pixieFlowRender(){
  const host=document.getElementById('pixieInkFlow');
  if(!host)return;
  const story=window.PIXIE_ACTIVE_STORY;
  const current=story?.flow?.currentNode||'signal';
  const visited=story?.flow?.visited?.length?story.flow.visited:['signal'];
  host.innerHTML=visited.map((id,i)=>`<button type="button" class="flow-node ${id===current?'current':''}" data-pixie-flow="${id}">${i+1}. ${pixieFlowNode(id).label}</button>`).join('<span class="flow-arrow" aria-hidden="true">→</span>');
  host.querySelectorAll('[data-pixie-flow]').forEach(b=>b.onclick=()=>pixieFlowVisit(b.dataset.pixieFlow,false));
}
function pixieFlowVisit(id,choice=true){
  const story=window.PIXIE_ACTIVE_STORY;
  if(!story||!window.PIXIE_STORY)return;
  if(choice)window.PIXIE_STORY.choose(story,`${story.flow.currentNode}->${id}`,id);
  else window.PIXIE_STORY.visit(story,id);
  pixieFlowRender();
  const node=pixieFlowNode(id);
  const notice=document.getElementById('notice');
  if(notice)notice.textContent='STORY NODE · '+node.label;
}
function pixieFlowBind(){
  const radar=document.getElementById('panel-radar');
  if(!radar)return;
  if(!document.getElementById('pixieInkFlow')){
    const shell=radar.querySelector('.narrative-shell .narrative-main');
    const grid=document.getElementById('narrativeGrid');
    if(shell&&grid){const bar=document.createElement('div');bar.className='flow-strip';bar.innerHTML='<span class="flow-label">STORY FLOW</span><div id="pixieInkFlow"></div>';shell.insertBefore(bar,grid);}
  }
  radar.querySelectorAll('[data-story-select]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{window.PIXIE_ACTIVE_STORY=typeof activeStory!=='undefined'?activeStory:null;pixieFlowRender();},0)));
  const capture=document.getElementById('narrativeAdd');
  if(capture)capture.addEventListener('click',()=>setTimeout(()=>{window.PIXIE_ACTIVE_STORY=typeof activeStory!=='undefined'?activeStory:null;pixieFlowRender();},0));
  pixieFlowRender();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(pixieFlowBind,0));
