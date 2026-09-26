import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaybackEngine,PLAYING,PAUSED,BUFFERING,ENDED,UNSTARTED} from '../src/video-engine.mjs';
import {rememberPosition,rememberedPosition} from '../src/playback.mjs';

function harness({wantSound=true}={}){
 const clock={t:1000};const calls=[],prefs=[],changes=[];
 const p={id:'',state:UNSTARTED,muted:false,time:0,
  playVideo(){calls.push('play');},pauseVideo(){calls.push('pause');},
  loadVideoById({videoId,startSeconds}){calls.push(`load:${videoId}:${startSeconds}`);this.id=videoId;this.time=startSeconds;this.state=UNSTARTED;},
  mute(){calls.push('mute');this.muted=true;},unMute(){calls.push('unmute');this.muted=false;},setVolume(){},isMuted(){return this.muted;},
  getPlayerState(){return this.state;},getCurrentTime(){return this.time;},getDuration(){return 60;},seekTo(s){calls.push(`seek:${s}`);this.time=s;},
  getVideoUrl(){return this.id?`https://www.youtube.com/watch?v=${this.id}`:'';}};
 const e=new PlaybackEngine(p,{wantSound,now:()=>clock.t,onChange:s=>changes.push(s),onSoundPreference:m=>prefs.push(m)});
 const tick=ms=>{clock.t+=ms;e.tick();};
 return {p,e,calls,prefs,changes,clock,tick};
}

test('a visible video loads once with the saved sound choice and plays',()=>{
 const {p,e,calls}=harness();e.select('a',true);
 assert.deepEqual(calls,['unmute','load:a:0']);
 p.state=PLAYING;e.stateChanged(PLAYING);
 assert.equal(e.status,'playing');assert.equal(e.muted,false);
 e.select('a',true);assert.equal(calls.filter(c=>c.startsWith('load')).length,1,'rerenders never reload');
});

test('silent autoplay refusal falls back to muted playback instead of a dead frame',()=>{
 const {p,e,calls,tick}=harness();e.select('b',true);
 tick(3600);
 assert.ok(calls.includes('mute'));assert.equal(calls.at(-1),'play');assert.equal(e.muted,true);assert.equal(e.needsTap,false);
 p.state=PLAYING;e.stateChanged(PLAYING);assert.equal(e.status,'playing');assert.equal(e.wantSound,true,'a browser mute is not a user choice');
});

test('when even muted playback is refused the UI asks for one tap inside the frame',()=>{
 const {e,tick}=harness();e.select('c',true);
 tick(3600);tick(3100);
 assert.equal(e.needsTap,true);assert.equal(e.tapReason,'play');assert.equal(e.status,'needs-tap');
});

test('slow networks keep buffering without being treated as blocked',()=>{
 const {p,e,tick}=harness();e.select('slow',true);p.state=BUFFERING;
 tick(3600);tick(1100);tick(1100);
 assert.equal(e.needsTap,false);assert.equal(e.muted,false);
 p.state=PLAYING;tick(1100);assert.equal(e.status,'playing');
});

test('an unmute the browser refuses (iOS pause) becomes a tap request, and that tap unlocks later videos',()=>{
 const {p,e,calls,prefs,tick}=harness();e.select('d',true);tick(3600);
 p.state=PLAYING;e.stateChanged(PLAYING);assert.equal(e.muted,true);
 e.toggleSound();assert.deepEqual(prefs,[false]);assert.equal(e.muted,false);
 p.state=PAUSED;e.stateChanged(PAUSED);
 assert.equal(e.needsTap,true);assert.equal(e.tapReason,'sound');assert.equal(p.muted,false,'frame is left unmuted for the tap');
 p.state=PLAYING;e.stateChanged(PLAYING);
 assert.equal(e.needsTap,false);assert.equal(e.unlocked,true);assert.equal(e.muted,false);
 calls.length=0;e.select('e',true);assert.deepEqual(calls,['unmute','load:e:0']);
});

