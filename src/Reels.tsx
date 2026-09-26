import {lazy,memo,Suspense,useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import type {Swiper as SwiperInstance} from 'swiper';
import {Swiper,SwiperSlide} from 'swiper/react';
import {Virtual,Mousewheel,Keyboard,A11y} from 'swiper/modules';
import {Bookmark,ChevronLeft,Heart,MessageCircle,Send,BookOpen,Volume2,VolumeX,Play,Pause,ExternalLink,ArrowRight,Eye,EyeOff,Captions,CaptionsOff,MoreHorizontal} from 'lucide-react';
import {useBackGesture} from './useBackGesture';
import {engagement,formatCount,reelQueue} from './social.mjs';
import {Avatar} from './components';
import {VideoPoster,posterSources} from './VideoPoster';
import {useVideoStage,preloadVideoApi} from './VideoStage';
import {usePreferences} from './Preferences';
import {videoTime} from './youtube.mjs';
import type {Post,UserState} from './types';
import 'swiper/css';

const FilmPlayer=lazy(()=>import('./Film').then(m=>({default:m.FilmPlayer})));
const BREAK_EVERY=18;
type Item={key:string;post?:Post;break?:number};
type Props={initialId?:string;posts:Post[];user:UserState;onLike:(id:string)=>void;onSave:(id:string)=>void;onShare:(p:Post)=>void;onOpen:(p:Post)=>void;onSeen:(id:string)=>void;onClose:()=>void;onComments:(p:Post)=>void;onAccount:(p:Post)=>void;onMore:(p:Post)=>void;isHidden:(p:Post)=>boolean;visible?:boolean};

function withBreaks(posts:Post[],offset:number):Item[]{
 const out:Item[]=[];posts.forEach((post,i)=>{const n=offset+i;if(n>0&&n%BREAK_EVERY===0)out.push({key:`break-${n}`,break:n});out.push({key:`${post.id}-${n}`,post});});return out;
}
const videoOf=(p?:Post)=>p?.display==='video'?p.video:undefined;

export default function Reels({posts,user,onLike,onSave,onShare,onOpen,onSeen,onClose,onComments,onAccount,onMore,isHidden,visible=true,initialId}:Props){
 const root=useRef<HTMLDivElement>(null),swiper=useRef<SwiperInstance|null>(null);
 useBackGesture(root,()=>{if(visible)onClose();});
 const {stage,state}=useVideoStage();const {prefs,setPrefs}=usePreferences();
 const [items,setItems]=useState<Item[]>(()=>withBreaks(reelQueue(posts.filter(p=>p.id===initialId||!isHidden(p)),initialId,user.seen),0));
 // `active` follows the finger; `owner` is the slide whose video the player holds.
 // The owner only changes once a swipe has settled, so the playing video keeps
 // moving with the finger instead of being replaced by a still poster.
 const [active,setActive]=useState(0),[owner,setOwner]=useState(0),[clean,setClean]=useState(false);
 const ownerRef=useRef(0),transition=useRef(0);ownerRef.current=owner;
 const startedAt=useRef(Date.now()),watched=useRef<Post[]>([]);
 const ownerPost=items[owner]?.post,video=videoOf(ownerPost);

 useEffect(()=>{stage.enterReels();preloadVideoApi();root.current?.focus({preventScroll:true});return()=>stage.leaveReels();},[stage]);
 useEffect(()=>{stage.play(video,!!video&&visible);},[stage,video,visible]);
 useEffect(()=>{const s=swiper.current;if(s)stage.setOffset(s.translate+owner*s.height,0);},[owner,stage]);
 // Keep the neighbours ready: videos in the background players, posters in the image cache.
 useEffect(()=>{
  const around=(d:number)=>items[owner+d]?.post;
  for(const d of [1,2,3,-1,-2,-3]){const p=around(d);if(p){const img=new Image();img.referrerPolicy='no-referrer';img.src=posterSources(p)[0];}}
  const t=setTimeout(()=>stage.preload([around(1),around(2),around(-1),around(3)].map(videoOf).filter((v):v is NonNullable<Post['video']>=>!!v)),500);
  return()=>clearTimeout(t);
 },[owner,items,stage]);
 useEffect(()=>{const p=items[active]?.post;if(p){onSeen(p.id);if(!watched.current.includes(p))watched.current.push(p);}},[active]);
 // Skip a video the publisher no longer allows here, after a short notice.
 useEffect(()=>{if(state.status!=='error'||!video||state.id!==video.url||!visible)return;const t=setTimeout(()=>swiper.current?.slideNext(),3200);return()=>clearTimeout(t);},[state.status,state.id,video,visible]);
 // A hidden post or channel leaves the queue at once; if it is on screen, move on.
 useEffect(()=>{
  setItems(current=>{const next=current.filter((it,i)=>i<=active||!it.post||!isHidden(it.post));return next.length===current.length?current:next;});
  const p=items[active]?.post;if(p&&isHidden(p))swiper.current?.slideNext();
 },[isHidden]);

 const extend=useCallback(()=>setItems(current=>[...current,...withBreaks(reelQueue(posts.filter(p=>!isHidden(p)),undefined,[]),current.filter(i=>i.post).length)]),[posts,isHidden]);
 const onKey=(e:React.KeyboardEvent)=>{
  if((e.target as HTMLElement).closest('input,textarea,select'))return;
  if(e.key==='Escape'){e.preventDefault();if(clean)setClean(false);else onClose();}
  else if(e.key==='m'||e.key==='M')stage.toggleSound();
  else if(e.key==='c'||e.key==='C')setPrefs({videoCaptions:!prefs.videoCaptions});
  else if(e.key===' '&&video){e.preventDefault();stage.togglePause();}
 };
 const needsTap=!!video&&state.needsTap&&state.id===video.url;
 const settleTimer=useRef(0);
 const settle=(s:SwiperInstance)=>{clearTimeout(settleTimer.current);if(s.activeIndex!==ownerRef.current)setOwner(s.activeIndex);};
 useEffect(()=>()=>clearTimeout(settleTimer.current),[]);
 const lockSwipe=useCallback((on:boolean)=>{const s=swiper.current;if(s)s.allowTouchMove=!on;},[]);
 const hideClasses=clean?prefs.cleanHide.map(k=>`hide-${k}`).join(' '):'';

 return createPortal(<div ref={root} tabIndex={-1} className={`reels-root ${hideClasses}`} data-clean={clean||undefined} data-needs-tap={needsTap||undefined} onKeyDown={onKey} role="region" aria-label="Reels">
  <header className="reels-top">
   <button className="reels-icon reels-back part-header" aria-label="Reels akışını kapat" onClick={onClose}><ChevronLeft size={28}/></button>
   <strong className="reels-title part-header">Reels</strong>
   {video&&<button className="reels-icon part-captions" aria-label={prefs.videoCaptions?'Altyazıyı kapat':'Altyazıyı aç'} aria-pressed={prefs.videoCaptions} onClick={()=>setPrefs({videoCaptions:!prefs.videoCaptions})}>{prefs.videoCaptions?<Captions size={23}/>:<CaptionsOff size={23}/>}</button>}
   {video&&<button className="reels-icon part-sound" aria-label={state.muted?'Sesi aç':'Sesi kapat'} aria-pressed={!state.muted} onClick={()=>stage.toggleSound()}>{state.muted?<VolumeX size={23}/>:<Volume2 size={23}/>}</button>}
   <button className="reels-icon reels-eye" aria-label={clean?'Arayüzü göster':'Arayüzü gizle'} aria-pressed={clean} onClick={()=>setClean(v=>!v)}>{clean?<Eye size={23}/>:<EyeOff size={23}/>}</button>
  </header>
  <Swiper className="reels-swiper" onSwiper={s=>{swiper.current=s;}} direction="vertical" modules={[Virtual,Mousewheel,Keyboard,A11y]} virtual={{addSlidesBefore:1,addSlidesAfter:1}} speed={320} threshold={5} resistanceRatio={.35} a11y={{scrollOnFocus:false}} mousewheel={{forceToAxis:true,thresholdDelta:28}} keyboard={{enabled:visible}}
   onSetTransition={(_s,ms)=>{transition.current=ms;}}
   onSetTranslate={(s,t)=>stage.setOffset(t+ownerRef.current*s.height,transition.current)}
   onSlideChange={s=>{setActive(s.activeIndex);clearTimeout(settleTimer.current);settleTimer.current=window.setTimeout(()=>settle(s),(s.params.speed||320)+120);if(s.activeIndex>=items.length-4)extend();}}
   onSlideChangeTransitionEnd={settle} onTransitionEnd={settle}>
   {items.map((it,i)=><SwiperSlide key={it.key} virtualIndex={i}>
    {it.break!==undefined?<BreakCard active={i===active} minutes={Math.max(1,Math.round((Date.now()-startedAt.current)/60000))} watched={watched.current} onContinue={()=>swiper.current?.slideNext()} onClose={onClose}/>
    :it.post&&<Reel post={it.post} user={user} active={i===active} owner={i===owner} near={Math.abs(i-active)<=1} visible={visible} onLike={onLike} onSave={onSave} onShare={onShare} onOpen={onOpen} onComments={onComments} onAccount={onAccount} onMore={onMore} onNext={()=>swiper.current?.slideNext()} lockSwipe={lockSwipe}/>}
   </SwiperSlide>)}
  </Swiper>
 </div>,document.body);
}

type ReelProps={post:Post;user:UserState;active:boolean;owner:boolean;near:boolean;visible:boolean;onLike:(id:string)=>void;onSave:(id:string)=>void;onShare:(p:Post)=>void;onOpen:(p:Post)=>void;onComments:(p:Post)=>void;onAccount:(p:Post)=>void;onMore:(p:Post)=>void;onNext:()=>void;lockSwipe:(on:boolean)=>void};
const Reel=memo(function Reel({post,user,active,owner,near,visible,onLike,onSave,onShare,onOpen,onComments,onAccount,onMore,onNext,lockSwipe}:ReelProps){
 const video=videoOf(post);
 const liked=user.liked.includes(post.id),saved=user.saved.includes(post.id),counts=engagement(post,user);
 const [hearts,setHearts]=useState<{id:number;x:number;y:number}[]>([]);
 const like=(x?:number,y?:number)=>{if(!liked)onLike(post.id);try{navigator.vibrate?.(12);}catch{}if(x!==undefined&&y!==undefined){const id=Date.now();setHearts(h=>[...h.slice(-2),{id,x,y}]);setTimeout(()=>setHearts(h=>h.filter(v=>v.id!==id)),900);}};
 return <div className={`reel ${video?'reel--video':'reel--film'}`} inert={!active} aria-hidden={!active}>
  {video?<VideoLayer post={post} owner={owner} onDoubleTap={like} onNext={onNext} lockSwipe={lockSwipe}/>
  :near&&<div className="reel-film"><Suspense fallback={<div className="reel-film-loading"/>}><FilmPlayer post={post} active={active&&owner&&visible} onAccount={()=>onAccount(post)}/></Suspense></div>}
  {hearts.map(h=><span key={h.id} className="reel-heart" style={{left:h.x,top:h.y}}><Heart fill="currentColor" size={96}/></span>)}
  <aside className="reel-actions" aria-label="Gönderi işlemleri">
   <button className={`reel-action part-like ${liked?'is-on is-liked':''}`} aria-label={liked?'Beğeniyi kaldır':'Beğen'} aria-pressed={liked} onClick={()=>onLike(post.id)}><Heart fill={liked?'currentColor':'none'}/><span>{formatCount(counts.likes)}</span></button>
   <button className="reel-action part-comment" aria-label="Yorumlar" onClick={()=>onComments(post)}><MessageCircle/><span>{counts.comments||''}</span></button>
   <button className="reel-action part-share" aria-label="Paylaş" onClick={()=>onShare(post)}><Send/><span>{counts.shares?formatCount(counts.shares):''}</span></button>
   <button className={`reel-action part-save ${saved?'is-on':''}`} aria-label={saved?'Koleksiyonları düzenle':'Kaydet'} aria-pressed={saved} onClick={()=>onSave(post.id)}><Bookmark fill={saved?'currentColor':'none'}/></button>
   <button className="reel-action part-note" aria-label="Notunu oku" onClick={()=>onOpen(post)}><BookOpen/></button>
   <button className="reel-action part-more" aria-label="Diğer seçenekler" onClick={()=>onMore(post)}><MoreHorizontal/></button>
  </aside>
  {video&&<ReelMeta post={post} onAccount={()=>onAccount(post)} onOpen={()=>onOpen(post)}/>}
 </div>;
});

function ReelMeta({post,onAccount,onOpen}:{post:Post;onAccount:()=>void;onOpen:()=>void}){
 const [open,setOpen]=useState(false);const video=post.video!;
 return <div className={`reel-meta ${open?'is-open':''}`}>
  <button className="reel-account part-account" onClick={onAccount} aria-label={`${post.account} profilini aç`}><Avatar post={post}/><strong>{post.account}</strong><span className="reel-chip">{post.category}</span></button>
  <h2 className="reel-title part-title">{post.title}</h2>
  <button className="reel-caption part-caption" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{post.subtitle}</button>
  <div className="reel-source part-source"><a href={video.kind==='youtube'?`https://www.youtube.com/watch?v=${video.url}`:video.url} target="_blank" rel="noreferrer"><Play size={11} fill="currentColor"/>{video.publisher||'Kaynak'}<ExternalLink size={11}/></a>{open&&<button onClick={onOpen}>Notu aç <ArrowRight size={12}/></button>}</div>
 </div>;
}

/** The centre area pauses; single taps elsewhere on the video do nothing. */
export function inCentre(x:number,y:number,w:number,h:number){return Math.abs(x-w/2)<w*.28&&Math.abs(y-h/2)<h*.2;}
const SPEED_STEP=36;

/** Poster, gestures and status for a video reel. The video itself plays in the shared stage underneath. */
function VideoLayer({post,owner,onDoubleTap,onNext,lockSwipe}:{post:Post;owner:boolean;onDoubleTap:(x?:number,y?:number)=>void;onNext:()=>void;lockSwipe:(on:boolean)=>void}){
 const {stage,state}=useVideoStage();const video=post.video!;
 const mine=owner&&state.id===video.url;
 const showing=mine&&['playing','paused','needs-tap'].includes(state.status);
 const [flash,setFlash]=useState<{key:number;paused:boolean}|null>(null);
 const [speed,setSpeed]=useState<number|null>(null);const speedRef=useRef<number|null>(null);speedRef.current=speed;
 const gesture=useRef<{x:number;y:number;at:number;timer:number;fast:boolean;moved:boolean;rates:number[];base:number}|null>(null);
 const lastTap=useRef<{at:number;x:number;y:number;timer:number}|null>(null);
 // Press and hold: 2× (like X). Slide right to go faster, left to go slower; release to return to 1×.
 const startFast=(g:NonNullable<typeof gesture.current>)=>{
  const rates=stage.rates().filter(r=>r>0).sort((a,b)=>a-b);const base=rates.includes(2)?rates.indexOf(2):rates.length-1;
  g.fast=true;g.rates=rates;g.base=base;lockSwipe(true);stage.setRate(rates[base]);setSpeed(rates[base]);try{navigator.vibrate?.(8);}catch{}
 };
 const endFast=()=>{lockSwipe(false);stage.setRate(1);setSpeed(null);};
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!e.isPrimary||e.button>0)return;
  const g={x:e.clientX,y:e.clientY,at:Date.now(),timer:0,fast:false,moved:false,rates:[] as number[],base:0};
  g.timer=window.setTimeout(()=>{if(!g.moved&&stage.state.status==='playing'&&stage.state.id===video.url)startFast(g);},380);gesture.current=g;
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;if(!g)return;
  if(g.fast){const step=Math.round((e.clientX-g.x)/SPEED_STEP);const r=g.rates[Math.min(g.rates.length-1,Math.max(0,g.base+step))];if(r!==speedRef.current){stage.setRate(r);setSpeed(r);}return;}
  if(!g.moved&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){g.moved=true;clearTimeout(g.timer);}
 };
 const up=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;gesture.current=null;if(!g)return;clearTimeout(g.timer);
  if(g.fast){endFast();return;}
  if(g.moved||Date.now()-g.at>500)return;
  const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  const last=lastTap.current;
  if(last&&Date.now()-last.at<280&&Math.hypot(last.x-x,last.y-y)<60){clearTimeout(last.timer);lastTap.current=null;onDoubleTap(x,y);return;}
  const centre=inCentre(x,y,rect.width,rect.height);
  const timer=window.setTimeout(()=>{lastTap.current=null;if(!centre)return;stage.togglePause();setFlash({key:Date.now(),paused:stage.state.held});},240);
  lastTap.current={at:Date.now(),x,y,timer};
 };
 const cancel=()=>{const g=gesture.current;gesture.current=null;if(g){clearTimeout(g.timer);if(g.fast)endFast();}};
 useEffect(()=>()=>{if(lastTap.current)clearTimeout(lastTap.current.timer);},[]);
 useEffect(()=>{if(!owner&&speedRef.current!==null)endFast();},[owner]);
 const loading=owner&&(!mine||state.status==='loading');
 return <div className={`reel-video ${video.orientation==='landscape'?'is-landscape':''}`}>
  <div className={`reel-poster-wrap ${showing?'is-hidden':''}`}><VideoPoster post={post} className="reel-poster" eager={owner}/></div>
  <div className="reel-shade part-shade" aria-hidden="true"/>
  <div className="reel-gesture" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onContextMenu={e=>e.preventDefault()} aria-label="Ortaya dokun: durdur veya oynat. İki kez dokun: beğen. Basılı tut: hızlandır." role="button" tabIndex={-1}/>
  {loading&&<span className="reel-loading" aria-label="Video yükleniyor" role="status"/>}
  {mine&&flash&&<span key={flash.key} className="reel-center-icon is-pop" aria-hidden="true">{flash.paused?<Pause size={32} fill="currentColor"/>:<Play size={32} fill="currentColor"/>}</span>}
  {speed!==null&&<span className="reel-speed" role="status"><strong>{String(speed).replace('.',',')}×</strong><small>◂ yavaş · hızlı ▸</small></span>}
  {mine&&state.status==='playing'&&state.muted&&!state.needsTap&&<button className="reel-sound-pill part-sound" onClick={()=>stage.toggleSound()}><VolumeX size={15}/> Sesi aç</button>}
  {mine&&state.status==='error'&&<div className="reel-error" role="status"><p>{state.error}</p><a href={`https://www.youtube.com/watch?v=${video.url}`} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a><button onClick={onNext}>Sıradaki <ArrowRight size={14}/></button></div>}
  {mine&&<Scrubber/>}
 </div>;
}

