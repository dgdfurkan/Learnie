import {createContext,useContext,useEffect,useRef,useState,useSyncExternalStore,type ReactNode,type RefObject} from 'react';
import {Volume2,VolumeX,Maximize2,Play,Pause} from 'lucide-react';
import {VideoPoster} from './VideoPoster';
import {PlaybackEngine,UNSTARTED,ENDED,PLAYING,PAUSED,BUFFERING} from './video-engine.mjs';
import {youtubeOptions} from './youtube.mjs';
import {usePreferences} from './Preferences';
import type {Post} from './types';

type Video=NonNullable<Post['video']>;
type Adapter={cueVideoById?:(v:{videoId:string;startSeconds:number})=>void;setPlaybackRate?:(r:number)=>void;getAvailablePlaybackRates?:()=>number[];playVideo:()=>void;pauseVideo:()=>void;loadVideoById:(v:{videoId:string;startSeconds:number})=>void;mute:()=>void;unMute:()=>void;isMuted:()=>boolean;setVolume:(v:number)=>void;getPlayerState:()=>number;getCurrentTime:()=>number;getDuration:()=>number;getVideoUrl:()=>string;seekTo:(s:number,a:boolean)=>void};
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
type Player={host:HTMLDivElement;yt:YTPlayer|null;ready:boolean;creating:boolean;engine:PlaybackEngine;used:number;queued:(()=>void)|null;file?:boolean};

/** Current video plus up to three buffered neighbours (next two, previous one). */
const POOL=4;

/**
 * The players for the whole app. They live for the whole session (moving an
 * iframe would reload it and lose the iOS sound unlock). One is in front and
 * shown full screen under Reels or laid over a feed card; the others silently
 * buffer the neighbouring reels so a swipe starts instantly.
 */
class Stage {
 state:StageState;listeners=new Set<()=>void>();
 host:HTMLDivElement|null=null;column:HTMLDivElement|null=null;frame:HTMLDivElement|null=null;fileEl:HTMLVideoElement|null=null;
 players:Player[]=[];current:Player|null=null;filePlayer:Player|null=null;solo:Player|null=null;clock=0;wanted=new Set<string>();
 strict=strictAutoplay();wantSound:boolean;
 requested:{video:Video;active:boolean}|null=null;timer=0;onSoundPreference:(muted:boolean)=>void;
 reels=false;inlineAllowed=false;slots=new Map<symbol,Slot>();inlineKey:symbol|null=null;raf=0;captionsFor='';
 constructor(wantSound:boolean,captions:boolean,onSoundPreference:(muted:boolean)=>void){
  this.onSoundPreference=onSoundPreference;this.wantSound=wantSound;
  this.state={id:'',active:false,status:'idle',error:'',muted:!wantSound,wantSound,needsTap:false,tapReason:'',held:false,unlocked:false,mode:'hidden',orientation:'portrait',inlinePost:null,captions};
 }
 get engine(){return this.current?.engine;}
 set(patch:Partial<StageState>){
  this.state={...this.state,...patch};this.listeners.forEach(fn=>fn());
  if(this.state.status==='playing'&&this.captionsFor!==this.state.id){this.captionsFor=this.state.id;this.applyCaptions();setTimeout(()=>this.applyCaptions(),900);}
 }
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 getSnapshot=()=>this.state;
 attach(host:HTMLDivElement|null,column:HTMLDivElement|null,frame:HTMLDivElement|null,fileEl:HTMLVideoElement|null){this.host=host;this.column=column;this.frame=frame;this.fileEl=fileEl;}

