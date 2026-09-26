import {rememberPosition,rememberedPosition} from './playback.mjs';

// YouTube IFrame API player states.
export const UNSTARTED=-1,ENDED=0,PLAYING=1,PAUSED=2,BUFFERING=3,CUED=5;
const SOUND_SETTLE=900,AUTOPLAY_WAIT=3500,RETRY_WAIT=3000,BUFFER_LIMIT=12000,SOUND_CHECK=1200,SOUND_WINDOW=2600,RESUME_LIMIT=1;

/**
 * One playback session for the single app-wide player.
 *
 * Browsers only allow sound after a user gesture. On iOS a gesture on the page
 * never reaches the cross-origin YouTube frame, so the only reliable unlock is
 * one tap inside that frame. The engine therefore:
 *  - starts every video with the saved sound choice,
 *  - detects a silent refusal (no PLAYING within a deadline) and retries muted,
 *  - detects a refused unmute (unexpected pause or still muted) and asks for a
 *    single tap that the UI lets through to the frame (`needsTap`).
 * Because the same frame is reused for every video, one such tap normally
 * unlocks sound for the rest of the session.
 */
export class PlaybackEngine {
 /** @param {any} player @param {{wantSound?:boolean,now?:()=>number,onChange?:(s:any)=>void,onSoundPreference?:(muted:boolean)=>void,onEnded?:(id:string)=>void,mutedUntilUnlocked?:boolean}} [options] */
 constructor(player,{wantSound=true,now=()=>Date.now(),onChange=()=>{},onSoundPreference=()=>{},onEnded=()=>{},mutedUntilUnlocked=false}={}){
  // Safari/iOS never autoplay with sound in a cross-origin frame before a tap
  // inside it. Starting muted there avoids a pointless wait for a refusal.
  this.mutedUntilUnlocked=mutedUntilUnlocked;
  this.player=player;this.now=now;this.onChange=onChange;this.onSoundPreference=onSoundPreference;this.onEnded=onEnded;
  this.id='';this.active=false;this.status='idle';this.error='';
  this.wantSound=wantSound;this.muted=!wantSound;this.needsTap=false;this.tapReason='';this.unlocked=false;
  this.held=false;this.played=false;this.mutedRetry=false;this.resumes=0;
  this.deadline=0;this.loadStarted=0;this.verifyAt=0;this.soundWindow=0;this.expectPause=0;this.soundAt=0;
 }

 snapshot(){return {id:this.id,active:this.active,status:this.status,error:this.error,muted:this.muted,wantSound:this.wantSound,needsTap:this.needsTap,tapReason:this.tapReason,held:this.held,unlocked:this.unlocked};}
 emit(){this.onChange(this.snapshot());}

 matchesLoaded(){
  try{const url=this.player.getVideoUrl();if(!url)return false;const u=new URL(url);return (u.searchParams.get('v')||u.pathname.split('/').pop())===this.id;}catch{return false;}
 }
 save(){
  // Right after loadVideoById the player still reports the previous video's
  // time. Only store a position that verifiably belongs to the current video.
  if(!this.id||!this.played||!this.matchesLoaded())return;
  try{rememberPosition(this.id,this.player.getCurrentTime(),this.player.getDuration());}catch{}
 }
 applySound(){
  this.soundAt=this.now();
  try{if(this.wantSound){this.player.unMute();this.player.setVolume(100);}else this.player.mute();}catch{}
  this.muted=!this.wantSound;
 }
 pause(){this.expectPause=this.now()+1500;try{this.player.pauseVideo();}catch{}}
 play(wait=AUTOPLAY_WAIT){
  // Before the frame is unlocked WebKit refuses to resume with sound, and the
  // video would just stay paused. Resume muted instead; sound needs the tap.
  if(this.mutedUntilUnlocked&&!this.unlocked&&!this.needsTap&&!this.muted){this.soundAt=this.now();try{this.player.mute();}catch{}this.muted=true;this.mutedRetry=true;}
  this.deadline=this.now()+wait;try{this.player.playVideo();}catch{}
 }

 /** Select the video the UI shows. Inactive means: keep it loaded but silent and paused. */
 select(id,active,{start}={}){
  if(!id)return;
  if(!active){
   if(this.active){this.save();this.pause();if(this.status==='playing')this.status='paused';}
   this.active=false;this.deadline=0;this.emit();return;
  }
  const wasActive=this.active;this.active=true;
  if(id!==this.id){this.load(id,start??rememberedPosition(id));return;}
  if(!wasActive&&!this.held&&!this.needsTap){this.resumes=0;this.play();}
  this.emit();
 }

 load(id,start=0){
  this.save();
  this.id=id;this.status='loading';this.error='';this.played=false;this.needsTap=false;this.tapReason='';
  this.mutedRetry=false;this.resumes=0;this.held=false;this.verifyAt=0;
  this.loadStarted=this.now();this.deadline=this.loadStarted+AUTOPLAY_WAIT;
  if(this.wantSound&&this.mutedUntilUnlocked&&!this.unlocked){this.soundAt=this.now();try{this.player.mute();}catch{}this.muted=true;this.mutedRetry=true;}
  else this.applySound();
  try{this.player.loadVideoById({videoId:id,startSeconds:start});}catch{this.fail('Oynatıcı bu videoyu açamadı.');return;}
  this.emit();
 }

