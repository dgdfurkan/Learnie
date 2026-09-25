import test from 'node:test';
import assert from 'node:assert/strict';
import {YouTubeSession} from '../src/youtube-session.mjs';
import {rememberPosition,rememberedPosition} from '../src/playback.mjs';

function harness(options={}){
 const calls=[],sounds=[],statuses=[];
 const p={id:'',time:0,muted:false,volume:100,
  playVideo(){calls.push(['play']);},pauseVideo(){calls.push(['pause']);},
  loadVideoById({videoId,startSeconds}){calls.push(['load',videoId,startSeconds]);this.id=videoId;this.time=startSeconds;},
  mute(){calls.push(['mute']);this.muted=true;},unMute(){calls.push(['unmute']);this.muted=false;},
  setVolume(v){calls.push(['volume',v]);this.volume=v;},getVolume(){return this.volume;},isMuted(){return this.muted;},
  getCurrentTime(){return this.time;},getDuration(){return 100;},getVideoUrl(){return this.id?`https://www.youtube.com/watch?v=${this.id}`:'';}
 };
 const s=new YouTubeSession(p,{onSound:(...value)=>sounds.push(value),onStatus:value=>statuses.push(value),...options});
 return {p,s,calls,sounds,statuses};
}

test('visible video starts once automatically; rerenders do not restart a manually paused video',()=>{
 const {s,calls}=harness();s.select('startup',true);s.stateChanged(1);
 assert.deepEqual(calls.filter(c=>['load','play','pause'].includes(c[0])),[['load','startup',0]]);
 s.stateChanged(2);s.select('startup',true);s.sample();
 assert.equal(calls.filter(c=>c[0]==='load'||c[0]==='play').length,1);
});

test('native unmute and volume survive successive videos without mute commands',()=>{
 const {s,p,calls,sounds}=harness();s.select('sound-a',true);s.stateChanged(1);
 p.muted=false;p.volume=63;s.sample();
 assert.deepEqual(sounds,[[false,63]]);
 const before=calls.length;
 s.setSoundPreference(false,63);s.select('sound-b',true);s.stateChanged(1);s.select('sound-c',true);
 assert.deepEqual(calls.slice(before).filter(c=>c[0]==='load'||c[0]==='play'),[['load','sound-b',0],['load','sound-c',0]]);
 assert.ok(!calls.slice(before).some(c=>c[0]==='mute'));
 assert.equal(p.muted,false);assert.equal(p.volume,63);
});

test('a native sound change immediately before next is captured without waiting for the poll',()=>{
 const {s,p,sounds}=harness();s.select('fast-a',true);s.stateChanged(1);
 p.muted=false;s.select('fast-b',true);
 assert.deepEqual(sounds,[[false,100]]);assert.equal(p.muted,false);
});

test('eye/comments rerenders issue no media commands; scroll-away pauses and return resumes once',()=>{
 const {s,p,calls}=harness();s.select('resume-a',true);s.stateChanged(1);p.time=24;
 const before=calls.length;s.select('resume-a',true);s.select('resume-a',true);
 assert.equal(calls.length,before);
 s.select('resume-a',false);s.select('resume-a',false);s.select('resume-a',true);
 assert.deepEqual(calls.slice(before).filter(c=>['play','pause','load'].includes(c[0])),[['pause'],['play']]);
 assert.equal(rememberedPosition('resume-a'),24);
 s.select('resume-b',true);s.stateChanged(1);p.time=7;s.select('resume-a',true);
 assert.deepEqual(calls.filter(c=>c[0]==='load').at(-1),['load','resume-a',24]);assert.equal(rememberedPosition('resume-b'),7);
});

test('blocked sound retries muted once without overwriting the user sound preference',()=>{
 const {s,p,sounds,calls,statuses}=harness({muted:false,volume:80});s.select('blocked-a',true);
 s.autoplayBlocked();s.stateChanged(1);s.sample();
 assert.equal(p.muted,true);assert.deepEqual(sounds,[]);assert.equal(s.muted,false);
 const before=calls.length;s.autoplayBlocked();
 assert.equal(calls.length,before);assert.equal(statuses.at(-1),'blocked');
 p.muted=false;s.sample();assert.deepEqual(sounds,[[false,80]]);
 s.select('blocked-b',true);assert.equal(p.muted,false);
});

