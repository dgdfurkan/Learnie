import {useEffect,useRef,useState} from 'react';
import {Play,ExternalLink} from 'lucide-react';
import type {Post} from './types';
export default function VideoEmbed({post,active=true}:{post:Post;active?:boolean}){
 const [playing,setPlaying]=useState(false);const container=useRef<HTMLDivElement>(null);const video=post.video;
 useEffect(()=>{if(!active)setPlaying(false);},[active]);
 useEffect(()=>{const el=container.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)setPlaying(false);},{threshold:.15});observer.observe(el);const hide=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',hide);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',hide);};},[]);
 if(!video)return null;
 return <div className={`native-video ${video.orientation==='portrait'?'native-video--portrait':''}`} ref={container}><div className="native-video-stage">{playing?(video.kind==='youtube'?<iframe src={`https://www.youtube-nocookie.com/embed/${video.url}?autoplay=1&playsinline=1&hl=tr&rel=0&cc_lang_pref=tr&cc_load_policy=1`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<video src={video.url} controls autoPlay playsInline preload="metadata"/>):<button className="video-poster" onClick={()=>setPlaying(true)} aria-label={`${video.title} videosunu oynat`}><VideoPoster post={post} className="video-poster-image"/><span className="video-play"><Play fill="currentColor" size={30}/></span><span className="video-length">{video.duration?`${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}`:'Video'}</span></button>}</div><div className="video-credit"><span>{video.publisher&&<strong>{video.publisher} · </strong>}{video.language}</span><a href={video.kind==='youtube'?`https://www.youtube.com/watch?v=${video.url}`:video.url} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a></div></div>;
}

export function VideoPoster({post,className=''}:{post:Post;className?:string}){
 const [fallback,setFallback]=useState(0);const video=post.video;
 const standard=video?.kind==='youtube'?`https://i.ytimg.com/vi/${video.url}/hqdefault.jpg`:post.cover.url;
 const primary=video?.poster||standard;
 if(fallback>=2)return <span className={`${className} video-poster-fallback`} role="img" aria-label={post.title}><small>{video?.publisher||post.account}</small><strong>{post.title}</strong></span>;
 return <img className={className} src={fallback?standard:primary} alt="" loading="lazy" onError={()=>setFallback(n=>n+1)}/>;
}