 private newEngine(player:()=>Player){
  return new PlaybackEngine(idle,{wantSound:this.wantSound,mutedUntilUnlocked:this.strict,onSoundPreference:m=>this.onSoundPreference(m),onChange:s=>{
   const p=player();if(s.unlocked&&this.strict&&!this.solo&&!p.file)this.solo=p;
   if(p===this.current)this.set(s);
  }});
 }
 private createPlayer(){
  const host=document.createElement('div');host.className='video-stage-youtube';this.frame?.appendChild(host);
  const p:Player={host,yt:null,ready:false,creating:false,used:0,queued:null,engine:null as unknown as PlaybackEngine};
  p.engine=this.newEngine(()=>p);this.players.push(p);return p;
 }
 private boot(p:Player){
  if(p.creating||p.ready)return;p.creating=true;
  loadApi().then(api=>{
   const mount=document.createElement('div');p.host.replaceChildren(mount);
   // On WebKit the player must be muted from the first frame, or iOS refuses to autoplay it.
   const vars={...youtubeOptions(location.origin),cc_load_policy:this.state.captions?1:0,...(this.strict&&!this.solo?{mute:1}:{})};
   const yt=new api.Player(mount,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',playerVars:vars,events:{
    onReady:()=>{p.yt=yt;p.ready=true;p.engine.player=yt;try{yt.getIframe().setAttribute('title','Learnie video oynatıcısı');}catch{}const q=p.queued;p.queued=null;q?.();},
    onStateChange:(e:{data:number})=>p.engine.stateChanged(e.data),
    onApiChange:()=>{if(p===this.current)this.applyCaptions();},
    onAutoplayBlocked:()=>p.engine.blocked(),
    onError:(e:{data:number})=>p.engine.fail(e.data===101||e.data===150?'Yayıncı bu videonun başka sitelerde oynatılmasına şu an izin vermiyor.':'Bu video şu an açılamıyor.')
   }});
  }).catch(()=>{p.creating=false;if(p===this.current)this.set({status:'error',error:'YouTube oynatıcısına bağlanılamadı. Bağlantını kontrol edebilirsin.'});});
 }
 private run(p:Player,action:()=>void){if(p.ready||p.file)action();else{p.queued=action;this.boot(p);}}
 /** A player for this video: the one already holding it, else the least recently used free one. */
 private pick(url:string,forPreload=false){
  if(this.solo&&!forPreload)return this.solo;
  const holder=this.players.find(p=>p.engine.id===url);if(holder)return holder;
  const free=this.players.filter(p=>p!==this.current&&p!==this.solo&&!(forPreload&&this.wanted.has(p.engine.id)&&p.engine.id!==url)).sort((a,b)=>a.used-b.used);
  if(this.players.length<POOL&&(forPreload||!free.length||free[0].engine.id))return this.createPlayer();
  if(!forPreload){const spare=free.find(p=>!this.wanted.has(p.engine.id))||free[0];if(spare)return spare;}
  return free[0]||null;
 }
 private front(p:Player){for(const x of this.players)x.host.style.zIndex=x===p?'2':'1';if(this.fileEl)this.fileEl.style.zIndex=p.file?'3':'0';}

 private setMode(mode:StageMode){
  if(this.state.mode===mode)return;
  if(mode==='hidden'){this.engine?.select(this.engine.id,false);this.requested=null;clearInterval(this.timer);this.timer=0;}
  else if(!this.timer)this.timer=window.setInterval(()=>{this.engine?.tick();if(this.state.mode==='inline')this.place();},250);
  if(mode!=='reels')this.setOffset(0,0);
  if(mode!=='inline'&&this.host){const st=this.host.style;st.top=st.left=st.width=st.height='';}
  this.set({mode});
 }

 // ----- Reels -----
 enterReels(){this.reels=true;this.inlineKey=null;this.set({inlinePost:null});this.setMode('reels');}
 leaveReels(){this.reels=false;this.wanted.clear();this.setMode('hidden');this.schedule();}
 /** Keep the video glued to its slide while the user drags between reels. */
 setOffset(y:number,ms:number){const c=this.column;if(!c)return;c.style.transitionDuration=`${ms}ms`;c.style.transform=y?`translate(-50%,${y}px)`:'';}
 /** Buffer neighbours (most important first). On iOS, once sound is unlocked, one player keeps it. */
 preload(videos:Video[]){
  if(this.solo)return;
  const list=videos.filter(v=>v.kind==='youtube').slice(0,POOL-1);
  this.wanted=new Set(list.map(v=>v.url));
  for(const v of list){
   if(this.players.some(p=>p.engine.id===v.url))continue;
   const p=this.pick(v.url,true);if(!p||p===this.current)break;
   p.used=++this.clock;this.run(p,()=>p.engine.preload(v.url));
  }
 }

 // ----- Feed (inline) -----
 register(slot:Slot){const key=Symbol('slot');this.slots.set(key,slot);this.schedule();return ()=>{this.slots.delete(key);if(this.inlineKey===key)this.inlineKey=null;this.schedule();};}
 setInlineAllowed(allowed:boolean){if(this.inlineAllowed===allowed)return;this.inlineAllowed=allowed;this.schedule();}
 schedule=()=>{if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.pickInline();});};
 private pickInline(){
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
  const p=this.current?.yt;if(!p||!this.current?.ready)return;
  try{
   if(this.state.captions){
    p.loadModule?.('captions');
    const list=(p.getOption?.('captions','tracklist') as {languageCode?:string}[]|undefined)||[];
    const tr=list.find(t=>t.languageCode==='tr')||list.find(t=>t.languageCode?.startsWith('tr'));
    p.setOption?.('captions','track',tr||{languageCode:'tr'});
   }else{p.setOption?.('captions','track',{});p.unloadModule?.('captions');}
  }catch{}
 }

 play(video:Video|undefined,active:boolean){
  if(!video){this.requested=null;this.engine?.select(this.engine.id,false);return;}
  this.requested={video,active};
  const orientation=video.orientation==='landscape'?'landscape':'portrait';
  if(orientation!==this.state.orientation)this.set({orientation});
  let p:Player|null;
  if(video.kind==='file'){
   if(!this.fileEl)return;
   if(!this.filePlayer){const fp:Player={host:document.createElement('div'),yt:null,ready:true,creating:false,used:0,queued:null,file:true,engine:null as unknown as PlaybackEngine};fp.engine=this.newEngine(()=>fp);fp.engine.player=fileAdapter(this.fileEl,()=>fp.engine);this.filePlayer=fp;}
   p=this.filePlayer;
  }else p=this.pick(video.url);
  if(!p)return;
  if(p!==this.current){this.current?.engine.select(this.current.engine.id,false);this.current=p;this.front(p);this.captionsFor='';}
  p.used=++this.clock;
  const target=p;
  if(!target.ready){this.set({...target.engine.snapshot(),id:video.url,status:'loading',error:'',needsTap:false});}
  this.run(target,()=>{target.engine.select(video.url,active);if(target===this.current)this.set(target.engine.snapshot());});
 }
 toggleSound(){this.engine?.toggleSound();}
 togglePause(){this.engine?.togglePause();}
 hold(on:boolean){this.engine?.hold(on);}
 seek(seconds:number){this.engine?.seek(seconds);}
 setRate(rate:number){this.engine?.setRate(rate);}
 rates(){return this.engine?.rates()||[.25,.5,.75,1,1.25,1.5,1.75,2];}
 progress(){return this.engine?.progress()||{time:0,duration:0};}
 setWantSound(want:boolean){this.wantSound=want;for(const p of this.players)p.engine.setSoundPreference(want);this.filePlayer?.engine.setSoundPreference(want);}
 visibility(hidden:boolean){
  if(this.state.mode==='hidden'||!this.requested)return;
  if(hidden)this.engine?.select(this.engine.id,false);else this.play(this.requested.video,this.requested.active);
 }
}