test('a refused unmute that silently stays muted is also detected',()=>{
 const {p,e,tick}=harness({wantSound:false});e.select('f',true);p.state=PLAYING;e.stateChanged(PLAYING);
 p.unMute=function(){};p.muted=true;e.toggleSound();
 tick(1300);assert.equal(e.needsTap,true);assert.equal(e.tapReason,'sound');
});

test('muting is immediate and remembered as a preference',()=>{
 const {p,e,prefs}=harness();e.select('g',true);p.state=PLAYING;e.stateChanged(PLAYING);
 e.toggleSound();assert.deepEqual(prefs,[true]);assert.equal(p.muted,true);assert.equal(e.wantSound,false);
});

test('hold pauses without triggering the blocked logic; release resumes once',()=>{
 const {p,e,calls,tick}=harness();e.select('h',true);p.state=PLAYING;e.stateChanged(PLAYING);
 e.hold(true);p.state=PAUSED;e.stateChanged(PAUSED);assert.equal(e.needsTap,false);assert.equal(e.status,'paused');
 tick(5000);assert.equal(e.needsTap,false);
 calls.length=0;e.hold(false);assert.deepEqual(calls,['play']);
});

test('leaving a video pauses it and remembers the position; stale events of the old video are ignored',()=>{
 const {p,e}=harness();e.select('i',true);p.state=PLAYING;e.stateChanged(PLAYING);p.time=21;
 rememberPosition('j',9,60);
 p.loadVideoById=function({videoId,startSeconds}){this.pendingId=videoId;this.pendingStart=startSeconds;};
 e.select('j',true);assert.equal(rememberedPosition('i'),21);assert.equal(p.pendingStart,9);
 e.stateChanged(PLAYING);assert.equal(e.status,'loading','PLAYING from the previous video does not count');
});

test('an inactive stage never autoplays; late PLAYING is paused',()=>{
 const {p,e,calls,tick}=harness();e.select('k',true);e.select('k',false);
 tick(8000);assert.equal(e.needsTap,false);
 p.state=PLAYING;e.stateChanged(PLAYING);assert.equal(calls.at(-1),'pause');
});

test('short videos loop like Reels',()=>{
 const {p,e,calls}=harness();e.select('l',true);p.state=PLAYING;e.stateChanged(PLAYING);
 e.stateChanged(ENDED);assert.deepEqual(calls.slice(-2),['seek:0','play']);
});

test('WebKit starts muted until the frame is unlocked, then plays with sound',()=>{
 const clock={t:0};const calls=[];
 const p={id:'',muted:false,playVideo(){calls.push('play');},pauseVideo(){calls.push('pause');},loadVideoById({videoId}){calls.push(`load:${videoId}`);this.id=videoId;},mute(){calls.push('mute');this.muted=true;},unMute(){calls.push('unmute');this.muted=false;},setVolume(){},isMuted(){return this.muted;},getPlayerState(){return UNSTARTED;},getCurrentTime(){return 0;},getDuration(){return 30;},seekTo(){},getVideoUrl(){return `https://www.youtube.com/watch?v=${this.id}`;}};
 const e=new PlaybackEngine(p,{now:()=>clock.t,mutedUntilUnlocked:true});
 e.select('w1',true);assert.deepEqual(calls,['mute','load:w1']);assert.equal(e.muted,true);assert.equal(e.wantSound,true);
 e.stateChanged(PLAYING);assert.equal(e.status,'playing');assert.equal(e.muted,true,'no unmute attempt before unlock');
 e.toggleSound();assert.equal(e.needsTap,true,'goes straight to a tap inside the frame');assert.equal(p.muted,false);
 e.stateChanged(PAUSED);assert.equal(e.needsTap,true);
 e.stateChanged(PLAYING);assert.equal(e.unlocked,true);
 calls.length=0;e.select('w2',true);assert.deepEqual(calls,['unmute','load:w2']);
});