test('inactive videos do not load or retry; late playback is stopped',()=>{
 const {s,calls}=harness();s.select('hidden-a',false);s.autoplayBlocked();
 assert.equal(calls.filter(c=>c[0]==='load'||c[0]==='play').length,0);
 s.select('hidden-a',true);s.select('hidden-a',false);s.stateChanged(1);
 assert.equal(calls.at(-1)[0],'pause');
});

test('async old video events cannot overwrite the next video resume position',()=>{
 const {s,p}=harness();s.select('race-a',true);s.stateChanged(1);p.time=37;
 rememberPosition('race-b',18,100);
 p.loadVideoById=()=>{};s.select('race-b',true);s.stateChanged(2);s.sample();
 assert.equal(rememberedPosition('race-a'),37);assert.equal(rememberedPosition('race-b'),18);
 p.id='race-b';p.time=0;s.sample();assert.equal(rememberedPosition('race-b'),18);
});

test('programmatic volume acknowledgement is not recorded as a user change',()=>{
 const {s,p,sounds}=harness({muted:false,volume:55});s.select('ack',true);s.stateChanged(1);
 assert.deepEqual(sounds,[]);
 s.setSoundPreference(true,20);s.sample();assert.deepEqual(sounds,[]);
 p.volume=0;s.sample();assert.deepEqual(sounds,[[true,0]]);
});


test('loading resets native mute but saved audible intent is reapplied after each load',()=>{
 const {s,p,calls,sounds}=harness({muted:false,volume:71});
 const load=p.loadVideoById.bind(p);p.loadVideoById=args=>{load(args);p.muted=true;};
 s.select('reset-a',true);s.stateChanged(1);s.select('reset-b',true);s.stateChanged(1);
 assert.equal(p.muted,false);assert.equal(p.volume,71);assert.deepEqual(sounds,[]);
 assert.equal(calls.filter(c=>c[0]==='load').length,2);
});
test('a temporary muted fallback is not inherited by the following video',()=>{
 const {s,p,sounds}=harness({muted:false});s.select('temporary-a',true);s.autoplayBlocked();s.stateChanged(1);
 assert.equal(p.muted,true);s.select('temporary-b',true);assert.equal(p.muted,false);assert.deepEqual(sounds,[]);
});
test('native unmute before the first sound acknowledgement is persisted',()=>{
 const {s,p,sounds}=harness({muted:true});s.select('quick-unmute',true);p.muted=false;s.stateChanged(1);
 assert.deepEqual(sounds,[[false,100]]);s.select('quick-next',true);assert.equal(p.muted,false);
});
test('an initial URL video is adopted without a redundant load and CUED recovers once',()=>{
 const {s,p,calls}=harness({muted:false});p.id='initial-url';s.adopt('initial-url',true);s.select('initial-url',true);
 assert.equal(calls.filter(c=>c[0]==='load').length,0);
 s.stateChanged(5);s.stateChanged(5);assert.equal(calls.filter(c=>c[0]==='play').length,1);
 s.stateChanged(1);s.stateChanged(2);s.sample();s.select('initial-url',true);
 assert.equal(calls.filter(c=>c[0]==='play').length,1);
});
test('a navigation gesture recovers audible fallback without changing the preference',()=>{
 const {s,p,sounds}=harness({muted:false});s.select('gesture-a',true);s.autoplayBlocked();s.stateChanged(1);
 s.userGesture();assert.equal(p.muted,false);assert.deepEqual(sounds,[]);
});
test('a disposed player cannot continue producing background sound',()=>{
 const {s,calls}=harness();s.select('dispose-a',true);s.stateChanged(1);s.dispose();assert.equal(calls.at(-1)[0],'pause');
});