/**
 * Instagram-style scrubber at the bottom. Native listeners (not React's
 * delegated ones) so Swiper never sees the drag; a knob and a time bubble
 * follow the finger; releasing seeks.
 */
function Scrubber(){
 const {stage}=useVideoStage();const track=useRef<HTMLDivElement>(null),bar=useRef<HTMLSpanElement>(null),knob=useRef<HTMLElement>(null);
 const [drag,setDrag]=useState<{ratio:number;duration:number}|null>(null);
 useEffect(()=>{
  const el=track.current;if(!el)return;
  let dragging=false,frame=0,last=-1;
  const paint=(v:number)=>{if(bar.current)bar.current.style.transform=`scaleX(${v})`;if(knob.current)knob.current.style.left=`${v*100}%`;};
  const draw=()=>{if(!dragging){const {time,duration}=stage.progress();const v=duration>0?Math.min(1,time/duration):0;if(Math.abs(v-last)>.001){paint(v);last=v;}}frame=requestAnimationFrame(draw);};
  frame=requestAnimationFrame(draw);
  const ratio=(x:number)=>{const r=el.getBoundingClientRect();return Math.min(1,Math.max(0,(x-r.left)/r.width));};
  const at=(x:number)=>{const v=ratio(x);paint(v);setDrag({ratio:v,duration:stage.progress().duration});return v;};
  const down=(e:PointerEvent)=>{e.stopPropagation();e.preventDefault();dragging=true;try{el.setPointerCapture(e.pointerId);}catch{}at(e.clientX);};
  const move=(e:PointerEvent)=>{if(!dragging)return;e.stopPropagation();e.preventDefault();at(e.clientX);};
  const up=(e:PointerEvent)=>{if(!dragging)return;e.stopPropagation();dragging=false;const v=at(e.clientX);const d=stage.progress().duration;setDrag(null);last=-1;if(d>0)stage.seek(v*d);};
  const cancel=()=>{dragging=false;setDrag(null);last=-1;};
  const stop=(e:Event)=>e.stopPropagation();
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',cancel);
  el.addEventListener('touchstart',stop,{passive:true});el.addEventListener('mousedown',stop);
  return()=>{cancelAnimationFrame(frame);el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel);el.removeEventListener('touchstart',stop);el.removeEventListener('mousedown',stop);};
 },[stage]);
 return <div ref={track} className={`reel-scrubber part-progress swiper-no-swiping ${drag?'is-dragging':''}`} role="slider" aria-label="Videoda ilerle" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((drag?.ratio||0)*100)} tabIndex={-1}>
  {drag&&drag.duration>0&&<span className="reel-scrub-time" style={{left:`${drag.ratio*100}%`}}>{videoTime(drag.ratio*drag.duration)} / {videoTime(drag.duration)}</span>}
  <div className="reel-scrub-line"><span ref={bar}/><i ref={knob}/></div>
 </div>;
}

function BreakCard({active,minutes,watched,onContinue,onClose}:{active:boolean;minutes:number;watched:Post[];onContinue:()=>void;onClose:()=>void}){
 const recent=useMemo(()=>watched.slice(-BREAK_EVERY).slice(-3).reverse(),[active]);
 return <div className="reel-break" inert={!active}>
  <small>{minutes} dakikadır izliyorsun</small>
  <h2>Kısa bir ara</h2>
  <p>Son izlediklerinden aklında ne kaldı?</p>
  {recent.length>0&&<ul>{recent.map(p=><li key={p.id}>{p.title}</li>)}</ul>}
  <div className="reel-break-actions"><button className="is-primary" onClick={onContinue}>Devam et</button><button onClick={onClose}>Akışa dön</button></div>
 </div>;
}
