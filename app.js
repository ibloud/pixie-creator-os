const crate=[
 {title:'NIGHT BUS / 02',artist:'PIXIE RADIO',bpm:124,key:'Am'},
 {title:'SUNSET CIRCUIT',artist:'PRIVATE CRATE',bpm:128,key:'F#m'},
 {title:'NO SIGNAL',artist:'FIELD RECORDING',bpm:118,key:'Dm'},
 {title:'AFTER HOURS',artist:'STUDIO SESSION',bpm:130,key:'Gm'},
 {title:'CHARLIE CASE STUDY',artist:'CONCEPT / DEMO',bpm:126,key:'Cm'}
];
let playing=false, noticeTimer;
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function notice(text){$('#notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').textContent='LOCAL MODE · SAFE TO EXPLORE',2600)}
function openPanel(name){$$('.dock-app').forEach(b=>b.classList.toggle('active',b.dataset.panel===name));$$('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));}
function renderCrate(){const el=$('#crateList');el.innerHTML=crate.map((t,i)=>`<div class="crate-row" data-index="${i}"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${t.title}</strong><small>${t.artist} · ${t.bpm} BPM · ${t.key}</small></div><span>${t.bpm}</span></div>`).join('');$$('.crate-row').forEach(r=>r.onclick=()=>loadTrack(Number(r.dataset.index), 'A'));}
function loadTrack(i,deck){const t=crate[i];$(`#track${deck}`).textContent=`${t.title} · ${t.artist}`;notice(`DECK ${deck} · ${t.title} loaded from local crate`)}
function togglePlay(){playing=!playing;$$('.platter').forEach(p=>p.style.animationPlayState=playing?'running':'paused');notice(playing?'PLAYBACK PROTOTYPE · ENGINE READY':'PLAYBACK PAUSED')}
function action(a){if(a==='load-a')loadTrack(0,'A');if(a==='load-b')loadTrack(1,'B');if(a==='play')togglePlay();if(a==='cue')notice('CUE · browser prototype');if(a==='sync')notice('SYNC · external Mixxx engine boundary');if(a==='connect-at')notice('ATProto adapter ready · authentication not configured');if(a==='connect-plyr')notice('plyr.fm adapter ready · account connection not configured');if(a==='midi')notice('Web MIDI request is available only with compatible browser/device permissions');if(a==='audio')notice('Audio output selection requires a real device/browser permission flow');if(a==='stream')notice('Streamplace adapter prepared · no broadcast started')}
$$('.dock-app').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.panel)));
$$('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
$$('.close-panel').forEach(b=>b.addEventListener('click',()=>openPanel('deck')));
$('#connectionBtn').addEventListener('click',()=>notice('ATProto is intentionally disconnected in this prototype'));
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();togglePlay()}if(e.key==='Escape')openPanel('deck')});
setInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString([], {hour12:false}),1000);
setInterval(()=>{$('#meterL').style.width=`${25+Math.random()*65}%`,$('#meterR').style.width=`${25+Math.random()*65}%`},180);
renderCrate();
