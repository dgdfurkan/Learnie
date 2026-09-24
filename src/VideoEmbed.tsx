import {useEffect,useRef,useState} from 'react';
import YouTubePlayer from './YouTubePlayer';
import {usePreferences} from './Preferences';
import {useVideoVisibility} from './useVideoVisibility';
import {rememberedPosition,rememberPosition} from './playback.mjs';
import {Play,ExternalLink} from 'lucide-react';
import type {Post} from './types';
export default function VideoEmbed({post,active=true,immersive=false,clean=false}:{post:Post;active?:boolean;immersive?:boolean;clean?:boolean}){
 const {prefs,setPrefs}=usePreferences();
 const container=useRef<HTMLDivElement>(null),file=useRef<HTMLVideoElement>(null);const video=post.video;
 const visible=useVideoVisibility(container,active),[started,setStarted]=useState(false);
 useEffect(()=>{if(visible)setStarted(true);},[visible]);
 useEffect(()=>{const v=file.current;if(!v)return;if(visible){void v.play().catch(()=>{v.muted=true;void v.play().catch(()=>{});});}else v.pause();},[visible,started]);
 useEffect(()=>()=>{const v=file.current;if(v&&video)rememberPosition(video.url,v.currentTime,v.duration);},[video?.url]);
 if(!video)return null;
 return <div className={`native-video ${video.orientation==='portrait'?'native-video--portrait':''} ${immersive?'native-video--immersive':''}`} ref={container}>{started&&video.kind==='youtube'?<YouTubePlayer video={video} active={visible} mode={prefs.videoControls} clean={clean} immersive={immersive} mutedPreference={prefs.videoMuted} onMute={videoMuted=>setPrefs({videoMuted})} onMode={videoControls=>setPrefs({videoControls})}/>:<div className="native-video-stage">{started?<video ref={file} src={video.url} controls={!clean} muted={prefs.videoMuted} playsInline preload="metadata" onLoadedMetadata={e=>{e.currentTarget.currentTime=rememberedPosition(video.url);if(visible)void e.currentTarget.play().catch(()=>{});}} onTimeUpdate={e=>rememberPosition(video.url,e.currentTarget.currentTime,e.currentTarget.duration)}/>:<button className="video-poster" onClick={()=>setStarted(true)} aria-label={`${video.title} videosunu oynat`}><VideoPoster post={post} className="video-poster-image"/><span className="video-play"><Play fill="currentColor" size={30}/></span><span className="video-length">{video.duration?`${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}`:'Video'}</span></button>}</div>}{!immersive&&<div className="video-credit"><span>{video.publisher&&<strong>{video.publisher} · </strong>}{video.language}</span><a href={video.kind==='youtube'?`https://www.youtube.com/watch?v=${video.url}`:video.url} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a></div>}</div>;
}
export function VideoPoster({post,className=''}:{post:Post;className?:string}){
 const [fallback,setFallback]=useState(0);const video=post.video;
 const standard=video?.kind==='youtube'?`https://i.ytimg.com/vi/${video.url}/hqdefault.jpg`:post.cover.url;
 const primary=video?.poster||standard;
 if(fallback>=2)return <span className={`${className} video-poster-fallback`} role="img" aria-label={post.title}><small>{video?.publisher||post.account}</small><strong>{post.title}</strong></span>;
 return <img className={className} src={fallback?standard:primary} alt="" loading="lazy" onError={()=>setFallback(n=>n+1)}/>;
}
