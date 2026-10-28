(function(root){
 'use strict';
 const schema='pixie.rave-alpha/v1', eventId='tarantula-rave-lab';
 function publicUrl(value,host){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.hostname!==host||u.port||u.username||u.password||u.search||u.hash||u.pathname==='/')throw Error('Use a specific public '+host+' room URL without credentials or query parameters.');
  return u.href;
 }
 function config(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Choose a public event setup object.');
  if(input.schema&&input.schema!==schema)throw Error('Unsupported event file.');
  if(input.eventId&&input.eventId!==eventId)throw Error('This file belongs to a different event.');
  const handle=String(input.streamHandle||'').trim().toLowerCase();
  if(handle&&!/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$/.test(handle))throw Error('Enter a public Atmosphere handle, not a stream key or URL.');
  const moderator=String(input.moderator||'').trim();if(moderator.length>100)throw Error('Moderator label is too long.');
  const room=input.room?publicUrl(input.room,'roomy.space'):'';
  const report=input.report?publicUrl(input.report,'roomy.space'):'';
  const ready=input.ready===true;
  if(ready&&(!room||!report||!moderator))throw Error('Chat needs a named moderator, room and report route before host readiness can be recorded.');
  return {schema,eventId,streamHandle:handle,room,report,moderator,ready};
 }
 function identifier(source=crypto){
  if(typeof source.randomUUID==='function')return source.randomUUID();
  const bytes=source.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 }
 function pass(now=new Date(),id=identifier()){
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))throw Error('Invalid pass identifier.');
  return {schema:'pixie.rehearsal-pass/v1',eventId,passId:id,issuedAt:now.toISOString(),kind:'rehearsal-only',admission:false,payment:false};
 }
 function readPass(raw){
  if(!raw||raw.schema!=='pixie.rehearsal-pass/v1'||raw.eventId!==eventId||raw.kind!=='rehearsal-only'||raw.admission!==false||raw.payment!==false||!Number.isFinite(Date.parse(raw.issuedAt)))throw Error('Not a rehearsal pass for this event.');
  return pass(new Date(raw.issuedAt),raw.passId);
 }
 root.PixieRave={schema,eventId,config,pass,readPass,identifier};
 if(typeof module!=='undefined')module.exports=root.PixieRave;
})(typeof window==='undefined'?globalThis:window);
