import {useEffect,useRef,type RefObject} from 'react';
import {isBackSwipe} from './gestures.mjs';
export function useBackGesture<T extends HTMLElement>(ref:RefObject<T|null>,onBack:()=>void){
 const callback=useRef(onBack);callback.current=onBack;
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  let dragged=false;
  let start:{x:number;y:number;width:number;left:number;at:number;pointer:number}|null=null;
  const down=(e:PointerEvent)=>{if(!e.isPrimary||e.button!==0||(e.target as Element).closest('input,textarea,select'))return;const r=element.getBoundingClientRect();const x=e.clientX-r.left;if(x>30&&x<r.width-30)return;dragged=false;start={x,y:e.clientY,width:r.width,left:r.left,at:Date.now(),pointer:e.pointerId};try{(e.target as Element).setPointerCapture(e.pointerId);}catch{}};
  const move=(e:PointerEvent)=>{if(!start)return;const dx=e.clientX-start.left-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.5){e.preventDefault();try{element.setPointerCapture(e.pointerId);}catch{}}};
  const up=(e:PointerEvent)=>{if(!start)return;const s=start;start=null;if(Date.now()-s.at<1200&&isBackSwipe(s,{x:e.clientX-s.left,y:e.clientY})){e.preventDefault();dragged=true;callback.current();}};
  const cancel=()=>{start=null;};
  const click=(e:MouseEvent)=>{if(dragged){dragged=false;e.preventDefault();e.stopPropagation();}};
  element.addEventListener('click',click,true);element.addEventListener('pointerdown',down,true);element.addEventListener('pointermove',move,{passive:false,capture:true});element.addEventListener('pointerup',up,true);element.addEventListener('pointercancel',cancel,true);
  return()=>{element.removeEventListener('click',click,true);element.removeEventListener('pointerdown',down,true);element.removeEventListener('pointermove',move,true);element.removeEventListener('pointerup',up,true);element.removeEventListener('pointercancel',cancel,true);};
 },[ref]);
}
