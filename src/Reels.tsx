import {lazy,memo,Suspense,useCallback,useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import type {Swiper as SwiperInstance} from 'swiper';
import {Swiper,SwiperSlide} from 'swiper/react';
import {Virtual,Mousewheel,Keyboard,A11y} from 'swiper/modules';
import {Bookmark,ChevronLeft,Heart,MessageCircle,Send,BookOpen,Volume2,VolumeX,Play,Pause,ExternalLink,Leaf,ArrowRight,RotateCw} from 'lucide-react';
import {useBackGesture} from './useBackGesture';
import {engagement,formatCount,reelQueue} from './social.mjs';
import {Avatar} from './components';
import {VideoPoster} from './VideoPoster';
import {useVideoStage,preloadVideoApi} from './VideoStage';
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
 const {stage,state}=useVideoStage();
 const seenAtOpen=useRef(user.seen);
 const queue=useRef<Post[]>([]);
 const [items,setItems]=useState<Item[]>(()=>{queue.current=reelQueue(posts,initialId,seenAtOpen.current);return withBreaks(queue.current,0);});
 const [active,setActive]=useState(0),[moving,setMoving]=useState(false);
 const startedAt=useRef(Date.now()),watched=useRef<Post[]>([]);
 const item=items[active],post=item?.post,video=post?.display==='video'?post.video:undefined;

 useEffect(()=>{stage.setOpen(true);preloadVideoApi();return()=>stage.setOpen(false);},[stage]);
 useEffect(()=>{root.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{stage.play(video,!!video&&visible);},[stage,video,visible]);
 useEffect(()=>{if(post){onSeen(post.id);if(!watched.current.includes(post))watched.current.push(post);}},[post?.id]);
 // Skip a video the publisher no longer allows here, after a short notice.
 useEffect(()=>{if(state.status!=='error'||!video||state.id!==video.url||!visible)return;const t=setTimeout(()=>swiper.current?.slideNext(),3200);return()=>clearTimeout(t);},[state.status,state.id,video,visible]);

 const extend=useCallback(()=>setItems(current=>{const more=reelQueue(posts,undefined,[]);queue.current=[...queue.current,...more];return [...current,...withBreaks(more,current.filter(i=>i.post).length)];}),[posts]);
 const onKey=(e:React.KeyboardEvent)=>{
  if((e.target as HTMLElement).closest('input,textarea,select'))return;
  if(e.key==='Escape'){e.preventDefault();onClose();}
  else if(e.key==='m'||e.key==='M'){stage.toggleSound();}
  else if(e.key===' '&&video){e.preventDefault();stage.hold(!state.held);}
 };
 const needsTap=!!video&&state.needsTap&&state.id===video.url;

 return createPortal(<div ref={root} tabIndex={-1} className="reels-root" data-needs-tap={needsTap||undefined} data-moving={moving||undefined} onKeyDown={onKey} role="region" aria-label="Reels">
  <header className="reels-top">
   <button className="reels-icon" aria-label="Reels akışını kapat" onClick={onClose}><ChevronLeft size={28}/></button>
   <strong className="reels-title">Reels</strong>
   {video&&<button className="reels-icon" aria-label={state.muted?'Sesi aç':'Sesi kapat'} aria-pressed={!state.muted} onClick={()=>stage.toggleSound()}>{state.muted?<VolumeX size={23}/>:<Volume2 size={23}/>}</button>}
  </header>
  <Swiper className="reels-swiper" onSwiper={s=>{swiper.current=s;}} direction="vertical" modules={[Virtual,Mousewheel,Keyboard,A11y]} virtual={{addSlidesBefore:1,addSlidesAfter:1}} speed={360} threshold={6} resistanceRatio={.35} a11y={{scrollOnFocus:false}} mousewheel={{forceToAxis:true,thresholdDelta:28}} keyboard={{enabled:visible}}
   onSliderFirstMove={()=>setMoving(true)} onSlideChangeTransitionStart={()=>setMoving(true)} onTransitionEnd={()=>setMoving(false)} onTouchEnd={s=>{if(!s.animating)setMoving(false);}}
   onSlideChange={s=>{setActive(s.activeIndex);if(s.activeIndex>=items.length-4)extend();}}>
   {items.map((it,i)=><SwiperSlide key={it.key} virtualIndex={i}>
    {it.break!==undefined?<BreakCard active={i===active} minutes={Math.max(1,Math.round((Date.now()-startedAt.current)/60000))} watched={watched.current} onContinue={()=>swiper.current?.slideNext()} onClose={onClose} onSave={onSave} saved={user.saved}/>
    :it.post&&<Reel post={it.post} user={user} active={i===active} near={Math.abs(i-active)<=1} moving={moving} visible={visible} onLike={onLike} onSave={onSave} onShare={onShare} onOpen={onOpen} onComments={onComments} onAccount={onAccount} onNext={()=>swiper.current?.slideNext()}/>}
   </SwiperSlide>)}
  </Swiper>
 </div>,document.body);
}

const Reel=memo(function Reel({post,user,active,near,moving,visible,onLike,onSave,onShare,onOpen,onComments,onAccount,onNext}:{post:Post;user:UserState;active:boolean;near:boolean;moving:boolean;visible:boolean;onLike:(id:string)=>void;onSave:(id:string)=>void;onShare:(p:Post)=>void;onOpen:(p:Post)=>void;onComments:(p:Post)=>void;onAccount:(p:Post)=>void;onNext:()=>void}){
 const video=post.display==='video'?post.video:undefined;
 const liked=user.liked.includes(post.id),saved=user.saved.includes(post.id),counts=engagement(post,user);
 const [hearts,setHearts]=useState<{id:number;x:number;y:number}[]>([]);
 const like=(x?:number,y?:number)=>{if(!liked)onLike(post.id);try{navigator.vibrate?.(12);}catch{}if(x!==undefined&&y!==undefined){const id=Date.now();setHearts(h=>[...h.slice(-2),{id,x,y}]);setTimeout(()=>setHearts(h=>h.filter(v=>v.id!==id)),900);}};
 return <div className={`reel ${video?'reel--video':'reel--film'}`} inert={!active} aria-hidden={!active}>
  {video?<VideoLayer post={post} active={active} moving={moving} onDoubleTap={like} onNext={onNext}/>
  :near&&<div className="reel-film"><Suspense fallback={<div className="reel-film-loading"><VideoPosterLike post={post}/></div>}><FilmPlayer post={post} active={active&&visible} onAccount={()=>onAccount(post)}/></Suspense></div>}
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

function VideoPosterLike({post}:{post:Post}){return <img className="reel-poster" src={post.cover.url} alt="" referrerPolicy="no-referrer"/>;}

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
function VideoLayer({post,active,moving,onDoubleTap,onNext}:{post:Post;active:boolean;moving:boolean;onDoubleTap:(x?:number,y?:number)=>void;onNext:()=>void}){
 const {stage,state}=useVideoStage();const video=post.video!;
 const mine=active&&state.id===video.url;
 const showing=mine&&!moving&&['playing','paused','needs-tap'].includes(state.status);
 const [pop,setPop]=useState<{key:number;muted:boolean}|null>(null);
 const gesture=useRef<{x:number;y:number;at:number;hold:number;held:boolean;moved:boolean}|null>(null);
 const lastTap=useRef<{at:number;x:number;y:number;timer:number}|null>(null);
 const down=(e:ReactPointerEvent<HTMLDivElement>)=>{
  if(!e.isPrimary||e.button>0)return;
  const g={x:e.clientX,y:e.clientY,at:Date.now(),hold:0,held:false,moved:false};
  g.hold=window.setTimeout(()=>{g.held=true;stage.hold(true);},260);gesture.current=g;
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(g&&!g.moved&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10){g.moved=true;clearTimeout(g.hold);if(g.held){g.held=false;stage.hold(false);}}};
 const up=(e:ReactPointerEvent<HTMLDivElement>)=>{
  const g=gesture.current;gesture.current=null;if(!g)return;clearTimeout(g.hold);
  if(g.held){stage.hold(false);return;}
  if(g.moved||Date.now()-g.at>500)return;
  const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  const last=lastTap.current;
  if(last&&Date.now()-last.at<300&&Math.hypot(last.x-x,last.y-y)<60){clearTimeout(last.timer);lastTap.current=null;onDoubleTap(x,y);return;}
  const timer=window.setTimeout(()=>{lastTap.current=null;stage.toggleSound();setPop({key:Date.now(),muted:!stage.state.muted});},240);
  lastTap.current={at:Date.now(),x,y,timer};
 };
 const cancel=()=>{const g=gesture.current;gesture.current=null;if(g){clearTimeout(g.hold);if(g.held)stage.hold(false);}};
 useEffect(()=>()=>{if(lastTap.current)clearTimeout(lastTap.current.timer);},[]);
 const loading=active&&!showing&&!moving&&(!mine||state.status==='loading');
 return <div className={`reel-video ${video.orientation==='landscape'?'is-landscape':''}`}>
  <div className={`reel-poster-wrap ${showing?'is-hidden':''}`}><VideoPoster post={post} className="reel-poster" eager={active}/>{video.orientation==='landscape'&&<VideoPoster post={post} className="reel-poster-backdrop"/>}</div>
  <div className="reel-shade" aria-hidden="true"/>
  <div className="reel-gesture" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onContextMenu={e=>e.preventDefault()} aria-label="Sesi aç veya kapat, basılı tutarak durdur, iki kez dokunarak beğen" role="button" tabIndex={-1}/>
  {loading&&<span className="reel-loading" aria-label="Video yükleniyor" role="status"/>}
  {mine&&state.held&&<span className="reel-center-icon is-paused" aria-hidden="true"><Pause size={34} fill="currentColor"/></span>}
  {pop&&<span key={pop.key} className="reel-center-icon is-pop" aria-hidden="true">{pop.muted?<VolumeX size={30}/>:<Volume2 size={30}/>}</span>}
  {mine&&state.needsTap&&<div className="reel-tap-hint" role="status"><span><Play size={30} fill="currentColor"/></span><strong>{state.tapReason==='sound'?'Sesli izlemek için videoya dokun':'Başlatmak için videoya dokun'}</strong><small>Bir kez yeterli; sonraki videolar kendiliğinden sesli akar.</small></div>}
  {mine&&state.status==='playing'&&state.muted&&!state.needsTap&&<button className="reel-sound-pill" onClick={()=>stage.toggleSound()}><VolumeX size={15}/> Sesi aç</button>}
  {mine&&state.status==='error'&&<div className="reel-error" role="status"><p>{state.error}</p><a href={`https://www.youtube.com/watch?v=${video.url}`} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a><button onClick={onNext}>Sıradaki <ArrowRight size={14}/></button></div>}
  {mine&&<ReelProgress playing={state.status==='playing'}/>}
 </div>;
}

function ReelProgress({playing}:{playing:boolean}){
 const {stage}=useVideoStage();const bar=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  let frame=0,last=-1;
  const draw=()=>{const {time,duration}=stage.progress();const value=duration>0?Math.min(1,time/duration):0;if(Math.abs(value-last)>.001&&bar.current){bar.current.style.transform=`scaleX(${value})`;last=value;}frame=requestAnimationFrame(draw);};
  if(playing)frame=requestAnimationFrame(draw);else{const {time,duration}=stage.progress();if(bar.current)bar.current.style.transform=`scaleX(${duration>0?time/duration:0})`;}
  return()=>cancelAnimationFrame(frame);
 },[playing,stage]);
 return <div className="reel-progress" aria-hidden="true"><span ref={bar}/></div>;
}

function BreakCard({active,minutes,watched,onContinue,onClose,onSave,saved}:{active:boolean;minutes:number;watched:Post[];onContinue:()=>void;onClose:()=>void;onSave:(id:string)=>void;saved:string[]}){
 const recent=useMemo(()=>watched.slice(-BREAK_EVERY).filter(p=>p.display==='video'||p.slides.length).slice(-3).reverse(),[active]);
 return <div className="reel-break" inert={!active}>
  <span className="reel-break-icon"><Leaf size={26}/></span>
  <h2>Kısa bir mola?</h2>
  <p>{minutes} dakikadır keşfediyorsun. Aklında kalanları bir an düşün; öğrenmek biraz da durup hatırlamaktır.</p>
  {recent.length>0&&<ul>{recent.map(p=><li key={p.id}><span>{p.title}</span><button aria-label={saved.includes(p.id)?'Kaydedildi':'Kaydet'} aria-pressed={saved.includes(p.id)} onClick={()=>onSave(p.id)}><Bookmark size={16} fill={saved.includes(p.id)?'currentColor':'none'}/></button></li>)}</ul>}
  <div className="reel-break-actions"><button className="is-primary" onClick={onContinue}><RotateCw size={16}/> Devam et</button><button onClick={onClose}>Burada bırak</button></div>
 </div>;
}
