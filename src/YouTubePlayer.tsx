import {useEffect,useRef,useState,useImperativeHandle,type RefObject} from 'react';
import {YouTubeSession} from './youtube-session.mjs';
import {youtubeOptions} from './youtube.mjs';
import {rememberedPosition} from './playback.mjs';
import type {Post} from './types';

type Player={playVideo:()=>void;pauseVideo:()=>void;loadVideoById:(video:{videoId:string;startSeconds:number})=>void;mute:()=>void;unMute:()=>void;isMuted:()=>boolean;getVolume:()=>number;setVolume:(volume:number)=>void;getCurrentTime:()=>number;getDuration:()=>number;getVideoUrl:()=>string;getIframe:()=>HTMLIFrameElement;destroy:()=>void};
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

export type VideoController={select:(id:string,active:boolean)=>void;gesture:()=>void;pause:()=>void};
export default function YouTubePlayer({video,active,mutedPreference,volumePreference,onSound,controllerRef}:{controllerRef?:RefObject<VideoController|null>;video:NonNullable<Post['video']>;active:boolean;mutedPreference:boolean;volumePreference:number;onSound:(muted:boolean,volume:number)=>void}){
 const host=useRef<HTMLDivElement>(null),player=useRef<Player|null>(null),session=useRef<YouTubeSession|null>(null);
 const latest=useRef({video,active,mutedPreference,volumePreference,onSound});latest.current={video,active,mutedPreference,volumePreference,onSound};
 useImperativeHandle(controllerRef,()=>({select:(id,active)=>session.current?.select(id,active),gesture:()=>session.current?.userGesture(),pause:()=>{const s=session.current;if(s)s.select(s.id,false);}}),[]);
 const [status,setStatus]=useState('loading'),[error,setError]=useState('');

 // A video change, eye toggle, preference update or comment sheet must NEVER
 // replace this iframe. The same player loads subsequent videos through the API.
 useEffect(()=>{
  let cancelled=false,instance:Player|null=null;
  loadApi().then(api=>{
   if(cancelled||!host.current)return;
   const initial=latest.current;
   // Set permission delegation BEFORE navigation, including mobile WebKit.
   const mount=document.createElement('iframe');
   mount.title=initial.video.title;mount.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
   mount.referrerPolicy='strict-origin-when-cross-origin';mount.allowFullscreen=true;
   const params=new URLSearchParams(Object.entries({...youtubeOptions(location.origin),enablejsapi:1,mute:initial.mutedPreference?1:0,start:Math.floor(rememberedPosition(initial.video.url))}).map(([k,v])=>[k,String(v)]));
   mount.src=`https://www.youtube.com/embed/${initial.video.url}?${params}`;
   host.current.replaceChildren(mount);
   instance=new api.Player(mount,{events:{
    onReady:(event:PlayerEvent)=>{
     if(cancelled)return;
     player.current=event.target;
     const props=latest.current;
     session.current=new YouTubeSession(event.target,{
      muted:props.mutedPreference,volume:props.volumePreference,
      onSound:(muted:boolean,volume:number)=>latest.current.onSound(muted,volume),
      onStatus:(next:string)=>{if(!cancelled)setStatus(next);}
     });
     session.current.adopt(initial.video.url,props.active);
     if(initial.video.url!==props.video.url)session.current.select(props.video.url,props.active);
    },
    onStateChange:(event:PlayerEvent)=>{if(!cancelled)session.current?.stateChanged(event.data);},
    onAutoplayBlocked:()=>{if(!cancelled)session.current?.autoplayBlocked();},
    onError:()=>{if(!cancelled)setError('Bu video burada açılamadı. Kaynağında izleyebilirsin.');}
   }});
   const frame=instance.getIframe();frame.title=latest.current.video.title;
   frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
   frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');
  }).catch(()=>{if(!cancelled)setError('Oynatıcıya bağlanılamadı. Kaynak bağlantısını deneyebilirsin.');});
  const tick=window.setInterval(()=>session.current?.sample(),250);
  const recover=()=>session.current?.userGesture();
  host.current?.addEventListener('pointerup',recover);
  const stage=host.current;
  return()=>{cancelled=true;clearInterval(tick);stage?.removeEventListener('pointerup',recover);session.current?.dispose();session.current=null;try{instance?.destroy();}catch{}player.current=null;};
 },[]);
 useEffect(()=>{session.current?.setSoundPreference(mutedPreference,volumePreference);},[mutedPreference,volumePreference]);
 useEffect(()=>{session.current?.select(video.url,active);},[video.url,active]);
 useEffect(()=>{setError('');if(player.current)player.current.getIframe().title=video.title;},[video.url,video.title]);

 return <div className="youtube-shell" data-playback={status}>
  <div className="native-video-stage"><div className="youtube-host" ref={host}/></div>
  {error?<div className="video-player-options" role="status"><span>{error}</span><a href={`https://www.youtube.com/watch?v=${video.url}`} target="_blank" rel="noreferrer">Kaynağında izle</a></div>:status==='blocked'?<p className="video-player-notice" role="status">Bu tarayıcı ilk oynatma için bir dokunuş istiyor. Videoya dokununca devam edebilirsin.</p>:<span className="video-loading-status" role="status">{status==='loading'?'Video yükleniyor…':''}</span>}
 </div>;
}
