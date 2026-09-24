import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Volume2,VolumeX,Maximize,RotateCcw,Settings2} from 'lucide-react';
import {rememberPosition,rememberedPosition} from './playback.mjs';
import {youtubeOptions,videoTime} from './youtube.mjs';
import type {Post} from './types';

type Player={playVideo:()=>void;pauseVideo:()=>void;mute:()=>void;unMute:()=>void;isMuted:()=>boolean;getCurrentTime:()=>number;getDuration:()=>number;seekTo:(seconds:number,allowSeekAhead:boolean)=>void;getIframe:()=>HTMLIFrameElement;destroy:()=>void};
type PlayerEvent={target:Player;data:number};
type YouTubeApi={Player:new(host:HTMLElement,options:Record<string,unknown>)=>Player};
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
export default function YouTubePlayer({video,active,mode,onMode,clean=false,immersive=false,mutedPreference,onMute}:{active:boolean;mutedPreference:boolean;onMute:(muted:boolean)=>void;clean?:boolean;immersive?:boolean;video:NonNullable<Post['video']>;mode:'minimal'|'native';onMode:(mode:'minimal'|'native')=>void}){
 const hasPlayed=useRef(false);
 const host=useRef<HTMLDivElement>(null),shell=useRef<HTMLDivElement>(null),player=useRef<Player|null>(null);
 const activeRef=useRef(active),muteRef=useRef(mutedPreference);activeRef.current=active;muteRef.current=mutedPreference;
 const [ready,setReady]=useState(false),[state,setState]=useState(-1),[muted,setMuted]=useState(mutedPreference),[time,setTime]=useState(()=>rememberedPosition(video.url)),[duration,setDuration]=useState(video.duration||0),[error,setError]=useState(''),[blocked,setBlocked]=useState(false);
 const savePosition=(p:Player)=>{try{const seconds=p.getCurrentTime();if(hasPlayed.current||seconds>0)rememberPosition(video.url,seconds,p.getDuration());}catch{}};
 useEffect(()=>{
  let cancelled=false,instance:Player|null=null;let retriedMuted=false;
  hasPlayed.current=false;setReady(false);setError('');setState(-1);setBlocked(false);
  loadApi().then(api=>{
   if(cancelled||!host.current)return;
   const mount=document.createElement('div');host.current.replaceChildren(mount);
   instance=new api.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:video.url,width:'100%',height:'100%',playerVars:{...youtubeOptions(mode,location.origin),autoplay:0,mute:1,start:Math.floor(rememberedPosition(video.url))},events:{
    onReady:(event:PlayerEvent)=>{if(cancelled)return;const p=event.target;player.current=p;setReady(true);const position=rememberedPosition(video.url);if(position)p.seekTo(position,true);if(muteRef.current)p.mute();else p.unMute();setMuted(p.isMuted());setDuration(p.getDuration()||video.duration||0);p.pauseVideo();},
    onStateChange:(event:PlayerEvent)=>{if(cancelled)return;const p=event.target;if(event.data===1&&!activeRef.current){p.pauseVideo();return;}if(event.data===1)hasPlayed.current=true;setState(event.data);setTime(p.getCurrentTime()||0);setMuted(p.isMuted());savePosition(p);if(event.data===1)setBlocked(false);},
    onAutoplayBlocked:(event:PlayerEvent)=>{if(cancelled||!activeRef.current)return;if(!retriedMuted){retriedMuted=true;event.target.mute();setMuted(true);event.target.playVideo();}else setBlocked(true);},
    onError:()=>{if(!cancelled)setError('Bu video burada açılamadı. Kaynağında izleyebilirsin.');}
   }});
   const frame=instance.getIframe();frame.title=video.title;frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
  }).catch(()=>{if(!cancelled)setError('Oynatıcıya bağlanılamadı. Kaynak bağlantısını deneyebilirsin.');});
  return()=>{cancelled=true;if(instance){if(player.current===instance)savePosition(instance);try{instance.destroy();}catch{}}player.current=null;};
 },[video.url,mode]);
 useEffect(()=>{const p=player.current;if(!ready||!p)return;if(active)p.playVideo();else{savePosition(p);p.pauseVideo();}},[active,ready]);
 useEffect(()=>{const p=player.current;if(!ready||!p)return;if(mutedPreference)p.mute();else p.unMute();setMuted(p.isMuted());},[mutedPreference,ready]);
 useEffect(()=>{if(!ready||state!==1)return;const tick=window.setInterval(()=>{const p=player.current;if(p){const seconds=p.getCurrentTime()||0;setTime(seconds);setDuration(p.getDuration()||video.duration||0);savePosition(p);}},500);return()=>clearInterval(tick);},[ready,state,video.url,video.duration]);
 const play=()=>{const p=player.current;if(!p)return;if(state===1)p.pauseVideo();else{if(state===0)p.seekTo(0,true);p.playVideo();}};
 const volume=()=>{const p=player.current;if(!p)return;const next=!p.isMuted();if(next)p.mute();else p.unMute();setMuted(next);onMute(next);};
 const full=()=>{const el=shell.current;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else if(el?.requestFullscreen)el.requestFullscreen().catch(()=>onMode('native'));else onMode('native');};
 return <div className="youtube-shell" ref={shell}><div className="native-video-stage"><div className="youtube-host" ref={host}/></div>
  {!clean&&<div className="quiet-video-controls" role="group" aria-label="Video denetimleri"><button onClick={play} disabled={!ready} aria-label={state===1?'Videoyu duraklat':state===0?'Videoyu yeniden oynat':'Videoyu oynat'}>{state===1?<Pause size={19}/>:state===0?<RotateCcw size={19}/>:<Play size={19}/>}</button><input type="range" aria-label="Video konumu" min={0} max={duration||1} step={1} value={Math.min(time,duration||1)} disabled={!ready} onChange={e=>{const n=Number(e.target.value);setTime(n);rememberPosition(video.url,n,duration);player.current?.seekTo(n,true);}}/><span className="video-clock">{videoTime(time)} / {videoTime(duration)}</span><button onClick={volume} disabled={!ready} aria-label={muted?'Video sesini aç':'Video sesini kapat'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><button onClick={full} aria-label="Videoyu tam ekran aç"><Maximize size={17}/></button><button onClick={()=>onMode(mode==='minimal'?'native':'minimal')} aria-label={mode==='minimal'?'Standart video denetimlerini aç':'Sade video denetimlerini aç'}><Settings2 size={17}/></button></div>}
  {error?<div className="video-player-options"><span role="status">{error}</span><a href={`https://www.youtube.com/watch?v=${video.url}`} target="_blank" rel="noreferrer">Kaynağında izle</a></div>:blocked?<div className="video-player-options"><button onClick={play}>Videoyu başlat</button></div>:!clean&&<div className={`video-player-options ${immersive?'immersive-player-status':''}`}><span role="status">{!ready?'Oynatıcı yükleniyor…':state===3?'Video yükleniyor…':''}</span></div>}
 </div>;
}
