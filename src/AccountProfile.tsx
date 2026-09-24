import {useEffect,useMemo,useRef,useState} from 'react';
import {Grid3X3,Clapperboard,Check,Info} from 'lucide-react';
import {Avatar,Dialog} from './components';
import {PostThumbnail} from './PostDesign';
import {accountPosts,accountStats,accountBios} from './accounts.mjs';
import {formatCount} from './social.mjs';
import type {Post,UserState} from './types';

export default function AccountProfile({post,posts,user,onClose,onFollow,onOpen}:{post:Post;posts:Post[];user:UserState;onClose:()=>void;onFollow:()=>void;onOpen:(post:Post,selection:Post[])=>void}){
 const [tab,setTab]=useState<'all'|'video'>('all'),[limit,setLimit]=useState(24),[info,setInfo]=useState(false);const more=useRef<HTMLDivElement>(null);
 const all=useMemo(()=>accountPosts(posts,post.handle) as Post[],[posts,post.handle]);const selected=tab==='video'?all.filter(p=>p.display==='video'):all;
 const followed=user.following.includes(post.handle),stats=accountStats(post.handle,user.simulation,followed);
 useEffect(()=>setLimit(24),[tab,post.handle]);
 useEffect(()=>{const el=more.current;if(!el||limit>=selected.length)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setLimit(n=>n+24);},{root:el.closest('dialog'),rootMargin:'250px'});observer.observe(el);return()=>observer.disconnect();},[limit,selected.length]);
 return <Dialog title={post.handle} onClose={onClose} wide><section className="account-profile" aria-label={`${post.account} profili`}>
  <header className="account-overview"><Avatar post={post}/><div className="account-stats"><span><strong>{all.length}</strong>gönderi</span><span><strong>{formatCount(stats.followers)}</strong>takipçi</span><span><strong>{formatCount(stats.following)}</strong>takip</span></div></header>
  <div className="account-bio"><h1>{post.account}</h1><span className="account-kind">{post.category} · Learnie seçkisi</span><p>{accountBios[post.category]||accountBios.Gündelik}</p></div>
  <div className="account-buttons"><button className={followed?'is-followed':''} aria-pressed={followed} onClick={onFollow}>{followed&&<Check size={16}/>} {followed?'Takip ediliyor':'Takip et'}</button><button className="account-info-button" aria-label="Hesap hakkında" onClick={()=>setInfo(v=>!v)} aria-expanded={info}><Info size={19}/></button></div>
  {info&&<p className="account-disclosure">Bu, Learnie’nin editoryal hesaplarından biri. Hesap kişiliği ve sosyal sayılar kurgudur; videoların gerçek yayıncıları kaynaklarında belirtilir. Takip tercihin yalnızca bu cihazda saklanır.</p>}
  <div className="account-tabs" role="tablist" aria-label="Hesabın gönderileri"><button role="tab" aria-selected={tab==='all'} onClick={()=>setTab('all')}><Grid3X3 size={21}/><span>Gönderiler</span></button><button role="tab" aria-selected={tab==='video'} onClick={()=>setTab('video')}><Clapperboard size={22}/><span>Videolar</span></button></div>
  <div className="account-grid" role="tabpanel" aria-label={tab==='all'?'Gönderiler':'Videolar'}>{selected.slice(0,limit).map(p=><button key={p.id} className="discovery-tile" aria-label={p.title} onClick={()=>onOpen(p,selected)}><PostThumbnail post={p}/></button>)}</div>
  {!selected.length&&<p className="account-empty">Bu hesapta henüz video yok.</p>}<div ref={more} className="account-more"/>
 </section></Dialog>;
}
