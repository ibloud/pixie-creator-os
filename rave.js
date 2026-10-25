(function(){
 'use strict';
 const $=id=>document.getElementById(id), model=window.PixieRave;
 let ticket=null, settings=model.config(), entered=false, importVersion=0;
 const player=window.PixieStreamplace.mount($('streamplace-rave'));
 const say=text=>$('rave-status').textContent=text;
 function download(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function chat(){
  const ready=entered&&settings.ready&&$('rave-chat-agree').checked;
  $('rave-chat').hidden=!ready;$('rave-report').hidden=!entered||!settings.ready;
  if(settings.ready){$('rave-chat').href=settings.room;$('rave-report').href=settings.report;$('rave-chat-status').textContent='Host-reported coverage: '+settings.moderator+'. Independently check the room rules and moderator availability. No chat has been opened.';}
  else{$('rave-chat').removeAttribute('href');$('rave-report').removeAttribute('href');$('rave-chat-status').textContent='Chat is not configured. No moderator is on duty through this alpha.';}
 }
 function render(){
  $('rave-claim').disabled=!$('rave-agree').checked||!!ticket;
  $('rave-ticket').hidden=!ticket;$('rave-enter').disabled=!$('rave-agree').checked;
  $('rave-stage-open').hidden=!entered;
  if(ticket)$('rave-pass-id').textContent='Test pass '+ticket.passId;
  chat();
 }
 function leave(){++importVersion;entered=false;ticket=null;player.clear();$('rave-agree').checked=false;$('rave-chat-agree').checked=false;$('rave-import-pass').value='';$('rave-stage-status').textContent='You have left. The player and this tab’s pass are cleared. External chat tabs remain under your control.';say('Left the rehearsal. Existing downloaded files are unchanged.');render();$('rave-agree').focus();}
 $('rave-agree').addEventListener('change',()=>{if(!$('rave-agree').checked){entered=false;player.clear();$('rave-stage-status').textContent='Entry paused. Read and accept the rules to enter again.';}render();});
 $('rave-claim').addEventListener('click',()=>{if(!$('rave-agree').checked||ticket)return;try{ticket=model.pass();say('Virtual test pass created in this tab. Download it if you want to keep it.');render();}catch{say('Pass creation is unavailable in this browser. Try a current browser over HTTPS.');}});
 $('rave-save').addEventListener('click',()=>{if(ticket){download(ticket,'pixie-rave-test-pass.json');say('Download requested. Check Files or Downloads; this is not a live admission ticket.');}});
 $('rave-enter').addEventListener('click',()=>{if(!ticket||!$('rave-agree').checked)return;entered=true;$('rave-stage-status').textContent='You are in the rehearsal. Sound stays off until you choose a player.';render();$('stage-title').focus();});
 $('rave-quiet').addEventListener('click',()=>{player.clear();$('rave-stage-status').textContent='Quiet break. The embedded player is removed. Your pass stays in this tab; separately opened chat remains open.';});
 $('rave-leave').addEventListener('click',leave);$('rave-chat-agree').addEventListener('change',chat);
 function apply(raw){settings=model.config(raw);player.clear();$('streamplaceHandleRave').value=settings.streamHandle;$('rave-host-handle').value=settings.streamHandle;$('rave-room').value=settings.room;$('rave-report-url').value=settings.report;$('rave-moderator').value=settings.moderator;$('rave-host-ready').checked=settings.ready;$('rave-export-config').disabled=false;$('rave-chat-agree').checked=false;chat();}
 $('rave-host-form').addEventListener('submit',event=>{event.preventDefault();try{apply({streamHandle:$('rave-host-handle').value,room:$('rave-room').value,report:$('rave-report-url').value,moderator:$('rave-moderator').value,ready:$('rave-host-ready').checked});$('rave-host-status').textContent='Rehearsal settings applied locally. External readiness is host-reported, not verified by PIXIE.';}catch(error){$('rave-host-status').textContent=error.message;}});
 $('rave-export-config').addEventListener('click',()=>download(settings,'pixie-rave-public-setup.json'));
 async function readFile(input,kind){const file=input.files?.[0];if(!file)return;const revision=++importVersion;try{if(file.size>6000)throw Error('Choose a JSON file smaller than 6 KB.');const raw=JSON.parse(await file.text());if(revision!==importVersion)return;if(kind==='pass'){ticket=model.readPass(raw);entered=false;player.clear();$('rave-agree').checked=false;say('Rehearsal pass restored. Read the rules again before entering.');render();}else{apply(raw);$('rave-host-status').textContent='Public setup loaded. Verify its source and external moderation before inviting participants.';}}catch(error){(kind==='pass'?say:text=>$('rave-host-status').textContent=text)(error.message);}finally{input.value='';}}
 $('rave-import-pass').addEventListener('change',event=>readFile(event.target,'pass'));$('rave-import-config').addEventListener('change',event=>readFile(event.target,'config'));
 $('rave-host-form').addEventListener('input',()=>{$('rave-export-config').disabled=true;$('rave-host-status').textContent='Edited settings are not applied. Apply them before exporting.';});
 $('rave-theme').addEventListener('change',event=>document.body.dataset.raveTheme=event.target.value);
 $('rave-size').addEventListener('change',event=>document.body.style.setProperty('--rave-size',event.target.value+'px'));
 render();
})();
