import {lazy,memo,Suspense,useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import type {Swiper as SwiperInstance} from 'swiper';
import {Swiper,SwiperSlide} from 'swiper/react';
import {Virtual,Mousewheel,Keyboard,A11y} from 'swiper/modules';
import {Bookmark,ChevronLeft,Heart,MessageCircle,Send,BookOpen,Volume2,VolumeX,Play,ExternalLink,ArrowRight,Eye,EyeOff,Captions,CaptionsOff} from 'lucide-react';
import {useBackGesture} from './useBackGesture';
import {engagement,formatCount,reelQueue} from './social.mjs';
import {Avatar} from './components';
import {VideoPoster} from './VideoPoster';
import {useVideoStage,preloadVideoApi} from './VideoStage';
import {usePreferences} from './Preferences';
import {videoTime} from './youtube.mjs';
import type {Post,UserState} from './types';
import 'swiper/css';

const FilmPlayer=lazy(()=>import('./Film').then(m=>({default:m.FilmPlayer})));
const BREAK_EVERY=18;
type Item={key:string;post?:Post;break?:number};
type Props={initialId?:string;posts:Post[];user:UserState;onLike:(id:string)=>void;onSave:(id:string)=>void;onShare:(p:Post)=>void;onOpen:(p:Post)=>void;onSeen:(id:string)=>void;onClose:()=>void;onComments:(p:Post)=>void;onAccount:(p:Post)=>void;visible?:boolean};

function withBreaks(posts:Post[],offset:number):Item[]{
 const out:Item[]=[];posts.forEach((post,i)=>{const n=offset+i;if(n>0&&n%BREAK_EVERY===0)out.push({key:`break-${n}`,break:n});out.push({key:`${post.id}-${n}`,post});});return out;
}

export default function Reels({posts,user,onLike,onSave,onShare,onOpen,onSeen,onClose,onComments,onAccount,visible=true,initialId}:Props){
 const root=useRef<HTMLDivElement>(null),swiper=useRef<SwiperInstance|null>(null);
 useBackGesture(root,()=>{if(visible)onClose();});
 const {stage,state}=useVideoStage();const {prefs,setPrefs}=usePreferences();
 const [items,setItems]=useState<Item[]>(()=>withBreaks(reelQueue(posts,initialId,user.seen),0));
 // `active` follows the finger; `owner` is the slide whose video the player holds.
 // The owner only changes once a swipe has settled, so the playing video keeps
 // moving with the finger instead of being replaced by a still poster.
 const [active,setActive]=useState(0),[owner,setOwner]=useState(0),[clean,setClean]=useState(false);
 const ownerRef=useRef(0),transition=useRef(0);ownerRef.current=owner;
 const startedAt=useRef(Date.now()),watched=useRef<Post[]>([]);
 const ownerPost=items[owner]?.post,video=ownerPost?.display==='video'?ownerPost.video:undefined;

 useEffect(()=>{stage.enterReels();preloadVideoApi();root.current?.focus({preventScroll:true});return()=>stage.leaveReels();},[stage]);
 useEffect(()=>{stage.play(video,!!video&&visible);},[stage,video,visible]);
 useEffect(()=>{const s=swiper.current;if(s)stage.setOffset(s.translate+owner*s.height,0);},[owner,stage]);
 useEffect(()=>{const p=items[active]?.post;if(p){onSeen(p.id);if(!watched.current.includes(p))watched.current.push(p);}},[active]);
 // Skip a video the publisher no longer allows here, after a short notice.
 useEffect(()=>{if(state.status!=='error'||!video||state.id!==video.url||!visible)return;const t=setTimeout(()=>swiper.current?.slideNext(),3200);return()=>clearTimeout(t);},[state.status,state.id,video,visible]);

 const extend=useCallback(()=>setItems(current=>[...current,...withBreaks(reelQueue(posts,undefined,[]),current.filter(i=>i.post).length)]),[posts]);
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

 return createPortal(<div ref={root} tabIndex={-1} className="reels-root" data-clean={clean||undefined} data-needs-tap={needsTap||undefined} onKeyDown={onKey} role="region" aria-label="Reels">
  <header className="reels-top">
   <button className="reels-icon reels-back" aria-label="Reels akışını kapat" onClick={onClose}><ChevronLeft size={28}/></button>
   <strong className="reels-title">Reels</strong>
   {video&&<button className="reels-icon reels-extra" aria-label={prefs.videoCaptions?'Altyazıyı kapat':'Altyazıyı aç'} aria-pressed={prefs.videoCaptions} onClick={()=>setPrefs({videoCaptions:!prefs.videoCaptions})}>{prefs.videoCaptions?<Captions size={23}/>:<CaptionsOff size={23}/>}</button>}
   {video&&<button className="reels-icon reels-extra" aria-label={state.muted?'Sesi aç':'Sesi kapat'} aria-pressed={!state.muted} onClick={()=>stage.toggleSound()}>{state.muted?<VolumeX size={23}/>:<Volume2 size={23}/>}</button>}
   <button className="reels-icon reels-eye" aria-label={clean?'Arayüzü göster':'Arayüzü gizle, sadece videoyu izle'} aria-pressed={clean} onClick={()=>setClean(v=>!v)}>{clean?<Eye size={23}/>:<EyeOff size={23}/>}</button>
  </header>
  <Swiper className="reels-swiper" onSwiper={s=>{swiper.current=s;}} direction="vertical" modules={[Virtual,Mousewheel,Keyboard,A11y]} virtual={{addSlidesBefore:1,addSlidesAfter:1}} speed={320} threshold={5} resistanceRatio={.35} a11y={{scrollOnFocus:false}} mousewheel={{forceToAxis:true,thresholdDelta:28}} keyboard={{enabled:visible}}
   onSetTransition={(_s,ms)=>{transition.current=ms;}}
   onSetTranslate={(s,t)=>stage.setOffset(t+ownerRef.current*s.height,transition.current)}
   onSlideChange={s=>{setActive(s.activeIndex);clearTimeout(settleTimer.current);settleTimer.current=window.setTimeout(()=>settle(s),s.params.speed!+120);if(s.activeIndex>=items.length-4)extend();}}
   onSlideChangeTransitionEnd={settle} onTransitionEnd={settle}>
   {items.map((it,i)=><SwiperSlide key={it.key} virtualIndex={i}>
    {it.break!==undefined?<BreakCard active={i===active} minutes={Math.max(1,Math.round((Date.now()-startedAt.current)/60000))} watched={watched.current} onContinue={()=>swiper.current?.slideNext()} onClose={onClose}/>
    :it.post&&<Reel post={it.post} user={user} active={i===active} owner={i===owner} near={Math.abs(i-active)<=1} visible={visible} onLike={onLike} onSave={onSave} onShare={onShare} onOpen={onOpen} onComments={onComments} onAccount={onAccount} onNext={()=>swiper.current?.slideNext()}/>}
   </SwiperSlide>)}
  </Swiper>
 </div>,document.body);
}

const Reel=memo(function Reel({post,user,active,owner,near,visible,onLike,onSave,onShare,onOpen,onComments,onAccount,onNext}:{post:Post;user:UserState;active:boolean;owner:boolean;near:boolean;visible:boolean;onLike:(id:string)=>void;onSave:(id:string)=>void;onShare:(p:Post)=>void;onOpen:(p:Post)=>void;onComments:(p:Post)=>void;onAccount:(p:Post)=>void;onNext:()=>void}){
 const video=post.display==='video'?post.video:undefined;
 const liked=user.liked.includes(post.id),saved=user.saved.includes(post.id),counts=engagement(post,user);
 const [hearts,setHearts]=useState<{id:number;x:number;y:number}[]>([]);
 const like=(x?:number,y?:number)=>{if(!liked)onLike(post.id);try{navigator.vibrate?.(12);}catch{}if(x!==undefined&&y!==undefined){const id=Date.now();setHearts(h=>[...h.slice(-2),{id,x,y}]);setTimeout(()=>setHearts(h=>h.filter(v=>v.id!==id)),900);}};
 return <div className={`reel ${video?'reel--video':'reel--film'}`} inert={!active} aria-hidden={!active}>
  {video?<VideoLayer post={post} owner={owner} onDoubleTap={like} onNext={onNext}/>
  :near&&<div className="reel-film"><Suspense fallback={<div className="reel-film-loading"/>}><FilmPlayer post={post} active={active&&owner&&visible} onAccount={()=>onAccount(post)}/></Suspense></div>}
  {hearts.map(h=><span key={h.id} className="reel-heart" style={{left:h.x,top:h.y}}><Heart fill="currentColor" size={96}/></span>)}
  <aside className="reel-actions" aria-label="Gönderi işlemleri">
   <button className={`reel-action ${liked?'is-on is-liked':''}`} aria-label={liked?'Beğeniyi kaldır':'Beğen'} aria-pressed={liked} onClick={()=>onLike(post.id)}><Heart fill={liked?'currentColor':'none'}/><span>{formatCount(counts.likes)}</span></button>
   <button className="reel-action" aria-label="Yorumlar" onClick={()=>onComments(post)}><MessageCircle/><span>{counts.comments||''}</span></button>
   <button className="reel-action" aria-label="Paylaş" onClick={()=>onShare(post)}><Send/><span>{counts.shares?formatCount(counts.shares):''}</span></button>
   <button className={`reel-action ${saved?'is-on':''}`} aria-label={saved?'Koleksiyonları düzenle':'Kaydet'} aria-pressed={saved} onClick={()=>onSave(post.id)}><Bookmark fill={saved?'currentColor':'none'}/></button>
   <button className="reel-action" aria-label="Notunu oku" onClick={()=>onOpen(post)}><BookOpen/></button>
  </aside>
  {video&&<ReelMeta post={post} onAccount={()=>onAccount(post)} onOpen={()=>onOpen(post)}/>}
 </div>;
});

function ReelMeta({post,onAccount,onOpen}:{post:Post;onAccount:()=>void;onOpen:()=>void}){
 const [open,setOpen]=useState(false);const video=post.video!;
 return <div className={`reel-meta ${open?'is-open':''}`}>
  <button className="reel-account" onClick={onAccount} aria-label={`${post.account} profilini aç`}><Avatar post={post}/><strong>{post.account}</strong><span className="reel-chip">{post.category}</span></button>
  <h2 className="reel-title">{post.title}</h2>
  <button className="reel-caption" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{post.subtitle}</button>
  <div className="reel-source"><a href={video.kind==='youtube'?`https://www.youtube.com/watch?v=${video.url}`:video.url} target="_blank" rel="noreferrer"><Play size={11} fill="currentColor"/>{video.publisher||'Kaynak'}<ExternalLink size={11}/></a>{open&&<button onClick={onOpen}>Notu aç <ArrowRight size={12}/></button>}</div>
 </div>;
}

/** Poster, gestures and status for a video reel. The video itself plays in the shared stage underneath. */
function VideoLayer({post,owner,onDoubleTap,onNext}:{post:Post;owner:boolean;onDoubleTap:(x?:number,y?:number)=>void;onNext:()=>void}){
 const {stage,state}=useVideoStage();const video=post.video!;
 const mine=owner&&state.id===video.url;
 const showing=mine&&['playing','paused','needs-tap'].includes(state.status);
 const gesture=useRef<{x:number;y:number;at:number;hold:number;held:boolean;moved:boolean}|null>(null);
 const lastTap=useRef<{at:number;x:number;y:number;timer:number}|null>(null);
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!e.isPrimary||e.button>0)return;
  const g={x:e.clientX,y:e.clientY,at:Date.now(),hold:0,held:false,moved:false};
  g.hold=window.setTimeout(()=>{if(!stage.state.held){g.held=true;stage.hold(true);}},320);gesture.current=g;
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(g&&!g.moved&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){g.moved=true;clearTimeout(g.hold);if(g.held){g.held=false;stage.hold(false);}}};
 const up=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;gesture.current=null;if(!g)return;clearTimeout(g.hold);
  if(g.held){stage.hold(false);return;}
  if(g.moved||Date.now()-g.at>500)return;
  const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  const last=lastTap.current;
  if(last&&Date.now()-last.at<280&&Math.hypot(last.x-x,last.y-y)<60){clearTimeout(last.timer);lastTap.current=null;onDoubleTap(x,y);return;}
  const timer=window.setTimeout(()=>{lastTap.current=null;stage.togglePause();},230);
  lastTap.current={at:Date.now(),x,y,timer};
 };
 const cancel=()=>{const g=gesture.current;gesture.current=null;if(g){clearTimeout(g.hold);if(g.held)stage.hold(false);}};
 useEffect(()=>()=>{if(lastTap.current)clearTimeout(lastTap.current.timer);},[]);
 const loading=owner&&(!mine||state.status==='loading');
 return <div className={`reel-video ${video.orientation==='landscape'?'is-landscape':''}`}>
  <div className={`reel-poster-wrap ${showing?'is-hidden':''}`}><VideoPoster post={post} className="reel-poster" eager={owner}/></div>
  <div className="reel-shade" aria-hidden="true"/>
  <div className="reel-gesture" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onContextMenu={e=>e.preventDefault()} aria-label="Dokun: durdur veya oynat. İki kez dokun: beğen." role="button" tabIndex={-1}/>
  {loading&&<span className="reel-loading" aria-label="Video yükleniyor" role="status"/>}
  {mine&&state.held&&<span className="reel-center-icon is-paused" aria-hidden="true"><Play size={34} fill="currentColor"/></span>}
  {mine&&state.needsTap&&<div className="reel-tap-hint" role="status"><span><Play size={30} fill="currentColor"/></span><strong>{state.tapReason==='sound'?'Sesli izlemek için videoya dokun':'Başlatmak için videoya dokun'}</strong><small>Bir kez yeterli; sonraki videolar kendiliğinden sesli akar.</small></div>}
  {mine&&state.status==='playing'&&state.muted&&!state.needsTap&&<button className="reel-sound-pill" onClick={()=>stage.toggleSound()}><VolumeX size={15}/> Sesi aç</button>}
  {mine&&state.status==='error'&&<div className="reel-error" role="status"><p>{state.error}</p><a href={`https://www.youtube.com/watch?v=${video.url}`} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a><button onClick={onNext}>Sıradaki <ArrowRight size={14}/></button></div>}
  {mine&&<Scrubber playing={state.status==='playing'}/>}
 </div>;
}