const StageContext=createContext<Stage|null>(null);

export function VideoStageProvider({children}:{children:ReactNode}){
 const {prefs,setPrefs}=usePreferences();
 const setRef=useRef(setPrefs);setRef.current=setPrefs;
 const [stage]=useState(()=>new Stage(!prefs.videoMuted,prefs.videoCaptions,muted=>setRef.current({videoMuted:muted})));
 if(import.meta.env.DEV)(window as unknown as {__learnieStage:Stage}).__learnieStage=stage;
 const host=useRef<HTMLDivElement>(null),column=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null),fileEl=useRef<HTMLVideoElement>(null);
 const state=useSyncExternalStore(stage.subscribe,stage.getSnapshot);
 useEffect(()=>{stage.attach(host.current,column.current,frame.current,fileEl.current);},[stage]);
 useEffect(()=>{stage.setWantSound(!prefs.videoMuted);},[stage,prefs.videoMuted]);
 useEffect(()=>{stage.setCaptions(prefs.videoCaptions);},[stage,prefs.videoCaptions]);
 useEffect(()=>{
  const change=()=>{stage.visibility(document.hidden);stage.schedule();};
  document.addEventListener('visibilitychange',change);window.addEventListener('scroll',stage.schedule,{passive:true});window.addEventListener('resize',stage.schedule);
  return()=>{document.removeEventListener('visibilitychange',change);window.removeEventListener('scroll',stage.schedule);window.removeEventListener('resize',stage.schedule);};
 },[stage]);
 return <StageContext.Provider value={stage}>{children}
  <div ref={host} className="video-stage" data-mode={state.mode} data-orientation={state.orientation} data-status={state.status} data-needs-tap={state.needsTap||undefined}>
   <div ref={column} className="video-stage-column"><div ref={frame} className="video-stage-frame"><video className="video-stage-file" ref={fileEl} playsInline preload="none"/></div></div>
   {state.mode==='inline'&&state.inlinePost&&<InlineControls stage={stage} state={state} post={state.inlinePost}/>}
  </div>
 </StageContext.Provider>;
}

/** Controls drawn over the feed video: centre tap to pause, sound, full screen and a progress line. */
function InlineControls({stage,state,post}:{stage:Stage;state:StageState;post:Post}){
 const mine=state.id===post.video?.url,showing=mine&&['playing','paused','needs-tap'].includes(state.status);
 const [flash,setFlash]=useState<{key:number;paused:boolean}|null>(null);
 return <div className={`inline-controls ${state.needsTap?'is-passthrough':''}`}>
  <div className={`inline-poster ${showing?'is-hidden':''}`}><VideoPoster post={post} className="inline-poster-image"/></div>
  <button type="button" className="inline-tap" aria-label={state.held?'Videoyu oynat':'Videoyu durdur'} onClick={()=>{stage.togglePause();setFlash({key:Date.now(),paused:stage.state.held});}}/>
  {mine&&flash&&<span key={flash.key} className="inline-center" aria-hidden="true">{flash.paused?<Pause size={26} fill="currentColor"/>:<Play size={26} fill="currentColor"/>}</span>}
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