 stateChanged(state){
  if(!this.id||!this.matchesLoaded())return;
  if(state===PLAYING){
   if(!this.active||this.held){this.pause();return;}
   if(this.needsTap)this.unlocked=true; // The only way to get here is a tap inside the frame.
   this.needsTap=false;this.tapReason='';this.status='playing';this.played=true;this.deadline=0;this.resumes=0;
   this.readMuted();
   if(this.wantSound&&this.muted&&(this.unlocked||!this.mutedRetry))this.requestSound();
   this.emit();return;
  }
  if(state===PAUSED){
   if(this.needsTap||this.held||!this.active){if(this.status==='playing')this.status='paused';this.emit();return;}
   if(this.now()<this.expectPause){this.status='paused';this.emit();return;}
   // Paused by the browser, typically an unmute without a gesture on iOS.
   if(this.now()<this.soundWindow){this.askForTap('sound');return;}
   if(this.resumes<RESUME_LIMIT){this.resumes++;this.play(RETRY_WAIT);return;}
   this.askForTap('play');return;
  }
  if(state===ENDED){
   this.onEnded(this.id);
   rememberPosition(this.id,0,0);
   if(this.active&&!this.held){try{this.player.seekTo(0,true);}catch{}this.play(RETRY_WAIT);}
   return;
  }
  if(state===BUFFERING&&this.status!=='playing'){this.status='loading';this.emit();}
 }

 readMuted(){if(this.now()-this.soundAt<SOUND_SETTLE)return;try{const m=this.player.isMuted();if(typeof m==='boolean')this.muted=m;}catch{}}

 /** Autoplay was refused. Retry once without sound, then ask for a tap. */
 blocked(){
  if(!this.active||this.status==='playing')return;
  if(this.now()<this.soundWindow){this.askForTap('sound');return;}
  if(!this.mutedRetry&&!this.muted){
   this.mutedRetry=true;this.muted=true;
   try{this.player.mute();}catch{}
   this.play(RETRY_WAIT);this.status='loading';this.emit();return;
  }
  this.askForTap('play');
 }

 /**
  * Pause and let the next tap reach the YouTube frame itself. That tap starts
  * playback inside the frame, which is a real user gesture there.
  */
 askForTap(reason){
  this.needsTap=true;this.tapReason=reason;this.status='needs-tap';this.deadline=0;this.verifyAt=0;this.soundWindow=0;
  this.pause();
  if(this.wantSound){try{this.player.unMute();this.player.setVolume(100);}catch{}this.muted=false;}
  this.emit();
 }

 requestSound(){
  this.wantSound=true;this.soundAt=this.now();
  try{this.player.unMute();this.player.setVolume(100);}catch{}
  this.muted=false;this.verifyAt=this.now()+SOUND_CHECK;this.soundWindow=this.now()+SOUND_WINDOW;
 }

 /** Called from a user tap on the Learnie UI. */
 toggleSound(){
  if(this.muted||!this.wantSound){
   this.onSoundPreference(false);
   // WebKit will refuse an API unmute until a tap inside the frame: ask for it directly.
   if(this.mutedUntilUnlocked&&!this.unlocked&&this.active&&this.id){this.wantSound=true;this.askForTap('sound');return;}
   this.requestSound();
   if(this.active&&!this.held&&!this.needsTap&&this.status!=='playing')this.play();
  }else{
   this.wantSound=false;this.onSoundPreference(true);this.verifyAt=0;this.soundWindow=0;this.soundAt=this.now();
   try{this.player.mute();}catch{}
   this.muted=true;
  }
  this.emit();
 }

 setSoundPreference(wantSound){
  if(this.wantSound===wantSound)return;
  this.wantSound=wantSound;
  if(this.active&&this.status==='playing'){if(wantSound)this.requestSound();else{try{this.player.mute();}catch{}this.muted=true;}}
  this.emit();
 }

 hold(on){
  if(this.held===on)return;
  this.held=on;
  if(on){this.save();this.pause();if(this.status==='playing')this.status='paused';}
  else if(this.active&&!this.needsTap){this.resumes=0;this.play();}
  this.emit();
 }

 /** Tap on the video: pause or resume (the same state a long press uses). */
 togglePause(){this.hold(!this.held);}

 seek(seconds){
  if(!this.id||!Number.isFinite(seconds))return;
  try{this.player.seekTo(Math.max(0,seconds),true);}catch{}
  rememberPosition(this.id,seconds,0);
  if(this.active&&!this.held&&!this.needsTap&&this.status!=='playing')this.play();
 }

 fail(message){this.status='error';this.error=message;this.deadline=0;this.needsTap=false;this.emit();}

 /** Poll at ~4 Hz: autoplay deadline, unmute verification and mute drift. */
 tick(){
  if(!this.id)return;
  const now=this.now();
  if(this.deadline&&now>=this.deadline&&this.active){
   let state;try{state=this.player.getPlayerState();}catch{}
   if(state===PLAYING&&this.matchesLoaded()){this.stateChanged(PLAYING);}
   else if(state===BUFFERING&&now-this.loadStarted<BUFFER_LIMIT){this.deadline=now+1000;}
   else{this.deadline=0;this.blocked();}
  }
  if(this.verifyAt&&now>=this.verifyAt){
   this.verifyAt=0;this.readMuted();
   if(this.active&&this.wantSound&&this.muted&&!this.needsTap)this.askForTap('sound');
  }
  if(this.status==='playing'){const before=this.muted;this.readMuted();if(before!==this.muted)this.emit();}
 }

 progress(){
  if(!this.id||!this.played)return {time:0,duration:0};
  try{return {time:this.player.getCurrentTime()||0,duration:this.player.getDuration()||0};}catch{return {time:0,duration:0};}
 }

 dispose(){this.save();this.active=false;this.deadline=0;}
}
