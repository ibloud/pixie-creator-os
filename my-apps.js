/* User-selected optional applications. Existing draft/private-save and device preferences only. */
(() => {
 'use strict';
 const I=window.PIXIEInterop,W=window.PixieCreatorWorkspace,$=id=>document.getElementById(id);
 const key='pixie.creator.apps.v1',catalog=I.apps();let connected=false,changing=false,storageAvailable=true;
 const say=text=>{$('my-apps-status').textContent=text;};
 function selection(){return I.appSelection(W.draft().environment.apps);}
 function persist(next){
  try{
   const clean=I.appSelection(next);changing=true;W.context({apps:clean});changing=false;
   if(!connected)try{localStorage.setItem(key,JSON.stringify(clean));storageAvailable=true;}catch{storageAvailable=false;}
   render();say(connected?'App choices updated in this draft. Return to Companion and confirm its private save to keep them.':storageAvailable?'App choices saved on this browser. Export the draft to carry them elsewhere.':'Browser saving is unavailable. Download this draft before closing the tab.');
  }catch(error){changing=false;say(error.message);}
 }
 function button(text,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);return b;}
 function focusApp(id){const section=document.querySelector('[data-app-id="'+id+'"]');(section?.querySelector('button,a')||$('connections-heading')).focus();}
 function route(view){document.querySelector('[data-view="'+view+'"]').click();}
 function card(app,item,index,items){
  const article=document.createElement('article');article.className='card app-card';article.dataset.appId=app.id;
  const h=document.createElement('h3');h.textContent=app.name;
  const state=I.appState(app,!!item,connected),badges=document.createElement('p');badges.className='app-states';
  for(const [label,value] of [['Collection',state.collection],[app.mode==='companion'?'PIXIE integration':app.mode==='viewer'?'Public viewer':'Account control',state.connection]]){const span=document.createElement('span');span.className='badge';span.textContent=label+': '+value;badges.append(span);}
  const description=document.createElement('p');description.textContent=app.description;
  const detail=document.createElement('p');detail.className='hint';detail.textContent=state.detail;
  const actions=document.createElement('div');actions.className='actions';article.append(h,badges,description,detail,actions);
  if(!item){const add=button('Add '+app.name+' to My Apps',()=>{persist([...selection(),{id:app.id}]);focusApp(app.id);});add.disabled=app.availability!=='available';actions.append(add);}
  else{
   const launch=document.createElement('a');launch.className='button';launch.textContent='Launch '+app.name+' ↗';launch.href=app.url;launch.target='_blank';launch.rel='noopener noreferrer';launch.referrerPolicy='no-referrer';actions.append(launch);
   actions.append(button('Remove '+app.name,()=>{persist(selection().filter(x=>x.id!==app.id));focusApp(app.id);}));
   const up=button('Move '+app.name+' earlier',()=>{const next=selection();[next[index-1],next[index]]=[next[index],next[index-1]];persist(next);focusApp(app.id);});up.disabled=index===0;
   const down=button('Move '+app.name+' later',()=>{const next=selection();[next[index+1],next[index]]=[next[index],next[index+1]];persist(next);focusApp(app.id);});down.disabled=index===items.length-1;actions.append(up,down);
   if(app.mode==='companion'){
    actions.append(button(connected?'Disconnect private project':'Connect private project',()=>{if(connected)$('creator-disconnect').click();else route('pixie');}));
   }
   if(app.mode==='viewer'){
    const label=document.createElement('label'),input=document.createElement('input');input.id='my-app-stream-handle';input.value=item.viewerHandle||'';input.autocomplete='off';label.htmlFor=input.id;label.textContent='Public stream handle (optional)';
    article.append(label,input,button('Save Streamplace configuration',()=>{const handle=window.PixieStreamplace.handle(input.value);if(input.value.trim()&&!handle){say('Use a public AT Protocol handle, not a URL or credential.');input.focus();return;}persist(selection().map(x=>x.id===app.id?{id:x.id,...(handle?{viewerHandle:handle}:{})}:x));focusApp(app.id);}));
    actions.append(button('Configure public viewer',()=>{$('streamplaceHandleCreator').value=item.viewerHandle||'';$('streamplaceHandleCreator').dispatchEvent(new Event('input'));$('streamplace-creator').scrollIntoView();$('streamplaceHandleCreator').focus();}));
   }
   if(app.mode==='public-search')actions.append(button('Find public music',()=>{$('plyr-query').scrollIntoView();$('plyr-query').focus();}));
  }
  return article;
 }
 function render(){
  const items=selection(),query=$('app-search').value.toLowerCase().trim(),category=$('app-category').value;
  const matches=app=>(!category||app.category===category)&&(!query||[app.name,app.description,app.category].join(' ').toLowerCase().includes(query));
  $('added-apps').replaceChildren();$('available-apps').replaceChildren();
  items.forEach((item,index)=>{const app=catalog.find(a=>a.id===item.id);if(matches(app))$('added-apps').append(card(app,item,index,items));});
  catalog.filter(app=>!items.some(x=>x.id===app.id)&&matches(app)).forEach(app=>$('available-apps').append(card(app,null,0,items)));
  for(const [id,message] of [['added-apps',items.length?'No added apps match this filter.':'No apps added yet. Choose an app below.'],['available-apps','No other apps match this filter.']])if(!$(id).childElementCount){const p=document.createElement('p');p.textContent=message;$(id).append(p);}
  $('my-apps-identity').textContent=connected?'Connected to the private project you approved in Companion. Other apps need their own authorization.':'This tab has no Companion project connection. You may still be signed in in Companion. Open a project there to connect it here.';
  $('my-apps-storage').textContent=connected?'Project collection: included in this draft. Return it to Companion and confirm the private save; reopening that project restores its apps.':'Local collection: public app IDs and a public viewer handle are saved on this browser. Private project records and credentials are excluded. Export/import carries the collection with your draft.';
 }
 for(const name of [...new Set(catalog.map(a=>a.category))].sort()){const o=document.createElement('option');o.value=name;o.textContent=name;$('app-category').append(o);}
 $('reset-yes').addEventListener('click',()=>{if(!connected)try{localStorage.removeItem(key);}catch{say('Browser preferences could not be cleared. Remove apps individually when browser storage becomes available.');}});
 $('app-search').addEventListener('input',render);$('app-category').addEventListener('change',render);
 window.addEventListener('pixie-creator-draft-change',()=>{if(!changing)render();});
 window.addEventListener('pixie-creator-connection',event=>{connected=event.detail.connected===true;render();});
 try{const raw=localStorage.getItem(key);if(raw){changing=true;W.context({apps:I.appSelection(JSON.parse(raw))});changing=false;}}catch{changing=false;storageAvailable=false;say('Saved app preferences could not be read. Your projects are unchanged; download this draft to keep new choices.');}
 render();
})();
