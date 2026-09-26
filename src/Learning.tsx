import {useState} from 'react';
import {Flame,Brain,Eye,Check,RotateCcw,ArrowUpRight} from 'lucide-react';
import {GOALS,streak,todayCount} from './learning-model.mjs';
import {Quiz} from './components';
import type {Post,UserState} from './types';

/** Today's progress towards a small daily goal, and the streak of active days. */
export function LearningPulse({user,onGoal}:{user:UserState;onGoal:(goal:number)=>void}){
 const [open,setOpen]=useState(false);
 const goal=user.goal||10,today=todayCount(user.activity),days=streak(user.activity),done=today>=goal;
 const r=23,c=2*Math.PI*r,value=Math.min(1,today/goal);
 const copy=done?'Bugünkü hedefin tamam. Kalanı keyfine.':today===0?'Küçük bir başlangıç yeter. Bir keşifle başla.':`Hedefe ${goal-today} keşif kaldı.`;
 return <>
  <button className={`learning-pulse ${done?'pulse-done':''}`} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-label={`Bugün ${today} keşif, günlük hedef ${goal}. ${days} günlük seri. Hedefi değiştir.`}>
   <span className="pulse-ring" aria-hidden="true"><svg viewBox="0 0 54 54"><circle className="track" cx="27" cy="27" r={r}/><circle className="value" cx="27" cy="27" r={r} strokeDasharray={c} strokeDashoffset={c*(1-value)}/></svg><b>{done?<Check size={20}/>:today}</b></span>
   <span className="pulse-copy"><strong>{done?'Harika gidiyorsun':'Bugünkü merakın'}</strong><small>{copy} Hedef: {goal}</small></span>
   <span className={`pulse-streak ${days>0?'is-hot':''}`} aria-hidden="true"><span><Flame size={17}/> {days}</span><small>gün seri</small></span>
  </button>
  {open&&<div className="goal-picker" role="group" aria-label="Günlük hedef">{GOALS.map(g=><button key={g} aria-pressed={goal===g} onClick={()=>{onGoal(g);setOpen(false);}}>{g} keşif</button>)}</div>}
 </>;
}

/** Retrieval practice: bring back something seen earlier, then reveal it. */
export function RecallCard({post,user,onRecall,onAnswer,onOpen}:{post:Post;user:UserState;onRecall:(id:string)=>void;onAnswer:(id:string,n:number)=>void;onOpen:(p:Post)=>void}){
 const [shown,setShown]=useState(false),[result,setResult]=useState<'yes'|'again'|null>(null);
 if(post.quiz)return <section className="recall-card" aria-label="Hatırlama sorusu"><span className="eyebrow"><Brain size={15}/> HATIRLIYOR MUSUN?</span><p>Daha önce baktığın “{post.title}” gönderisinden:</p><Quiz post={post} answer={user.answers[post.id]} onAnswer={n=>onAnswer(post.id,n)}/></section>;
 return <section className="recall-card" aria-label="Hatırlama kartı">
  <span className="eyebrow"><Brain size={15}/> HATIRLIYOR MUSUN?</span>
  <h3>{post.title}</h3>
  {!shown?<><p>Önce kendin hatırlamayı dene; sonra cevaba bak. Hatırlamaya çalışmak, bilgiyi kalıcı yapar.</p><div className="recall-actions"><button className="is-primary" onClick={()=>setShown(true)}><Eye size={16}/> Cevabı göster</button></div></>
  :<div className="recall-answer"><p>{post.subtitle}</p>
   {result?<div className="recall-done" role="status"><Check size={18}/>{result==='yes'?'Güzel, aklında kalmış.':'Tamam, ileride yine karşına çıkaracağız.'}</div>
   :<div className="recall-actions" style={{marginTop:12}}><button className="is-primary" onClick={()=>{setResult('yes');onRecall(post.id);}}><Check size={16}/> Hatırladım</button><button onClick={()=>setResult('again')}><RotateCcw size={16}/> Tekrar sor</button><button onClick={()=>onOpen(post)}>Notu aç <ArrowUpRight size={15}/></button></div>}
  </div>}
 </section>;
}

export function FeedSkeleton(){
 return <div className="feed-skeleton" aria-label="Akış yükleniyor" role="status">{[0,1].map(i=><div className="skeleton-post" key={i}><div className="skeleton-head"><i/><b/></div><div className="skeleton-media"/></div>)}</div>;
}
