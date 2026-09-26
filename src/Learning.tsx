import {useState} from 'react';
import {Flame,Check,RotateCcw,ArrowUpRight,Sun,Moon,Monitor,Download,Upload,ChevronRight,Heart,Brain} from 'lucide-react';
import {GOALS,streak,todayCount} from './learning-model.mjs';
import {Quiz} from './components';
import {usePreferences} from './Preferences';
import type {Post,UserState} from './types';

/** A quiet line under the stories: today's count, the goal and the streak. */
export function DailyProgress({user}:{user:UserState}){
 const goal=user.goal||10,today=todayCount(user.activity),days=streak(user.activity);
 return <div className="daily-line" aria-label={`Bugün ${today} gönderi, hedef ${goal}. ${days} günlük seri.`}>
  <div className="daily-line-top"><span>Bugün <strong>{Math.min(today,999)}</strong><small> / {goal}</small></span>{days>0&&<span className="daily-line-streak"><Flame size={14}/> {days} gün</span>}</div>
  <div className="daily-line-bar"><i style={{width:`${Math.min(100,today/goal*100)}%`}}/></div>
 </div>;
}

/** Retrieval practice, laid out like any other post in the feed. */
export function RecallCard({post,user,onRecall,onAnswer,onOpen}:{post:Post;user:UserState;onRecall:(id:string)=>void;onAnswer:(id:string,n:number)=>void;onOpen:(p:Post)=>void}){
 const [shown,setShown]=useState(false),[result,setResult]=useState<'yes'|'again'|null>(null);
 return <article className="post recall-post">
  <header className="post-header"><span className="account-button"><span className="recall-avatar" aria-hidden="true"><Brain size={18}/></span><span><strong>Hatırlatma</strong><small>Daha önce gördüğün bir gönderi</small></span></span></header>
  <div className="recall-body">
   <h3>{post.title}</h3>
   {post.quiz?<Quiz post={post} answer={user.answers[post.id]} onAnswer={n=>onAnswer(post.id,n)}/>
   :!shown?<button className="recall-link" onClick={()=>setShown(true)}>Hatırlıyor musun? Cevabı göster</button>
   :<><p>{post.subtitle}</p>{result?<p className="recall-note" role="status">{result==='yes'?'Kaydedildi.':'Daha sonra yeniden sorulacak.'}</p>
    :<div className="recall-actions"><button onClick={()=>{setResult('yes');onRecall(post.id);}}><Check size={15}/> Hatırladım</button><button onClick={()=>setResult('again')}><RotateCcw size={15}/> Tekrar sor</button><button onClick={()=>onOpen(post)}>Gönderiyi aç <ArrowUpRight size={14}/></button></div>}</>}
  </div>
 </article>;
}

export function FeedSkeleton(){
 return <div className="feed-skeleton" aria-label="Akış yükleniyor" role="status">{[0,1].map(i=><div className="skeleton-post" key={i}><div className="skeleton-head"><i/><b/></div><div className="skeleton-media"/></div>)}</div>;
}

/** The whole profile settings: only what someone actually changes. */
export function ProfileSettings({user,onName,onGoal,onInstall,onExport,onImport,onLikes}:{user:UserState;onName:(name:string)=>void;onGoal:(goal:number)=>void;onInstall:()=>void;onExport:()=>void;onImport:()=>void;onLikes:()=>void}){
 const {prefs,setPrefs}=usePreferences();
 return <>
  <button className="settings-action liked-link" onClick={onLikes}><Heart size={22}/><span><strong>Beğendiklerin</strong><small>{user.liked.length} gönderi</small></span><ChevronRight size={18}/></button>
  <section className="settings-card simple-settings">
   <label className="setting-line"><span>Adın</span><input value={user.name} maxLength={30} onChange={e=>onName(e.target.value)} onBlur={()=>{if(!user.name.trim())onName('Meraklı');}}/></label>
   <div className="setting-line"><span>Tema</span><div className="segmented" aria-label="Tema">{([['light','Açık',Sun],['dark','Koyu',Moon],['system','Sistem',Monitor]] as const).map(([value,label,Icon])=><button key={value} aria-pressed={prefs.theme===value} onClick={()=>setPrefs({theme:value})}><Icon size={15}/>{label}</button>)}</div></div>
   <div className="setting-line"><span>Günlük hedef</span><div className="segmented" aria-label="Günlük hedef">{GOALS.map(g=><button key={g} aria-pressed={(user.goal||10)===g} onClick={()=>onGoal(g)}>{g}</button>)}</div></div>
   <label className="setting-line"><span>Videolar sesli başlasın</span><input type="checkbox" role="switch" checked={!prefs.videoMuted} onChange={e=>setPrefs({videoMuted:!e.target.checked})}/></label>
   <label className="setting-line"><span>Türkçe altyazı</span><input type="checkbox" role="switch" checked={prefs.videoCaptions} onChange={e=>setPrefs({videoCaptions:e.target.checked})}/></label>
  </section>
  <section className="settings-card simple-settings">
   <button className="setting-line setting-button" onClick={onInstall}><span>Ana ekrana ekle</span><Download size={17}/></button>
   <button className="setting-line setting-button" onClick={onExport}><span>Yedeğini indir</span><Download size={17}/></button>
   <button className="setting-line setting-button" onClick={onImport}><span>Yedekten yükle</span><Upload size={17}/></button>
   <p className="local-note">Kayıtların yalnızca bu cihazda tutulur.</p>
  </section>
 </>;
}
