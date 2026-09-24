import {rememberPosition,rememberedPosition} from './playback.mjs';

/** One playback session, independent of React renders and provider UI clicks. */
export class YouTubeSession {
 constructor(player,{muted=true,volume=100,onSound=(_muted,_volume)=>{},onStatus=(_status)=>{}}={}){
  this.player=player;
  this.onSound=onSound;
  this.onStatus=onStatus;
  this.id='';this.loadedId='';this.active=false;this.played=false;this.retry=false;
  this.muted=muted;this.volume=volume;
  this.observed={muted,volume};this.pendingSound=null;
  this.applySound(muted,volume);
 }

 applySound(muted,volume){
  // Commands are asynchronous. Do not mistake the old cached response
  // for a new choice made through YouTube's native volume control.
  this.pendingSound={muted,volume,until:Date.now()+1500};
  this.observed={muted,volume};
  this.player.setVolume(volume);
  if(muted)this.player.mute();else this.player.unMute();
 }

 setSoundPreference(muted,volume){
  if(this.muted===muted&&this.volume===volume)return;
  this.muted=muted;this.volume=volume;
  this.applySound(muted,volume);
 }

 sampleSound(){
  if(!this.active)return;
  const muted=this.player.isMuted(),volume=this.player.getVolume();
  if(typeof muted!=='boolean'||!Number.isFinite(volume))return;
  if(this.pendingSound){
   const expected=this.pendingSound;
   if(muted===expected.muted&&volume===expected.volume)this.pendingSound=null;
   else if(Date.now()<expected.until)return;
   else{this.pendingSound=null;this.observed={muted,volume};return;}
  }
  if(muted===this.observed.muted&&volume===this.observed.volume)return;
  this.observed={muted,volume};this.muted=muted;this.volume=volume;
  this.onSound(muted,volume);
 }

 matchesLoadedVideo(){
  try{return new URL(this.player.getVideoUrl()).searchParams.get('v')===this.loadedId;}catch{return false;}
 }

 save(){
  // loadVideoById briefly exposes the previous video's cached time. Never
  // store it under the next ID or erase a restored position with initial 0.
  if(!this.loadedId||!this.matchesLoadedVideo())return;
  const seconds=this.player.getCurrentTime();
  if(this.played)rememberPosition(this.loadedId,seconds,this.player.getDuration());
 }

 select(id,active){
  const changed=id!==this.id,wasActive=this.active;
  if(changed||wasActive!==active){this.sampleSound();this.save();}
  this.id=id;this.active=active;
  if(!active){if(wasActive)this.player.pauseVideo();return;}
  if(this.loadedId!==id){
   this.loadedId=id;this.played=false;this.retry=false;
   this.onStatus('loading');
   // loadVideoById already starts playback. Extra play/pause/seek commands
   // here introduce races and the apparent second start seen on mobile.
   this.player.loadVideoById({videoId:id,startSeconds:rememberedPosition(id)});
  }else if(!wasActive){
   this.retry=false;
   this.player.playVideo();
  }
 }

 stateChanged(state){
  if(state===1&&!this.active){this.player.pauseVideo();return;}
  if(!this.matchesLoadedVideo())return;
  if(state===1)this.played=true;
  this.onStatus(state===1?'playing':state===2?'paused':state===0?'ended':'loading');
  if(state===1||state===2||state===0)this.sample();
 }

 autoplayBlocked(){
  if(!this.active)return;
  if(this.retry){this.onStatus('blocked');return;}
  this.retry=true;
  // A browser-imposed mute is not a new preference. A later unmute through
  // the native control is observed and persisted without rebuilding the iframe.
  this.applySound(true,this.volume);
  this.player.playVideo();
 }

 sample(){
  if(!this.active||!this.matchesLoadedVideo())return;
  this.sampleSound();this.save();
 }

 dispose(){this.sampleSound();this.save();this.active=false;}
}
