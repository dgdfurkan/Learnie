import {useEffect,useRef,useState} from 'react';
import {Pause,Play,RotateCcw} from 'lucide-react';
import {MotionScene} from './MotionScene';
import type {Post} from './types';
export default function DiscoveryLab({post}:{post:Post}){
 const ref=useRef<HTMLElement>(null);const [playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[frame,setFrame]=useState(0),[visible,setVisible]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{threshold:.15});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!playing||!visible)return;let id=0,last=0;const tick=(now:number)=>{if(last&&!document.hidden)setFrame(f=>f+Math.min(now-last,80)*.03*speed);last=now;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,visible,speed]);
 return <section ref={ref} className="discovery-lab"><header><span className="eyebrow">HAREKETE BAK</span><span>Temsili çizim</span></header><div className="lab-drawing"><MotionScene post={post} frame={frame}/></div><div className="lab-controls"><button aria-label={playing?'Çizimi duraklat':'Çizimi oynat'} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={18}/>:<Play size={18}/>} {playing?'Duraklat':'Oynat'}</button><button aria-label="Çizimi başa al" onClick={()=>setFrame(0)}><RotateCcw size={17}/></button><label>Hız <select aria-label="Çizim hızı" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label></div><p>Hareketi başlat, yavaşlat, bir daha bak. Çizim konuya eşlik eder; ölçülü bir fizik simülasyonu değildir.</p></section>;
}
