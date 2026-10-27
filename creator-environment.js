// Existing Creator OS page controller. No OAuth tokens, persistence or payment actions.
(() => {
 'use strict';
 const $=id=>document.getElementById(id),workspace=window.PixieCreatorWorkspace,M=window.PixieCreator;
 const companionOrigin='https://pixie-project-companion-production.up.railway.app';
 const parent=window.opener;let linked=false,searchVersion=0,returned='';
 function refresh(){
  const context=workspace.draft().environment;
  $('creator-event-status').textContent=context.event?context.event.title+' · '+context.event.uri+' · '+context.event.mode:'No event associated with this draft.';
  $('plyr-reference').textContent=context.music?context.music.title+' · '+context.music.attribution+' · '+context.music.verification:'No music reference selected.';
 }
 function disconnect(){
  if(linked)workspace.clear();linked=false;returned='';++searchVersion;$('plyr-results').replaceChildren();$('plyr-query').value='';
  $('creator-session-badge').textContent='Local · not signed in';$('creator-connection-state').textContent='UNAVAILABLE · disconnected';
  $('creator-project-name').textContent='Private project context cleared';$('creator-project-purpose').textContent='Your saved Companion records are unchanged. Reopen from Companion to resume.';
  $('creator-return').disabled=true;$('creator-disconnect').disabled=true;refresh();
 }
 function ready(){if(parent&&!parent.closed)parent.postMessage({type:'pixie-creator-ready'},companionOrigin);else if(linked)disconnect();}
 window.addEventListener('message',event=>{
  if(event.origin!==companionOrigin||event.source!==parent||!parent)return;
  if(event.data?.type==='pixie-creator-disconnect'){disconnect();return;}
  if(event.data?.type==='pixie-creator-saved'&&linked&&event.data.id===returned){$('creator-save-status').textContent='Confirmed saved in your Companion project. Publishing and payment remain separate.';return;}
  if(event.data?.type!=='pixie-creator-project'||linked)return;
  try{
   const {project,did,draft}=event.data;
   if(!project||typeof project.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(project.id)||typeof project.name!=='string'||project.name.length>160||typeof project.purpose!=='string'||project.purpose.length>4000||typeof did!=='string'||!/^did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._%:-]+)$/.test(did))throw Error('Invalid private project handoff');
   const restored=draft?M.validate(JSON.parse(draft)):null;
   if(workspace.draft().title&&!window.confirm('Replace this tab’s current creative draft with the selected Companion project? Download your current work first if needed.'))return;
   workspace.clear();if(restored)workspace.restore(restored);linked=true;
   $('creator-session-badge').textContent='CONNECTED · Companion project';$('creator-connection-state').textContent='CONNECTED · explicit private handoff';
   $('creator-project-name').textContent=project.name;$('creator-project-purpose').textContent=project.purpose||'No purpose recorded.';
   $('creator-return').disabled=false;$('creator-disconnect').disabled=false;$('creator-save-status').textContent='Private context received from your Companion session. This tab has no independent server credential.';refresh();
  }catch(error){$('creator-save-status').textContent='Handoff rejected: '+error.message;}
 });
 $('creator-return').addEventListener('click',()=>{
  try{
   if(!linked||!parent||parent.closed)throw Error('Companion disconnected. Download a draft instead.');
   const draft=JSON.stringify(M.validate(workspace.draft()));if(draft.length>9000)throw Error('Draft exceeds private note limit; download it instead.');
   returned=crypto.randomUUID();parent.postMessage({type:'pixie-creator-return',receipt:{schema:'pixie-creator-return/v1',id:returned,draft}},companionOrigin);
   $('creator-save-status').textContent='Returned for review, NOT saved. Confirm in Companion; only its successful response confirms persistence.';
  }catch(error){$('creator-save-status').textContent=error.message;}
 });
 $('creator-disconnect').addEventListener('click',()=>{parent?.postMessage({type:'pixie-creator-close'},companionOrigin);disconnect();});
 $('creator-event-associate').addEventListener('click',()=>{workspace.context({event:{uri:'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/community.lexicon.calendar.event/pixie-synthetic',title:'PIXIE synthetic studio rehearsal',fixture:true}});refresh();});
 $('creator-event-form').addEventListener('submit',event=>{event.preventDefault();try{workspace.context({event:{uri:$('creator-event-uri').value.trim(),title:$('creator-event-title').value.trim(),url:$('creator-event-url').value.trim(),fixture:false}});refresh();}catch(error){$('creator-event-status').textContent=error.message+'; previous reference retained.';}});
 $('creator-ticket-fixture').addEventListener('click',async()=>{try{const response=await fetch('./ticket-fixture.json',{credentials:'omit'});if(!response.ok)throw Error('Fixture unavailable');const value=M.ticketPresentation(await response.json());$('creator-ticket-status').textContent=value.mode+' · '+value.types.map(t=>t.title+': '+t.available+' available in the fixture').join(' · ');}catch{$('creator-ticket-status').textContent='Fixture unavailable. Checkout and registration remain disabled; no availability is inferred.';}});
 $('plyr-search').addEventListener('click',async()=>{
  const version=++searchVersion;$('plyr-results').replaceChildren();$('plyr-status').textContent='Requesting public references; your private draft is not sent.';
  try{
   const results=await M.searchPlyr($('plyr-query').value);if(version!==searchVersion)return;
   $('plyr-state').textContent='WORKING · public metadata received';$('plyr-status').textContent=results.length?'Choose a reference or listen in the source app. No reuse rights are implied.':'No results returned. Open plyr.fm or try a different query.';
   results.forEach(track=>{const li=document.createElement('li'),a=document.createElement('a'),button=document.createElement('button');a.href=track.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=track.title+' · '+track.attribution;button.type='button';button.textContent='Keep this music reference';button.addEventListener('click',()=>{workspace.context({music:track});refresh();});li.append(a,document.createTextNode(' '),button);$('plyr-results').append(li);});
  }catch{if(version===searchVersion){$('plyr-state').textContent='UNAVAILABLE · search failed';$('plyr-status').textContent='Search failed or was blocked. Your draft is unchanged. Use the existing plyr.fm link; no connection is claimed.';}}
 });
 $('creator-hardware-status').textContent=[['Web MIDI','requestMIDIAccess'in navigator],['Microphone/camera request API',!!navigator.mediaDevices?.getUserMedia],['Native PIXIE host',!!window.webkit?.messageHandlers?.pixieNative]].map(([name,available])=>name+': '+(available?'API present; not connected':'unavailable here')).join(' · ');
 $('creator-text-size').addEventListener('change',()=>{document.documentElement.style.setProperty('--creator-text-size',$('creator-text-size').value+'px');try{localStorage.setItem('pixie.creator.text-size',$('creator-text-size').value);}catch{}});
 try{const size=localStorage.getItem('pixie.creator.text-size');if(['20','24','28'].includes(size)){$('creator-text-size').value=size;document.documentElement.style.setProperty('--creator-text-size',size+'px');}}catch{}
 window.addEventListener('pixie-creator-draft-change',refresh);window.addEventListener('focus',ready);window.addEventListener('pageshow',ready);
 window.addEventListener('pagehide',()=>{if(linked)parent?.postMessage({type:'pixie-creator-close'},companionOrigin);});
 setInterval(()=>{if(linked&&parent?.closed)disconnect();},2000);refresh();ready();
})();
