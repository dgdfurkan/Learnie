import {createContext,useContext,useEffect,useRef,useState,useSyncExternalStore,type ReactNode,type RefObject} from 'react';
import {Volume2,VolumeX,Maximize2,Play} from 'lucide-react';
import {VideoPoster} from './VideoPoster';
import {PlaybackEngine,UNSTARTED,ENDED,PLAYING,PAUSED,BUFFERING} from './video-engine.mjs';
import {youtubeOptions} from './youtube.mjs';
import {usePreferences} from './Preferences';
import type {Post} from './types';

type Video=NonNullable<Post['video']>;
type Adapter={playVideo:()=>void;pauseVideo:()=>void;loadVideoById:(v:{videoId:string;startSeconds:number})=>void;mute:()=>void;unMute:()=>void;isMuted:()=>boolean;setVolume:(v:number)=>void;getPlayerState:()=>number;getCurrentTime:()=>number;getDuration:()=>number;getVideoUrl:()=>string;seekTo:(s:number,a:boolean)=>void};
type YTPlayer=Adapter&{getIframe:()=>HTMLIFrameElement;destroy:()=>void;loadModule?:(m:string)=>void;unloadModule?:(m:string)=>void;getOption?:(m:string,o:string)=>unknown;setOption?:(m:string,o:string,v:unknown)=>void};
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

export type StageMode='hidden'|'reels'|'inline';
export type StageState={mode:StageMode;id:string;active:boolean;status:string;error:string;muted:boolean;wantSound:boolean;needsTap:boolean;tapReason:string;held:boolean;unlocked:boolean;orientation:'portrait'|'landscape';inlinePost:Post|null;captions:boolean};
type Slot={el:HTMLElement;post:Post;onExpand:()=>void};

/**
 * The single player for the whole app. It lives in one DOM node for the whole
 * session (moving an iframe would reload it and lose the iOS sound unlock) and
 * is either full screen under Reels, laid over the feed card that is most in
 * view, or hidden.
 */
class Stage {
 state:StageState;listeners=new Set<()=>void>();engine:PlaybackEngine;
 host:HTMLDivElement|null=null;column:HTMLDivElement|null=null;ytHost:HTMLDivElement|null=null;fileEl:HTMLVideoElement|null=null;
 yt:YTPlayer|null=null;ytReady=false;creating=false;file:Adapter|null=null;
 requested:{video:Video;active:boolean}|null=null;timer=0;onSoundPreference:(muted:boolean)=>void;
 reels=false;inlineAllowed=false;slots=new Map<symbol,Slot>();inlineKey:symbol|null=null;frame=0;captionsFor='';
 constructor(wantSound:boolean,captions:boolean,onSoundPreference:(muted:boolean)=>void){
  this.onSoundPreference=onSoundPreference;
  this.engine=new PlaybackEngine(idle,{wantSound,mutedUntilUnlocked:strictAutoplay(),onChange:s=>this.set(s),onSoundPreference:m=>this.onSoundPreference(m)});
  this.state={...this.engine.snapshot(),mode:'hidden',orientation:'portrait',inlinePost:null,captions};
 }
 set(patch:Partial<StageState>){
  this.state={...this.state,...patch};this.listeners.forEach(fn=>fn());
  if(this.state.status==='playing'&&this.captionsFor!==this.state.id){this.captionsFor=this.state.id;this.applyCaptions();setTimeout(()=>this.applyCaptions(),900);}
 }
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 getSnapshot=()=>this.state;
 attach(host:HTMLDivElement|null,column:HTMLDivElement|null,ytHost:HTMLDivElement|null,fileEl:HTMLVideoElement|null){this.host=host;this.column=column;this.ytHost=ytHost;this.fileEl=fileEl;}

 private setMode(mode:StageMode){
  if(this.state.mode===mode)return;
  if(mode==='hidden'){this.engine.select(this.engine.id,false);this.requested=null;}
  if(mode==='hidden'){clearInterval(this.timer);this.timer=0;}else if(!this.timer)this.timer=window.setInterval(()=>{this.engine.tick();if(this.state.mode==='inline')this.place();},250);
  if(mode!=='reels')this.setOffset(0,0);
  if(mode!=='inline'&&this.host){const st=this.host.style;st.top=st.left=st.width=st.height='';}
  this.set({mode});
 }

 // ----- Reels -----
 enterReels(){this.reels=true;this.inlineKey=null;this.set({inlinePost:null});this.setMode('reels');}
 leaveReels(){this.reels=false;this.setMode('hidden');this.schedule();}
 /** Keep the video glued to its slide while the user drags between reels. */
 setOffset(y:number,ms:number){const c=this.column;if(!c)return;c.style.transitionDuration=`${ms}ms`;c.style.transform=y?`translate(-50%,${y}px)`:'';}

