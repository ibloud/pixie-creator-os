/* Reviewed Companion context extension. Data only, never permission or publishing authority. */
(function(root){
 'use strict';
 function read(value){
  const keys=(o,list)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!list.includes(k)))throw Error('Unsupported Standard context fields');};
  const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid Standard context text');};
  keys(value,['schema','projectId','source','draft','rightsDeclaration']);
  if(value.schema!=='pixie.standard-creator-context/v1'||!/^[a-f0-9-]{36}$/.test(value.projectId||''))throw Error('Unsupported Standard context version/project');
  const s=value.source;keys(s,['uri','cid','authorDid','title','url','retrievedAt','publishedAt']);
  const match=/^at:\/\/(did:(?:plc:[a-z2-7]{24}|web:[a-z0-9.-]+))\/site\.standard\.(?:document|publication)\/[a-zA-Z0-9._~:-]{1,512}$/.exec(s.uri||'');
  if(!match||match[1]!==s.authorDid||!/^b[a-z2-7]{20,}$/.test(s.cid||''))throw Error('Invalid Standard source identity');
  text(s.title,5000);text(s.url,2000);const url=new URL(s.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Unsafe Standard source URL');
  for(const date of [s.retrievedAt,...(s.publishedAt===null?[]:[s.publishedAt])])if(typeof date!=='string'||!Number.isFinite(Date.parse(date)))throw Error('Invalid Standard source date');
  if(value.draft!==null){keys(value.draft,['id','text','kind']);if(!/^[a-f0-9-]{36}$/.test(value.draft.id||'')||value.draft.kind!=='untrusted-local-draft')throw Error('Invalid Standard draft');text(value.draft.text,5000);}
  text(value.rightsDeclaration,2000);if(value.draft!==null&&!value.rightsDeclaration.trim())throw Error('Content context requires a rights declaration');
  if(JSON.stringify(value).length>8000)throw Error('Standard context exceeds handoff limit; keep it in Companion');
  return JSON.parse(JSON.stringify(value));
 }
 const api={read};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PIXIE_STANDARD_CONTEXT=api;
})(globalThis);
