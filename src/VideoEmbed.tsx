import {useEffect,useRef,useState} from 'react';
import YouTubePlayer from './YouTubePlayer';
import {usePreferences} from './Preferences';
import {useVideoVisibility} from './useVideoVisibility';
import {rememberedPosition,rememberPosition} from './playback.mjs';
import {ExternalLink} from 'lucide-react';
import type {Post} from './types';
export default function VideoEmbed({post,active=true,immersive=false}:{post:Post;active?:boolean;immersive?:boolean}){
 const {prefs,setPrefs}=usePreferences();
 const container=useRef<HTMLDivElement>(null),file=useRef<HTMLVideoElement>(null);const video=post.video;
 const expectedSound=useRef<{muted:boolean;volume:number}|null>(null);
 const visible=useVideoVisibility(container,active),[started,setStarted]=useState(false);
 useEffect(()=>{if(visible)setStarted(true);},[visible]);
 useEffect(()=>{const v=file.current;if(!v)return;expectedSound.current={muted:prefs.videoMuted,volume:prefs.videoVolume/100};v.muted=prefs.videoMuted;v.volume=prefs.videoVolume/100;},[started,prefs.videoMuted,prefs.videoVolume]);
 useEffect(()=>{
  const v=file.current;if(!v||!video)return;
  let cancelled=false;
  if(visible){void v.play().catch(()=>{if(cancelled)return;expectedSound.current={muted:true,volume:v.volume};v.muted=true;void v.play().catch(()=>{});});}else v.pause();
  return()=>{cancelled=true;rememberPosition(video.url,v.currentTime,v.duration);v.pause();};
 },[visible,started,video?.url]);
 if(!video)return null;
 return <div className={`native-video ${video.orientation==='portrait'?'native-video--portrait':''} ${immersive?'native-video--immersive':''}`} ref={container}>
  {started&&video.kind==='youtube'?<YouTubePlayer video={video} active={visible} mutedPreference={prefs.videoMuted} volumePreference={prefs.videoVolume} onSound={(videoMuted,videoVolume)=>setPrefs({videoMuted,videoVolume})}/>:<div className="native-video-stage">{started?<video ref={file} src={video.url} controls playsInline preload="metadata" onLoadedMetadata={e=>{e.currentTarget.currentTime=rememberedPosition(video.url);}} onTimeUpdate={e=>rememberPosition(video.url,e.currentTarget.currentTime,e.currentTarget.duration)} onVolumeChange={e=>{const v=e.currentTarget;if(expectedSound.current&&v.muted===expectedSound.current.muted&&v.volume===expectedSound.current.volume)return;expectedSound.current=null;setPrefs({videoMuted:v.muted,videoVolume:Math.round(v.volume*100)});}}/>:<div className="video-poster" role="img" aria-label={video.title}><VideoPoster post={post} className="video-poster-image"/><span className="video-length">{video.duration?`${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}`:'Video'}</span></div>}</div>}
  {!immersive&&<div className="video-credit"><span>{video.publisher&&<strong>{video.publisher} · </strong>}{video.language}</span><a href={video.kind==='youtube'?`https://www.youtube.com/watch?v=${video.url}`:video.url} target="_blank" rel="noreferrer">Kaynağında izle <ExternalLink size={13}/></a></div>}
 </div>;
}
export function VideoPoster({post,className=''}:{post:Post;className?:string}){
 const [fallback,setFallback]=useState(0);const video=post.video;
 const standard=video?.kind==='youtube'?`https://i.ytimg.com/vi/${video.url}/hqdefault.jpg`:post.cover.url;
 const primary=video?.poster||standard;
 if(fallback>=2)return <span className={`${className} video-poster-fallback`} role="img" aria-label={post.title}><small>{video?.publisher||post.account}</small><strong>{post.title}</strong></span>;
 return <img className={className} src={fallback?standard:primary} alt="" loading="lazy" onError={()=>setFallback(n=>n+1)}/>;
}
