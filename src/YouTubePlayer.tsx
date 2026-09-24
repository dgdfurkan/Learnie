import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Volume2,VolumeX,Maximize,RotateCcw,Settings2} from 'lucide-react';
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
export default function YouTubePlayer({video,mode,onMode,clean=false,immersive=false}:{clean?:boolean;immersive?:boolean;video:NonNullable<Post['video']>;mode:'minimal'|'native';onMode:(mode:'minimal'|'native')=>void}){
 const host=useRef<HTMLDivElement>(null),shell=useRef<HTMLDivElement>(null),player=useRef<Player|null>(null),resume=useRef(0);
 const [ready,setReady]=useState(false),[state,setState]=useState(-1),[muted,setMuted]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(video.duration||0),[error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false;let instance:Player|null=null;setReady(false);setError('');setState(-1);
  if(mode==='native')return;
  loadApi().then(api=>{
   if(cancelled||!host.current)return;
   const mount=document.createElement('div');host.current.replaceChildren(mount);
   instance=new api.Player(mount,{host:'https://www.youtube-nocookie.com',videoId:video.url,width:'100%',height:'100%',playerVars:{...youtubeOptions(mode,location.origin),start:Math.floor(resume.current)},events:{
    onReady:(event:PlayerEvent)=>{if(cancelled)return;player.current=event.target;const frame=event.target.getIframe();frame.title=video.title;frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');setReady(true);setMuted(event.target.isMuted());setDuration(event.target.getDuration()||video.duration||0);event.target.playVideo();},
    onStateChange:(event:PlayerEvent)=>{if(cancelled)return;setState(event.data);setTime(event.target.getCurrentTime()||0);},
    onError:()=>{if(!cancelled)setError('Bu video burada açılamadı. Kaynağında izleyebilirsin.');}
   }});
  }).catch(()=>{if(!cancelled)setError('Oynatıcıya bağlanılamadı. Kaynak bağlantısını deneyebilirsin.');});
  return()=>{cancelled=true;if(instance){try{resume.current=instance.getCurrentTime?.()||0;instance.destroy();}catch{}}player.current=null;};
 },[video.url,video.title,video.duration,mode]);
 useEffect(()=>{if(!ready||state!==1)return;const tick=window.setInterval(()=>{const p=player.current;if(p){setTime(p.getCurrentTime()||0);setDuration(p.getDuration()||video.duration||0);}},500);return()=>clearInterval(tick);},[ready,state,video.duration]);
 const play=()=>{const p=player.current;if(!p)return;if(state===1)p.pauseVideo();else{if(state===0)p.seekTo(0,true);p.playVideo();}};
 const volume=()=>{const p=player.current;if(!p)return;const next=!p.isMuted();if(next)p.mute();else p.unMute();setMuted(next);};
 const full=()=>{const el=shell.current;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else if(el?.requestFullscreen)el.requestFullscreen().catch(()=>onMode('native'));else onMode('native');};
 return <div className="youtube-shell" ref={shell}><div className="native-video-stage">{mode==='native'?<iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.url}?${new URLSearchParams(Object.entries({...youtubeOptions('native',location.origin),start:Math.floor(resume.current)}).map(([key,value])=>[key,String(value)]))}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<div className="youtube-host" ref={host}/>}</div>
  {mode==='minimal'&&!clean&&<div className="quiet-video-controls" role="group" aria-label="Video denetimleri"><button onClick={play} disabled={!ready} aria-label={state===1?'Videoyu duraklat':state===0?'Videoyu yeniden oynat':'Videoyu oynat'}>{state===1?<Pause size={19}/>:state===0?<RotateCcw size={19}/>:<Play size={19}/>}</button><input type="range" aria-label="Video konumu" min={0} max={duration||1} step={1} value={Math.min(time,duration||1)} disabled={!ready} onChange={e=>{const n=Number(e.target.value);setTime(n);player.current?.seekTo(n,true);}}/><span className="video-clock">{videoTime(time)} / {videoTime(duration)}</span><button onClick={volume} disabled={!ready} aria-label={muted?'Video sesini aç':'Video sesini kapat'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><button onClick={full} aria-label="Videoyu tam ekran aç"><Maximize size={17}/></button>{immersive&&<button onClick={()=>onMode('native')} aria-label="Standart video denetimlerini aç"><Settings2 size={17}/></button>}</div>}
  {(!clean||error)&&<div className={`video-player-options ${immersive&&!error&&mode==='minimal'?'immersive-player-status':''}`}><span role="status">{mode==='native'?'':error||(!ready?'Oynatıcı yükleniyor…':state===3?'Video yükleniyor…':'')}</span>{(!immersive||error||mode==='native')&&<button onClick={()=>onMode(mode==='minimal'?'native':'minimal')}>{mode==='minimal'?'Standart denetimler':'Sade denetimler'}</button>}</div>}
 </div>;
}
