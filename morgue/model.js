/* Ephemeral rehearsal state. Ink story and character transport are separate. */
(function(root){
 'use strict';
 const cues={Violet:'Violet cue: bring the three case files into view. The exit remains locked until the route is complete.',Mortis:'Mortis cue: pause at the threshold and offer the participant a choice to continue or leave.',Pennywise:'Pennywise reference cue: mark a pursuit beat. No third-party dialogue, artwork, or voice is included.'};
 class Session {
  constructor(Story,source){this.Story=Story;this.source=source;this.reset();}
  reset(){this.status='ready';this.story=null;this.lines=[];this.choices=[];this.outcome=null;this.pending=null;this.message=null;this.events=[];}
  log(text){this.events.push({text,time:new Date().toISOString()});}
  start(){if(this.status!=='ready')throw Error('Reset before starting again');this.story=new this.Story(this.source);this.status='running';this.log('Operator started a local demo; simulated participant arrived.');this.advance();}
  advance(){this.lines=[];this.outcome=null;while(this.story.canContinue){const text=this.story.Continue().trim();if(text)this.lines.push(text);for(const tag of this.story.currentTags||[])if(tag.startsWith('outcome:'))this.outcome=tag.slice(8).trim();}this.choices=this.story.currentChoices.map(c=>({index:c.index,text:c.text}));if(this.outcome)this.log('Simulated participant outcome: '+this.outcome);else this.log('Ink scene released: '+this.lines[0]);if(this.outcome==='exit'){this.status='ended';this.pending=null;}}
  choose(index){this.requireRunning();if(!this.choices.some(c=>c.index===index))throw Error('Invalid choice');this.log('Simulated participant chose: '+this.choices.find(c=>c.index===index).text);this.story.ChooseChoiceIndex(index);this.advance();}
  requireRunning(){if(this.status!=='running')throw Error('Session is not running');}
  pause(){this.requireRunning();this.status='paused';this.pending=null;this.log('Operator paused; choices and cues blocked.');}
  resume(){if(this.status!=='paused')throw Error('Session is not paused');this.status='running';this.log('Operator resumed.');}
  end(){if(!['running','paused'].includes(this.status))throw Error('No active session');this.status='ended';this.pending=null;this.log('Operator ended session; participant controls stopped.');}
  leave(){if(!['running','paused'].includes(this.status))throw Error('No active session');this.status='ended';this.pending=null;this.outcome='exit';this.lines=['The participant left the experience.'];this.choices=[];this.message=null;this.log('Simulated participant left; no invitation revealed.');}
  preview(character){this.requireRunning();if(!cues[character])throw Error('Unknown character');this.pending={character,text:cues[character]};return this.pending;}
  release(){this.requireRunning();if(!this.pending)throw Error('Preview a cue first');this.message={...this.pending};this.log('Operator approved and released '+this.pending.character+' draft cue into local preview.');this.pending=null;}
  get rewardVisible(){return this.status==='running'&&this.outcome==='win';}
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=Session;else root.MorgueSession=Session;
})(typeof window!=='undefined'?window:globalThis);
