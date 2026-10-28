const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const {chromium}=require('playwright');let browser,server;const base='http://127.0.0.1:4189';
before(async()=>{server=spawn('python3',['-m','http.server','4189','--bind','127.0.0.1','--directory',path.resolve(__dirname,'..')],{stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}browser=await chromium.launch({executablePath:process.env.PIXIE_CHROMIUM||undefined,headless:true});});
after(async()=>{await browser?.close();server?.kill();});
async function page(){const p=await browser.newPage();await p.context().route('https://**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic destination</title><p>External app fixture, no authorization.</p>'}));await p.goto(base);await p.getByRole('button',{name:'My Apps',exact:true}).click();return p;}
test('add, configure, order, launch, return, persist and remove without losing current work',async()=>{
 const p=await page(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.locator('[data-go="prepare"]').first().click();await p.locator('#work-title').fill('Retain my original work');await p.locator('[data-view="connections"]').click();
 await p.getByRole('button',{name:'Add Duet to My Apps',exact:true}).click();await p.getByRole('button',{name:'Add Streamplace to My Apps',exact:true}).click();
 await p.locator('#my-app-stream-handle').fill('synthetic.test');await p.getByRole('button',{name:'Save Streamplace configuration'}).click();
 await p.getByRole('button',{name:'Move Streamplace earlier'}).click();
 assert.deepEqual(await p.locator('#added-apps article h3').allTextContents(),['Streamplace','Duet']);
 const popupPromise=p.waitForEvent('popup');await p.getByRole('link',{name:'Launch Duet ↗',exact:true}).click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),'https://duet.loptrlab.com/');assert.equal(await popup.evaluate(()=>window.opener),null);await popup.close();
 await p.locator('[data-go="prepare"]').first().click();assert.equal(await p.locator('#work-title').inputValue(),'Retain my original work');
 const saved=await p.evaluate(()=>PixieCreatorWorkspace.draft());assert.equal(saved.environment.apps[0].viewerHandle,'synthetic.test');
 await p.reload();await p.locator('[data-view="connections"]').click();assert.deepEqual(await p.locator('#added-apps article h3').allTextContents(),['Streamplace','Duet']);
 // Existing draft import/restore is also the Companion return format, not a new app database.
 await p.evaluate(value=>PixieCreatorWorkspace.restore(value),saved);await p.locator('[data-view="connections"]').click();
 await p.getByRole('button',{name:'Remove Duet',exact:true}).click();await p.reload();await p.locator('[data-view="connections"]').click();assert.equal(await p.getByRole('link',{name:'Launch Duet ↗',exact:true}).count(),0);assert.equal(await p.getByRole('button',{name:'Add Duet to My Apps',exact:true}).count(),1);assert.deepEqual(errors,[]);await p.close();
});
test('filter, keyboard and large-text reflow preserve accurate states',async()=>{
 const p=await page();await p.locator('#app-search').fill('Duet');assert.equal(await p.locator('#available-apps article').count(),1);await p.locator('#app-search').fill('');await p.locator('#app-category').selectOption('Audio');assert.equal(await p.locator('#available-apps article h3').textContent(),'plyr.fm');await p.locator('#app-category').selectOption('');
 const add=p.getByRole('button',{name:'Add PIXIE Companion to My Apps',exact:true});await add.focus();await add.press('Enter');await p.locator('#added-apps').getByText('PIXIE integration: Authorization required',{exact:true}).waitFor();await p.getByRole('button',{name:'Connect private project',exact:true}).click();assert.equal(await p.evaluate(()=>document.activeElement.id),'pixie-heading');
 await p.locator('[data-view="connections"]').click();await p.locator('.creator-reading summary').click();await p.locator('#creator-text-size').selectOption('28');
 for(const width of [320,390,820,1440]){await p.setViewportSize({width,height:1180});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'reflow '+width);}
 assert.equal(await p.getByRole('button',{name:'Add atcash to My Apps',exact:true}).isDisabled(),true);
 await p.setViewportSize({width:820,height:1180});if(process.env.PIXIE_APPS_SCREENSHOT)await p.screenshot({path:process.env.PIXIE_APPS_SCREENSHOT,fullPage:true});await p.close();
});
test('storage denial is explicit and existing page layouts load from a single scoped stylesheet',async()=>{
 const context=await browser.newContext();await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Synthetic storage denial');};});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('[data-view="connections"]').click();await p.getByRole('button',{name:'Add Duet to My Apps',exact:true}).click();await p.locator('#my-apps-status').getByText('Browser saving is unavailable.',{exact:false}).waitFor();
 for(const [file,heading] of [['session.html','Keep your place'],['rave.html','Tarantula'],['morgue/','The Morgue'],['tools.html','']]){await p.goto(base+'/'+file);assert.equal(await p.evaluate(()=>document.styleSheets.length),1,file);assert.equal(await p.locator('link[rel="stylesheet"]').getAttribute('href'),file==='morgue/'?'../styles.css':'styles.css');if(heading)assert.match(await p.locator('h1').first().textContent(),new RegExp(heading,'i'));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,file);}
 assert.deepEqual(errors,[]);await context.close();
});
