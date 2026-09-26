import {createContext,useContext,useEffect,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import {PlaybackEngine,UNSTARTED,ENDED,PLAYING,PAUSED,BUFFERING} from './video-engine.mjs';
import {youtubeOptions} from './youtube.mjs';
import {usePreferences} from './Preferences';
import type {Post} from './types';

type Video=NonNullable<Post['video']>;
type Adapter={playVideo:()=>void;pauseVideo:()=>void;loadVideoById:(v:{videoId:string;startSeconds:number})=>void;mute:()=>void;unMute:()=>void;isMuted:()=>boolean;setVolume:(v:number)=>void;getPlayerState:()=>number;getCurrentTime:()=>number;getDuration:()=>number;getVideoUrl:()=>string;seekTo:(s:number,a:boolean)=>void};
type YTPlayer=Adapter&{getIframe:()=>HTMLIFrameElement;destroy:()=>void};
type YouTubeApi={Player:new(host:HTMLElement,options:Record<string,unknown>)=>YTPlayer};
declare global{interface Window{YT?:YouTubeApi;onYouTubeIframeAPIReady?:()=>void;}}

let apiPromise:Promise<YouTubeApi>|undefined;
function loadApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise<YouTubeApi>((resolve,reject)=>{
  const script=document.createElement('script');let settled=false;
  const fail=()=>{if(settled)return;settled=true;clearTimeout(timer);script.remove();apiPromise=undefined;reject(new Error('YouTube yüklenemedi.'));};
  const timer=window.setTimeout(fail,15000);
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{previous?.();if(settled||!window.YT?.Player)return;settled=true;clearTimeout(timer);resolve(window.YT);};
  script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=fail;document.head.appendChild(script);
 });
 return apiPromise;
}
/** Warm the API script while the user is still in the feed. */
export function preloadVideoApi(){loadApi().catch(()=>{});}

const idle:Adapter={playVideo(){},pauseVideo(){},loadVideoById(){},mute(){},unMute(){},isMuted:()=>false,setVolume(){},getPlayerState:()=>UNSTARTED,getCurrentTime:()=>0,getDuration:()=>0,getVideoUrl:()=>'',seekTo(){}};

/** A plain <video> behind the same interface, for the few self-hosted files. */
function fileAdapter(el:HTMLVideoElement,engine:()=>PlaybackEngine):Adapter{
 let current='';
 const start=()=>{void el.play().catch(e=>{if((e as Error).name==='NotAllowedError')engine().blocked();});};
 const state=()=>el.ended?ENDED:el.paused?PAUSED:el.readyState<3?BUFFERING:PLAYING;
 el.onplaying=()=>engine().stateChanged(PLAYING);el.onpause=()=>{if(!el.ended)engine().stateChanged(PAUSED);};
 el.onended=()=>engine().stateChanged(ENDED);el.onwaiting=()=>engine().stateChanged(BUFFERING);
 el.onerror=()=>{if(current)engine().fail('Bu video şu an açılamıyor.');};
 return {playVideo:start,pauseVideo:()=>el.pause(),loadVideoById:({videoId,startSeconds})=>{current=videoId;el.src=videoId;try{el.currentTime=startSeconds||0;}catch{}start();},mute:()=>{el.muted=true;},unMute:()=>{el.muted=false;},isMuted:()=>el.muted,setVolume:v=>{el.volume=Math.max(0,Math.min(1,v/100));},getPlayerState:state,getCurrentTime:()=>el.currentTime||0,getDuration:()=>Number.isFinite(el.duration)?el.duration:0,getVideoUrl:()=>current?`https://learnie.local/?v=${encodeURIComponent(current)}`:'',seekTo:s=>{el.currentTime=s;}};
}

