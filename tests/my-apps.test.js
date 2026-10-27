const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const I=require('../interoperability.js'),M=require('../creator-model.js');
test('registry reuses adapter IDs and fixed source destinations',()=>{
 const apps=I.apps();assert.equal(new Set(apps.map(a=>a.id)).size,apps.length);
 assert.equal(apps.filter(a=>a.id==='plyr-fm').length,1);
 for(const app of apps.filter(a=>a.url)){const url=new URL(app.url,'https://ibloud.github.io/pixie-creator-os/');assert.equal(url.protocol,'https:');assert.equal(url.username,'');}
 for(const id of ['companion','plyr-fm','streamplace','atmo-rsvp','openmeet','tickets','atm','made-sick','duet','50ways','tools'])assert.ok(apps.some(a=>a.id===id));
});
test('selection is ordered, strips credentials and cannot choose URLs or forge connections',()=>{
 const out=I.appSelection([{id:'streamplace',viewerHandle:'synthetic.test',token:'secret',connected:true,url:'https://evil.test/'},{id:'duet'}]);
 assert.deepEqual(out,[{id:'streamplace',viewerHandle:'synthetic.test'},{id:'duet'}]);
 for(const bad of [[{id:'unknown'}],[{id:'atcash'}],[{id:'duet'},{id:'duet'}],[{id:'streamplace',viewerHandle:'https://evil.test/'}],[{id:'duet',viewerHandle:'owner.test'}],Array(31).fill({id:'duet'})])assert.throws(()=>I.appSelection(bad));
});
test('Added, Connected and authorization remain independent of identity claims',()=>{
 const c=I.apps().find(a=>a.id==='companion'),d=I.apps().find(a=>a.id==='duet'),a=I.apps().find(a=>a.id==='atcash');
 assert.equal(I.appState(c,false).collection,'Available');assert.equal(I.appState(c,true).collection,'Added');assert.equal(I.appState(c,true).connection,'Authorization required');
 assert.equal(I.appState(c,true,true).connection,'Connected');assert.equal(I.appState(d,true,true).connection,'Unsupported');assert.equal(I.appState(a,false).collection,'Unavailable');
});
test('existing portable draft preserves app ordering/configuration without capabilities',()=>{
 const apps=[{id:'duet'},{id:'streamplace',viewerHandle:'synthetic.test'}];
 const draft=M.edit(M.create('original-id'),{title:'Kept project',environment:{apps}}),saved=M.exportDraft(draft),restored=M.validate(JSON.parse(JSON.stringify(saved)));
 assert.deepEqual(restored.environment.apps,apps);assert.doesNotMatch(M.sharingText(saved),/viewerHandle|synthetic\.test|environment\.apps/);assert.equal(restored.pixie_id,'original-id');assert.equal(restored.title,'Kept project');assert.equal(restored.reviewedRevision,null);
 assert.deepEqual(M.validate({...saved,environment:{}}).environment.apps,[]);
 assert.throws(()=>M.validate({...saved,environment:{apps:[{id:'javascript:alert(1)'}]}}));
});
test('every executable page uses only the shared stylesheet and no inline competing rules',()=>{
 for(const file of ['index.html','tools.html','session.html','rave.html','morgue/index.html']){
  const html=fs.readFileSync(file,'utf8');const links=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
  assert.equal(links.length,1,file);assert.match(links[0],/href="(?:\.\.\/)?styles\.css"/);assert.doesNotMatch(html,/<style[\s>]|\sstyle=/i);assert.match(html,/data-pixie-surface=/);
 }
 const css=fs.readFileSync('styles.css','utf8');assert.doesNotMatch(css,/@import/);
});
