import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useWindowVirtualizer} from '@tanstack/react-virtual';
import {Shuffle,Search} from 'lucide-react';
import {PostThumbnail} from './PostDesign';
import {shuffle} from './engine.mjs';
import type {Post} from './types';
export default function Explore({posts,onOpen,revision=0}:{posts:Post[];onOpen:(p:Post)=>void;revision?:number}){
 const [topic,setTopic]=useState('all'),[limit,setLimit]=useState(36),[width,setWidth]=useState(600),[margin,setMargin]=useState(0);const grid=useRef<HTMLDivElement>(null);const topics=useMemo(()=>[...new Set(posts.map(p=>p.topic||p.category))].sort((a,b)=>a.localeCompare(b,'tr')),[posts]);
 const selected=useMemo(()=>shuffle(topic==='all'||!topics.includes(topic)?posts:posts.filter(p=>(p.topic||p.category)===topic)),[posts,topic,revision]);
 useEffect(()=>setLimit(36),[selected]);
 useLayoutEffect(()=>{const el=grid.current;if(!el)return;const measure=()=>{setWidth(el.clientWidth);setMargin(el.getBoundingClientRect().top+window.scrollY);};measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[selected.length]);
 const rowHeight=(width-4)/3*1.28+2;const rows=useWindowVirtualizer({count:Math.ceil(limit/3),estimateSize:()=>rowHeight,overscan:3,scrollMargin:margin});
 useEffect(()=>{rows.measure();},[rowHeight]);
 const virtualRows=rows.getVirtualItems();const last=virtualRows.at(-1)?.index||0;
 useEffect(()=>{if(selected.length&&last>=Math.ceil(limit/3)-5)setLimit(n=>n+36);},[last,limit,selected.length]);
 return <><div className="explore-tools"><select aria-label="Konu başlığı" value={topics.includes(topic)?topic:'all'} onChange={e=>{setTopic(e.target.value);window.scrollTo({top:0,behavior:'smooth'});}}><option value="all">Bütün konular</option>{topics.map(t=><option key={t}>{t}</option>)}</select><button aria-label="Rastgele bir anlatım aç" disabled={!selected.length} onClick={()=>onOpen(selected[Math.floor(Math.random()*selected.length)])}><Shuffle size={20}/></button></div>{selected.length?<div ref={grid} className="discovery-grid" style={{height:rows.getTotalSize()}}>{virtualRows.map(row=><div className="discovery-row" key={row.key} style={{height:rowHeight,transform:`translateY(${row.start-margin}px)`}}>{[0,1,2].map(column=>{const i=row.index*3+column,p=selected[i%selected.length];return <button aria-label={p.title} className="discovery-tile" key={`${p.id}-${i}`} onClick={()=>onOpen(p)}><PostThumbnail post={p}/></button>;})}</div>)}</div>:<div className="empty-state"><Search size={30}/><p>Bir şey bulamadık. Başka bir kelime deneyelim.</p></div>}</>;
}
