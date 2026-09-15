const crate=[
 {title:'NIGHT BUS',artist:'CHARLIE / FICTIONAL PROJECT',bpm:124,key:'Am'},
 {title:'SIGNAL LOSS',artist:'CHARLIE / FICTIONAL PROJECT',bpm:118,key:'Dm'},
 {title:'SUNSHINE CIRCUIT',artist:'CHARLIE / FICTIONAL PROJECT',bpm:128,key:'F#m'},
 {title:'AFTER HOURS',artist:'CHARLIE / FICTIONAL PROJECT',bpm:130,key:'Gm'},
 {title:'LAST TRAIN HOME',artist:'CHARLIE / FICTIONAL PROJECT',bpm:126,key:'Cm'}
];
let playing=false, noticeTimer;
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function notice(text){$('#notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='LOCAL MODE · SAFE TO EXPLORE',2600)}
function openPanel(name){$$('.dock-app').forEach(b=>{const active=b.dataset.panel===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$$('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));}
function renderCrate(){const el=$('#crateList');el.innerHTML=crate.map((t,i)=>`<button class="crate-row" type="button" data-index="${i}"><b>${String(i+1).padStart(2,'0')}</b><span><strong>${t.title}</strong><small>${t.artist} · ${t.bpm} BPM · ${t.key}</small></span><span>${t.bpm}</span></button>`).join('');$$('.crate-row').forEach(r=>r.addEventListener('click',()=>loadTrack(Number(r.dataset.index),'A')));}
function loadTrack(i,deck){const t=crate[i];$(`#track${deck}`).textContent=`${t.title} · ${t.artist}`;notice(`DECK ${deck} · ${t.title} selected from local crate`)}
function togglePlay(){playing=!playing;$$('.platter').forEach(p=>p.style.animationPlayState=playing?'running':'paused');const playButton=$('[data-action="play"]');playButton.setAttribute('aria-pressed',String(playing));playButton.textContent=playing?'■ STOP':'▶ PLAY';notice(playing?'LOCAL VISUAL PLAYBACK · NO AUDIO':'LOCAL VISUAL PLAYBACK STOPPED')}
function action(a){if(a==='load-a')loadTrack(0,'A');if(a==='load-b')loadTrack(1,'B');if(a==='play')togglePlay();if(a==='cue')notice('CUE · visual prototype only; no audio engine');if(a==='sync')notice('SYNC · visual prototype only; no external engine connected')}
$$('.dock-app').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
$$('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
$$('.close-panel').forEach(b=>b.addEventListener('click',()=>openPanel('deck')));
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'){e.preventDefault();togglePlay()}if(e.key==='Escape')openPanel('deck')});
setInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString([], {hour12:false}),1000);
setInterval(()=>{$('#meterL').style.width=`${25+Math.random()*65}%`,$('#meterR').style.width=`${25+Math.random()*65}%`},180);
renderCrate();