/** WebKit (all iOS browsers and desktop Safari) needs a gesture inside the frame for sound. */
function strictAutoplay(){const ua=navigator.userAgent;return /iP(hone|ad|od)/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)||(/Safari\//.test(ua)&&!/Chrom(e|ium)|Android|Edg\//.test(ua));}

export type StageState={open:boolean;id:string;active:boolean;status:string;error:string;muted:boolean;wantSound:boolean;needsTap:boolean;tapReason:string;held:boolean;unlocked:boolean;orientation:'portrait'|'landscape'};

class Stage {
 state:StageState;listeners=new Set<()=>void>();engine:PlaybackEngine;
 ytHost:HTMLDivElement|null=null;fileEl:HTMLVideoElement|null=null;
 yt:YTPlayer|null=null;ytReady=false;creating=false;file:Adapter|null=null;
 requested:{video:Video;active:boolean}|null=null;timer=0;onSoundPreference:(muted:boolean)=>void;
 constructor(wantSound:boolean,onSoundPreference:(muted:boolean)=>void){
  this.onSoundPreference=onSoundPreference;
  this.engine=new PlaybackEngine(idle,{wantSound,mutedUntilUnlocked:strictAutoplay(),onChange:s=>this.set(s),onSoundPreference:m=>this.onSoundPreference(m)});
  this.state={...this.engine.snapshot(),open:false,orientation:'portrait'};
 }
 set(patch:Partial<StageState>){this.state={...this.state,...patch};this.listeners.forEach(fn=>fn());}
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 getSnapshot=()=>this.state;
 attach(ytHost:HTMLDivElement|null,fileEl:HTMLVideoElement|null){this.ytHost=ytHost;this.fileEl=fileEl;}

 setOpen(open:boolean){
  if(this.state.open===open)return;
  if(!open){this.engine.select(this.engine.id,false);this.requested=null;clearInterval(this.timer);this.timer=0;}
  else if(!this.timer)this.timer=window.setInterval(()=>this.engine.tick(),250);
  this.set({open});
 }

 private createYouTube(){
  if(this.creating||!this.ytHost)return;
  this.creating=true;
  loadApi().then(api=>{
   if(!this.ytHost)return;
   const mount=document.createElement('div');this.ytHost.replaceChildren(mount);
   const player=new api.Player(mount,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',playerVars:youtubeOptions(location.origin),events:{
    onReady:()=>{this.yt=player;this.ytReady=true;try{player.getIframe().setAttribute('title','Learnie video oynatıcısı');}catch{}if(this.requested)this.play(this.requested.video,this.requested.active);},
    onStateChange:(e:{data:number})=>{if(this.engine.player===player)this.engine.stateChanged(e.data);},
    onAutoplayBlocked:()=>{if(this.engine.player===player)this.engine.blocked();},
    onError:(e:{data:number})=>{if(this.engine.player===player)this.engine.fail(e.data===101||e.data===150?'Yayıncı bu videonun başka sitelerde oynatılmasına şu an izin vermiyor.':'Bu video şu an açılamıyor.');}
   }});
  }).catch(()=>{this.creating=false;this.engine.id='';this.set({status:'error',error:'YouTube oynatıcısına bağlanılamadı. Bağlantını kontrol edebilirsin.'});});
 }

 play(video:Video|undefined,active:boolean){
  if(!video){this.requested=null;this.engine.select(this.engine.id,false);return;}
  this.requested={video,active};
  const orientation=video.orientation==='landscape'?'landscape':'portrait';
  if(orientation!==this.state.orientation)this.set({orientation});
  let adapter:Adapter;
  if(video.kind==='file'){
   if(!this.fileEl)return;
   this.file??=fileAdapter(this.fileEl,()=>this.engine);adapter=this.file;
  }else{
   if(!this.ytReady||!this.yt){
    this.createYouTube();
    if(this.state.id!==video.url||this.state.status!=='loading')this.set({id:video.url,status:'loading',error:'',needsTap:false});
    return;
   }
   adapter=this.yt;
  }
  if(this.engine.player!==adapter){
   try{this.engine.player.pauseVideo();}catch{}
   this.engine.save();this.engine.player=adapter;this.engine.id='';
  }
  this.engine.select(video.url,active);
 }
 toggleSound(){this.engine.toggleSound();}
 hold(on:boolean){this.engine.hold(on);}
 progress(){return this.engine.progress();}
 setWantSound(want:boolean){this.engine.setSoundPreference(want);}
 visibility(hidden:boolean){
  if(!this.state.open||!this.requested)return;
  if(hidden)this.engine.select(this.engine.id,false);else this.play(this.requested.video,this.requested.active);
 }
}

const StageContext=createContext<Stage|null>(null);

export function VideoStageProvider({children}:{children:ReactNode}){
 const {prefs,setPrefs}=usePreferences();
 const setRef=useRef(setPrefs);setRef.current=setPrefs;
 const [stage]=useState(()=>new Stage(!prefs.videoMuted,muted=>setRef.current({videoMuted:muted})));
 if(import.meta.env.DEV)(window as unknown as {__learnieStage:Stage}).__learnieStage=stage;
 const ytHost=useRef<HTMLDivElement>(null),fileEl=useRef<HTMLVideoElement>(null);
 const state=useSyncExternalStore(stage.subscribe,stage.getSnapshot);
 useEffect(()=>{stage.attach(ytHost.current,fileEl.current);},[stage]);
 useEffect(()=>{stage.setWantSound(!prefs.videoMuted);},[stage,prefs.videoMuted]);
 useEffect(()=>{const change=()=>stage.visibility(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[stage]);
 return <StageContext.Provider value={stage}>{children}
  <div className="video-stage" data-open={state.open} data-orientation={state.orientation} data-status={state.status} data-needs-tap={state.needsTap||undefined}>
   <div className="video-stage-column"><div className="video-stage-frame"><div className="video-stage-youtube" ref={ytHost}/><video className="video-stage-file" ref={fileEl} playsInline preload="none"/></div></div>
  </div>
 </StageContext.Provider>;
}

export function useVideoStage(){
 const stage=useContext(StageContext);
 if(!stage)throw new Error('VideoStageProvider eksik.');
 const state=useSyncExternalStore(stage.subscribe,stage.getSnapshot);
 return {stage,state};
}
