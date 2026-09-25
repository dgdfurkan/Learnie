import {rememberPosition,rememberedPosition} from './playback.mjs';

/** Intent (saved sound) is separate from a browser-imposed muted fallback. */
export class YouTubeSession {
 constructor(player,{muted=true,volume=100,onSound=(_muted,_volume)=>{},onStatus=(_status)=>{},now=()=>Date.now()}={}){
  Object.assign(this,{player,onSound,onStatus,now,muted,volume});
  this.id='';this.loadedId='';this.active=false;this.played=false;this.retry=false;
  this.fallback=false;this.pendingSound=null;this.observed={muted,volume};
  this.state=-1;this.manualPause=false;this.startAttempt=0;this.loadingSince=0;
 }
 applySound(muted=this.muted,volume=this.volume){
  this.pendingSound={muted,volume,until:this.now()+1800};
  this.observed={muted,volume};
  this.player.setVolume(volume);
  if(muted)this.player.mute();else this.player.unMute();
 }
 setSoundPreference(muted,volume){
  if(this.muted===muted&&this.volume===volume)return;
  this.muted=muted;this.volume=volume;this.fallback=false;
  if(this.active)this.applySound();
 }
 sampleSound(){
  // A loading player's cached volume belongs to the old video. Read only a
  // settled player, including one paused by the user to adjust its volume.
  if(!this.active||!this.played||!this.matchesLoadedVideo())return;
  const muted=this.player.isMuted(),volume=this.player.getVolume();
  if(typeof muted!=='boolean'||!Number.isFinite(volume))return;
  if(this.pendingSound){
   const expected=this.pendingSound;
   if(muted===expected.muted&&volume===expected.volume)this.pendingSound=null;
   else if(expected.muted&&!muted){this.pendingSound=null;}
   else if(this.now()<expected.until)return;
   else{this.pendingSound=null;this.observed={muted,volume};return;}
  }
  if(muted===this.observed.muted&&volume===this.observed.volume)return;
  this.observed={muted,volume};this.muted=muted;this.volume=volume;
  this.fallback=false;this.onSound(muted,volume);
 }
 matchesLoadedVideo(){try{return new URL(this.player.getVideoUrl()).searchParams.get('v')===this.loadedId;}catch{return false;}}
 save(){if(this.loadedId&&this.played&&this.matchesLoadedVideo())rememberPosition(this.loadedId,this.player.getCurrentTime(),this.player.getDuration());}
 // Adopt the video already present in the iframe URL: never load it twice.
 adopt(id,active){
  this.id=id;this.loadedId=id;this.active=active;this.loadingSince=this.now();
  this.applySound();
  if(!active)this.player.pauseVideo();
  else this.onStatus('loading');
 }
 select(id,active){
  const changed=id!==this.id,wasActive=this.active;
  if(changed||wasActive!==active){this.sampleSound();this.save();}
  this.id=id;this.active=active;
  if(!active){if(wasActive)this.player.pauseVideo();return;}
  if(this.loadedId!==id){
   this.loadedId=id;this.played=false;this.retry=false;this.fallback=false;
   this.manualPause=false;this.state=-1;this.startAttempt=0;this.loadingSince=this.now();
   this.onStatus('loading');
   this.player.loadVideoById({videoId:id,startSeconds:rememberedPosition(id)});
   // YouTube can reset mute while loading. Reassert the user's intent AFTER
   // loading, rather than carrying a muted autoplay fallback to the next clip.
   this.applySound();
  }else if(!wasActive){
   this.retry=false;this.manualPause=false;this.loadingSince=this.now();this.startAttempt=0;
   this.applySound();this.player.playVideo();
  }
 }
 stateChanged(state){
  if(state===1&&!this.active){this.player.pauseVideo();return;}
  if(!this.matchesLoadedVideo())return;
  this.state=state;
  if(state===1){this.played=true;this.manualPause=false;}
  if(state===2&&this.played&&this.active)this.manualPause=true;
  this.onStatus(state===1?'playing':state===2?'paused':state===0?'ended':'loading');
  // Some mobile embeds report CUED after an autoplay request. This is not a
  // manual pause. Start once, without replacing the iframe or seeking again.
  if(state===5&&this.active&&!this.played&&!this.startAttempt){this.startAttempt++;this.player.playVideo();}
  if(state===1||state===2||state===0)this.sample();
 }
 autoplayBlocked(){
  if(!this.active||this.manualPause||!this.matchesLoadedVideo())return;
  if(this.retry){this.onStatus('blocked');return;}
  this.retry=true;this.fallback=true;
  this.applySound(true,this.volume);this.player.playVideo();
 }
 userGesture(){
  if(!this.active)return;
  if(this.fallback&&!this.muted){this.fallback=false;this.retry=false;this.applySound();this.player.playVideo();}
  else if(!this.played&&!this.manualPause)this.player.playVideo();
 }
 sample(){
  if(!this.active||!this.matchesLoadedVideo())return;
  this.sampleSound();this.save();
  // Bounded recovery for mobile players that emit no autoplay-blocked event.
  // Never restart a user-paused, buffering, ended or already-playing video.
  if(!this.played&&!this.manualPause&&[-1,5].includes(this.state)&&this.now()-this.loadingSince>1400&&!this.startAttempt){this.startAttempt++;this.player.playVideo();}
 }
 dispose(){this.sampleSound();this.save();this.active=false;this.player.pauseVideo();}
}
