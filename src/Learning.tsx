import {useState} from 'react';
import {Flame,Check,RotateCcw,ArrowUpRight,Sun,Moon,Monitor,Download,Upload,ChevronRight,Heart,Brain,EyeOff,Ban,Info,Eye} from 'lucide-react';
import {GOALS,streak,todayCount} from './learning-model.mjs';
import {Quiz,Dialog,Sources} from './components';
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
export function cleanUsername(v:string){return v.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g,c=>({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'} as Record<string,string>)[c]).replace(/[^a-z0-9._]/g,'').slice(0,30);}
export function ProfileSettings({user,onName,onUsername,onGoal,onInstall,onExport,onImport,onLikes}:{user:UserState;onName:(name:string)=>void;onUsername:(u:string)=>void;onGoal:(goal:number)=>void;onInstall:()=>void;onExport:()=>void;onImport:()=>void;onLikes:()=>void}){
 const {prefs,setPrefs}=usePreferences();
 return <>
  <button className="settings-action liked-link" onClick={onLikes}><Heart size={22}/><span><strong>Beğendiklerin</strong><small>{user.liked.length} gönderi</small></span><ChevronRight size={18}/></button>
  <section className="settings-card simple-settings">
   <label className="setting-line"><span>Ad soyad</span><input value={user.name} maxLength={40} placeholder="Adın ve soyadın" autoComplete="name" onChange={e=>onName(e.target.value)} onBlur={()=>{if(!user.name.trim())onName('Meraklı');}}/></label>
   <label className="setting-line"><span>Kullanıcı adı</span><span className="username-input"><b>@</b><input value={user.username||''} maxLength={30} placeholder="kullaniciadi" autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={e=>onUsername(cleanUsername(e.target.value))}/></span></label>
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

/** What a post belongs to for hiding: the YouTube channel for videos, the Learnie account otherwise. */
export function channelOf(post:Post){
 const v=post.video;
 if(v&&post.display==='video')return {id:`yt:${v.publisherId||v.publisher||post.handle}`,name:v.publisher||post.account};
 return {id:`acc:${post.handle}`,name:post.account};
}

/** The "···" sheet on a post or reel: hide the post, hide its channel, see sources. */
export function PostMenu({post,onClose,onHidePost,onHideChannel}:{post:Post;onClose:()=>void;onHidePost:()=>void;onHideChannel:()=>void}){
 const [sources,setSources]=useState(false);const channel=channelOf(post);
 if(sources)return <Dialog title="Kaynaklar" onClose={onClose}><Sources post={post}/></Dialog>;
 return <Dialog title="Seçenekler" onClose={onClose}><div className="post-menu">
  <button onClick={onHidePost}><EyeOff size={19}/><span><strong>Bu gönderiyi gösterme</strong><small>Akışında ve Reels'te bir daha çıkmaz.</small></span></button>
  <button onClick={onHideChannel}><Ban size={19}/><span><strong>{channel.name} içeriklerini gösterme</strong><small>{post.display==='video'?'Bu kanalın bütün videoları gizlenir.':'Bu hesabın bütün gönderileri gizlenir.'}</small></span></button>
  <button onClick={()=>setSources(true)}><Info size={19}/><span><strong>Kaynaklar ve bilgi</strong><small>Videonun ve görselin kaynağı</small></span></button>
 </div></Dialog>;
}

export function HiddenSettings({user,posts,onShowPost,onShowChannel}:{user:UserState;posts:Post[];onShowPost:(id:string)=>void;onShowChannel:(id:string)=>void}){
 const channels=user.hiddenChannels||[],hidden=(user.hiddenPosts||[]).map(id=>posts.find(p=>p.id===id)).filter((p):p is Post=>!!p);
 if(!channels.length&&!hidden.length)return null;
 return <section className="settings-card simple-settings hidden-settings"><h3>Gizlediklerin</h3>
  {channels.map(c=><div className="setting-line" key={c.id}><span>{c.name}<small>{c.id.startsWith('yt:')?'Kanal':'Hesap'}</small></span><button onClick={()=>onShowChannel(c.id)}><Eye size={15}/> Göster</button></div>)}
  {hidden.map(p=><div className="setting-line" key={p.id}><span>{p.title}<small>Gönderi</small></span><button onClick={()=>onShowPost(p.id)}><Eye size={15}/> Göster</button></div>)}
 </section>;
}

export const CLEAN_PARTS:[string,string][]=[['header','Geri düğmesi ve başlık'],['sound','Ses düğmesi'],['captions','Altyazı düğmesi'],['like','Beğen ve beğeni sayısı'],['comment','Yorumlar'],['share','Paylaş'],['save','Kaydet'],['note','Notu oku'],['more','Diğer (···)'],['account','Hesap adı'],['title','Başlık'],['caption','Açıklama'],['source','Kaynak kanal'],['progress','İlerleme çubuğu'],['shade','Kenar karartması']];

export function CleanModeSettings(){
 const {prefs,setPrefs}=usePreferences();
 const toggle=(k:string)=>setPrefs({cleanHide:prefs.cleanHide.includes(k)?prefs.cleanHide.filter(x=>x!==k):[...prefs.cleanHide,k]});
 return <section className="settings-card simple-settings"><h3>Reels'te göz simgesi</h3><p className="setting-help">Göz simgesine bastığında gizlenecekleri seç. Seçmediklerin ekranda kalır.</p>
  <div className="chip-grid">{CLEAN_PARTS.map(([k,label])=><button key={k} aria-pressed={prefs.cleanHide.includes(k)} onClick={()=>toggle(k)}>{prefs.cleanHide.includes(k)&&<Check size={13}/>}{label}</button>)}</div>
 </section>;
}
