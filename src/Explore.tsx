import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Shuffle,Search} from 'lucide-react';
import {Cover} from './components';
import type {Post} from './types';
export default function Explore({posts,onOpen}:{posts:Post[];onOpen:(p:Post)=>void}){
 const [topic,setTopic]=useState('all'),[limit,setLimit]=useState(24);const topics=useMemo(()=>[...new Set(posts.map(p=>p.topic||p.category))].sort((a,b)=>a.localeCompare(b,'tr')),[posts]);
 const selected=topic==='all'||!topics.includes(topic)?posts:posts.filter(p=>(p.topic||p.category)===topic);
 useEffect(()=>setLimit(24),[posts,topic]);
 return <><div className="topic-browser"><label>{topics.length} merak rotası<select aria-label="Konu başlığı" value={topics.includes(topic)?topic:'all'} onChange={e=>setTopic(e.target.value)}><option value="all">Bütün konular</option>{topics.map(t=><option key={t} value={t}>{t}</option>)}</select></label><button className="surprise-button" disabled={!selected.length} onClick={()=>onOpen(selected[Math.floor(Math.random()*selected.length)])}><Shuffle size={17}/> Beni şaşırt</button></div><div className="explore-grid">{selected.slice(0,limit).map(p=><button className={`explore-card explore-${p.layout||'gallery'}`} key={p.id} onClick={()=>onOpen(p)}><Cover post={p}/><span className="explore-gradient"/><span className="explore-label">{p.topic||p.category}</span><span className="explore-copy"><strong>{p.title}</strong><small>{p.minutes} dk <ArrowUpRight size={17}/></small></span></button>)}</div>{!selected.length?<div className="empty-state"><Search size={30}/><p>Bir şey bulamadık. Daha kısa bir kelime deneyebilirsin.</p></div>:<p className="explore-count">{Math.min(limit,selected.length)} / {selected.length} keşif</p>}{selected.length>limit&&<button className="explore-more" onClick={()=>setLimit(n=>n+24)}>Biraz daha keşfet</button>}</>;
}
