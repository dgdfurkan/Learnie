import {useEffect,useRef,useState} from 'react';
import {speechSegments,wordBoundaryEnd} from './narration.mjs';
let owner:symbol|undefined;
export function useNarration({sceneKey,text,enabled,running,voice,rate,onEnd,onError}:{sceneKey:string;text:string;enabled:boolean;running:boolean;voice?:SpeechSynthesisVoice;rate:number;onEnd:()=>void;onError:(message:string)=>void}){
 const [chars,setChars]=useState(0);const token=useRef(Symbol('speech')),current=useRef<SpeechSynthesisUtterance|null>(null),segmentIndex=useRef(0),finished=useRef(false),generation=useRef(0),fallback=useRef<ReturnType<typeof setTimeout>>(undefined);
 const runningRef=useRef(running),endRef=useRef(onEnd),errorRef=useRef(onError);runningRef.current=running;endRef.current=onEnd;errorRef.current=onError;
 const stop=()=>{generation.current++;clearTimeout(fallback.current);if(owner===token.current){speechSynthesis.cancel();owner=undefined;}current.current=null;};
 const startRef=useRef<()=>void>(()=>{});
 startRef.current=()=>{
  if(!enabled||!runningRef.current||!voice||finished.current)return;
  const segments=speechSegments(text),segment=segments[segmentIndex.current];if(!segment)return;
  if(owner!==token.current){speechSynthesis.cancel();owner=token.current;}
  const stamp=generation.current,u=new SpeechSynthesisUtterance(segment.text);current.current=u;u.lang='tr-TR';u.voice=voice;u.rate=rate;
  let boundarySeen=false;
  u.onstart=()=>{if(stamp!==generation.current)return;fallback.current=setTimeout(()=>{if(stamp===generation.current&&!boundarySeen)setChars(segment.end);},220);};
  u.onboundary=e=>{if(stamp!==generation.current||e.name==='sentence')return;boundarySeen=true;clearTimeout(fallback.current);setChars(n=>Math.max(n,segment.start+wordBoundaryEnd(segment.text,e.charIndex)));};
  u.onend=()=>{if(stamp!==generation.current)return;clearTimeout(fallback.current);setChars(segment.end);current.current=null;segmentIndex.current++;if(segmentIndex.current<segments.length){startRef.current();}else{finished.current=true;endRef.current();}};
  u.onerror=e=>{if(stamp!==generation.current)return;current.current=null;clearTimeout(fallback.current);if(e.error==='canceled'||e.error==='interrupted')return;errorRef.current('Seslendirme başlayamadı. Ses düğmesine dokunarak yeniden deneyebilirsin.');};
  speechSynthesis.resume();speechSynthesis.speak(u);
 };
 useEffect(()=>{setChars(0);segmentIndex.current=0;finished.current=false;stop();return stop;},[sceneKey,text,enabled,voice?.voiceURI,rate]);
 useEffect(()=>{
  if(!enabled||!voice)return;
  if(running){if(current.current&&owner===token.current)speechSynthesis.resume();else startRef.current();}
  else if(owner===token.current)speechSynthesis.pause();
 },[sceneKey,text,enabled,running,voice?.voiceURI,rate]);
 return chars;
}