 // ----- Feed (inline) -----
 register(slot:Slot){const key=Symbol('slot');this.slots.set(key,slot);this.schedule();return ()=>{this.slots.delete(key);if(this.inlineKey===key)this.inlineKey=null;this.schedule();};}
 setInlineAllowed(allowed:boolean){if(this.inlineAllowed===allowed)return;this.inlineAllowed=allowed;this.schedule();}
 schedule=()=>{if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.pick();});};
 private pick(){
  if(this.reels)return;
  let best:[symbol,Slot]|null=null,score=0;
  if(this.inlineAllowed&&!document.hidden){
   const top=64,bottom=innerHeight-64,mid=innerHeight/2;
   for(const entry of this.slots){const r=entry[1].el.getBoundingClientRect();if(!r.height)continue;const seen=Math.max(0,Math.min(r.bottom,bottom)-Math.max(r.top,top))/r.height;if(seen<.6)continue;const value=seen-Math.abs((r.top+r.bottom)/2-mid)/innerHeight*.5;if(value>score){score=value;best=entry;}}
  }
  if(!best){if(this.inlineKey||this.state.mode==='inline'){this.inlineKey=null;this.set({inlinePost:null});this.setMode('hidden');}return;}
  const [key,slot]=best;
  if(key!==this.inlineKey){this.inlineKey=key;this.set({inlinePost:slot.post});this.setMode('inline');this.play(slot.post.video,true);}
  this.place();
 }
 private place(){
  const slot=this.inlineKey&&this.slots.get(this.inlineKey);const host=this.host;if(!slot||!host)return;
  const r=slot.el.getBoundingClientRect();const st=host.style;
  const next=[`${r.top+scrollY}px`,`${r.left+scrollX}px`,`${r.width}px`,`${r.height}px`];
  if(st.top!==next[0])st.top=next[0];if(st.left!==next[1])st.left=next[1];if(st.width!==next[2])st.width=next[2];if(st.height!==next[3])st.height=next[3];
 }
 expandInline(){const slot=this.inlineKey&&this.slots.get(this.inlineKey);slot?.onExpand();}

 // ----- Captions -----
 setCaptions(on:boolean){if(this.state.captions===on)return;this.set({captions:on});this.applyCaptions();}
 private applyCaptions(){
  const p=this.yt;if(!p||this.engine.player!==p)return;
  try{
   if(this.state.captions){
    p.loadModule?.('captions');
    const list=(p.getOption?.('captions','tracklist') as {languageCode?:string}[]|undefined)||[];
    const tr=list.find(t=>t.languageCode==='tr')||list.find(t=>t.languageCode?.startsWith('tr'));
    p.setOption?.('captions','track',tr||{languageCode:'tr'});
   }else{p.setOption?.('captions','track',{});p.unloadModule?.('captions');}
  }catch{}
 }

 private createYouTube(){
  if(this.creating||!this.ytHost)return;
  this.creating=true;
  loadApi().then(api=>{
   if(!this.ytHost)return;
   const mount=document.createElement('div');this.ytHost.replaceChildren(mount);
   const vars={...youtubeOptions(location.origin),cc_load_policy:this.state.captions?1:0};
   const player=new api.Player(mount,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',playerVars:vars,events:{
    onReady:()=>{this.yt=player;this.ytReady=true;try{player.getIframe().setAttribute('title','Learnie video oynatıcısı');}catch{}if(this.requested)this.play(this.requested.video,this.requested.active);},
    onStateChange:(e:{data:number})=>{if(this.engine.player===player)this.engine.stateChanged(e.data);},
    onApiChange:()=>this.applyCaptions(),
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
 togglePause(){this.engine.togglePause();}
 hold(on:boolean){this.engine.hold(on);}
 seek(seconds:number){this.engine.seek(seconds);}
 progress(){return this.engine.progress();}
 setWantSound(want:boolean){this.engine.setSoundPreference(want);}
 visibility(hidden:boolean){
  if(this.state.mode==='hidden'||!this.requested)return;
  if(hidden)this.engine.select(this.engine.id,false);else this.play(this.requested.video,this.requested.active);
 }
}

const StageContext=createContext<Stage|null>(null);

export function VideoStageProvider({children}:{children:ReactNode}){
 const {prefs,setPrefs}=usePreferences();
 const setRef=useRef(setPrefs);setRef.current=setPrefs;
 const [stage]=useState(()=>new Stage(!prefs.videoMuted,prefs.videoCaptions,muted=>setRef.current({videoMuted:muted})));
 if(import.meta.env.DEV)(window as unknown as {__learnieStage:Stage}).__learnieStage=stage;
 const host=useRef<HTMLDivElement>(null),column=useRef<HTMLDivElement>(null),ytHost=useRef<HTMLDivElement>(null),fileEl=useRef<HTMLVideoElement>(null);
 const state=useSyncExternalStore(stage.subscribe,stage.getSnapshot);
 useEffect(()=>{stage.attach(host.current,column.current,ytHost.current,fileEl.current);},[stage]);
 useEffect(()=>{stage.setWantSound(!prefs.videoMuted);},[stage,prefs.videoMuted]);
 useEffect(()=>{stage.setCaptions(prefs.videoCaptions);},[stage,prefs.videoCaptions]);
 useEffect(()=>{
  const change=()=>{stage.visibility(document.hidden);stage.schedule();};
  document.addEventListener('visibilitychange',change);window.addEventListener('scroll',stage.schedule,{passive:true});window.addEventListener('resize',stage.schedule);
  return()=>{document.removeEventListener('visibilitychange',change);window.removeEventListener('scroll',stage.schedule);window.removeEventListener('resize',stage.schedule);};
 },[stage]);
 return <StageContext.Provider value={stage}>{children}
  <div ref={host} className="video-stage" data-mode={state.mode} data-orientation={state.orientation} data-status={state.status} data-needs-tap={state.needsTap||undefined}>
   <div ref={column} className="video-stage-column"><div className="video-stage-frame"><div className="video-stage-youtube" ref={ytHost}/><video className="video-stage-file" ref={fileEl} playsInline preload="none"/></div></div>
   {state.mode==='inline'&&state.inlinePost&&<InlineControls stage={stage} state={state} post={state.inlinePost}/>}
  </div>
 </StageContext.Provider>;
}

/** Controls drawn over the feed video: tap to pause, sound, full screen and a progress line. */
function InlineControls({stage,state,post}:{stage:Stage;state:StageState;post:Post}){
 const mine=state.id===post.video?.url,showing=mine&&['playing','paused','needs-tap'].includes(state.status);
 return <div className={`inline-controls ${state.needsTap?'is-passthrough':''}`}>
  <div className={`inline-poster ${showing?'is-hidden':''}`}><VideoPoster post={post} className="inline-poster-image"/></div>
  <button type="button" className="inline-tap" aria-label={state.held?'Videoyu oynat':'Videoyu durdur'} onClick={()=>stage.togglePause()}/>
  {mine&&state.held&&<span className="inline-center" aria-hidden="true"><Play size={30} fill="currentColor"/></span>}
  {mine&&state.needsTap&&<span className="inline-hint" role="status"><Play size={16} fill="currentColor"/> {state.tapReason==='sound'?'Sesli izlemek için videoya dokun':'Başlatmak için videoya dokun'}</span>}
  {mine&&state.status==='loading'&&<span className="reel-loading" aria-hidden="true"/>}
  <button type="button" className="inline-button inline-expand" aria-label="Tam ekran izle" onClick={()=>stage.expandInline()}><Maximize2 size={17}/></button>
  <button type="button" className="inline-button inline-sound" aria-label={state.muted?'Sesi aç':'Sesi kapat'} onClick={()=>stage.toggleSound()}>{state.muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button>
  {mine&&<StageProgress stage={stage} playing={state.status==='playing'} className="inline-progress"/>}
 </div>;
}

export function StageProgress({stage,playing,className='reel-progress'}:{stage:Stage;playing:boolean;className?:string}){
 const bar=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let frame=0,last=-1;
  const draw=()=>{const {time,duration}=stage.progress();const value=duration>0?Math.min(1,time/duration):0;if(Math.abs(value-last)>.001&&bar.current){bar.current.style.transform=`scaleX(${value})`;last=value;}frame=requestAnimationFrame(draw);};
  if(playing)frame=requestAnimationFrame(draw);else{const {time,duration}=stage.progress();if(bar.current)bar.current.style.transform=`scaleX(${duration>0?time/duration:0})`;}
  return()=>cancelAnimationFrame(frame);
 },[playing,stage]);
 return <div className={className} aria-hidden="true"><span ref={bar}/></div>;
}

export function useVideoStage(){
 const stage=useContext(StageContext);
 if(!stage)throw new Error('VideoStageProvider eksik.');
 const state=useSyncExternalStore(stage.subscribe,stage.getSnapshot);
 return {stage,state};
}

/** Register a feed card as a place where the shared player may play inline. */
export function useInlineSlot(ref:RefObject<HTMLElement|null>,post:Post,onExpand:()=>void){
 const stage=useContext(StageContext);const expand=useRef(onExpand);expand.current=onExpand;
 useEffect(()=>{const el=ref.current;if(!stage||!el||!post.video)return;return stage.register({el,post,onExpand:()=>expand.current()});},[stage,ref,post]);
}
export function useInlinePlayback(allowed:boolean){const stage=useContext(StageContext);useEffect(()=>{stage?.setInlineAllowed(allowed);},[stage,allowed]);}
