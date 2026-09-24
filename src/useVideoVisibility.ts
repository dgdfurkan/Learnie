import {useEffect,useRef,useSyncExternalStore,type RefObject} from 'react';
import {closestVisibleVideo} from './playback.mjs';

const candidates=new Map<symbol,{element:HTMLElement;active:boolean}>();
const listeners=new Set<()=>void>();
let selected:symbol|undefined,scheduled=0;
function measure(){
 scheduled=0;
 const next=document.hidden?undefined:closestVisibleVideo([...candidates].map(([id,c])=>{
  const r=c.element.getBoundingClientRect();
  const w=Math.max(0,Math.min(r.right,innerWidth)-Math.max(0,r.left));
  const h=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(0,r.top));
  return {id,active:c.active,fraction:r.width*r.height?w*h/(r.width*r.height):0,distance:Math.abs((r.top+r.bottom)/2-innerHeight/2)};
 }));
 if(next!==selected){selected=next;listeners.forEach(fn=>fn());}
}
function schedule(){if(!scheduled)scheduled=requestAnimationFrame(measure);}
function subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export function useVideoVisibility(ref:RefObject<HTMLDivElement|null>,active:boolean){
 const token=useRef(Symbol('video'));
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  candidates.set(token.current,{element,active});
  const observer=new IntersectionObserver(schedule,{threshold:[0,.25,.51,.75,1]});observer.observe(element);
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);document.addEventListener('visibilitychange',schedule);schedule();
  return()=>{candidates.delete(token.current);observer.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);document.removeEventListener('visibilitychange',schedule);schedule();};
 },[ref,active]);
 return useSyncExternalStore(subscribe,()=>selected===token.current,()=>false);
}