/** Instagram-style scrubber: a thin line that thickens under the finger and seeks on release. */
function Scrubber({playing}:{playing:boolean}){
 const {stage}=useVideoStage();const bar=useRef<HTMLSpanElement>(null),track=useRef<HTMLDivElement>(null);
 const [drag,setDrag]=useState<{ratio:number;duration:number}|null>(null);const dragging=useRef(false);
 useEffect(()=>{
  let frame=0,last=-1;
  const draw=()=>{if(!dragging.current){const {time,duration}=stage.progress();const v=duration>0?Math.min(1,time/duration):0;if(Math.abs(v-last)>.001&&bar.current){bar.current.style.transform=`scaleX(${v})`;last=v;}}frame=requestAnimationFrame(draw);};
  frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[playing,stage]);
 const set=(x:number)=>{const r=track.current!.getBoundingClientRect();const ratio=Math.min(1,Math.max(0,(x-r.left)/r.width)),{duration}=stage.progress();if(bar.current)bar.current.style.transform=`scaleX(${ratio})`;setDrag({ratio,duration});return {ratio,duration};};
 return <div ref={track} className={`reel-scrubber swiper-no-swiping ${drag?'is-dragging':''}`} role="slider" aria-label="Videoda ilerle" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((drag?.ratio||0)*100)} tabIndex={-1}
  onPointerDown={e=>{e.stopPropagation();dragging.current=true;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}set(e.clientX);}}
  onPointerMove={e=>{if(dragging.current){e.stopPropagation();set(e.clientX);}}}
  onPointerUp={e=>{if(!dragging.current)return;e.stopPropagation();const {ratio,duration}=set(e.clientX);dragging.current=false;setDrag(null);if(duration>0)stage.seek(ratio*duration);}}
  onPointerCancel={()=>{dragging.current=false;setDrag(null);}}>
  {drag&&drag.duration>0&&<span className="reel-scrub-time" style={{left:`${drag.ratio*100}%`}}>{videoTime(drag.ratio*drag.duration)} / {videoTime(drag.duration)}</span>}
  <div className="reel-scrub-line"><span ref={bar}/></div>
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
