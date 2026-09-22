import {useEffect,useRef,useState} from 'react';
import {Heart,Send,X,MessageCircle} from 'lucide-react';
import {IconButton} from './components';
import type {Post,UserState} from './types';

export default function CommentsSheet({post,user,onAdd,onClose}:{post:Post;user:UserState;onAdd:(text:string)=>void;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),list=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 const [text,setText]=useState(''),[reply,setReply]=useState(''),[liked,setLiked]=useState<number[]>([]);
 const local=user.comments[post.id]||[];const example=user.simulation?post.comments:[];
 useEffect(()=>{
  const el=dialog.current!,before=document.activeElement as HTMLElement;const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';el.showModal();
  const fit=()=>{const v=window.visualViewport;el.style.setProperty('--visible-height',`${v?.height||window.innerHeight}px`);el.style.setProperty('--visible-top',`${v?.offsetTop||0}px`);};
  fit();window.visualViewport?.addEventListener('resize',fit);window.visualViewport?.addEventListener('scroll',fit);window.addEventListener('resize',fit);
  return()=>{el.close();document.body.style.overflow=overflow;window.visualViewport?.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('scroll',fit);window.removeEventListener('resize',fit);before?.focus();};
 },[]);
 const send=()=>{if(!text.trim())return;onAdd(`${reply?`@${reply} `:''}${text.trim()}`.slice(0,1000));setText('');setReply('');input.current?.focus();requestAnimationFrame(()=>list.current?.scrollTo({top:list.current.scrollHeight,behavior:'smooth'}));};
 const start=useRef<number|null>(null);
 return <dialog ref={dialog} className="comments-sheet" aria-label="Yorumlar" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="comments-panel"><header onPointerDown={e=>{start.current=e.clientY;}} onPointerUp={e=>{if(start.current!==null&&e.clientY-start.current>70)onClose();start.current=null;}}><span className="sheet-grip"/><div><span/><h2>Yorumlar <small>{example.length+local.length}</small></h2><IconButton label="Yorumları kapat" onClick={onClose}><X size={21}/></IconButton></div></header><div className="comments-scroll" ref={list}>
 {example.length>0&&<p className="comments-disclosure">Örnek sohbet · Profiller ve yorumlar kurgudur.</p>}
 {example.map((c,i)=><article className="sheet-comment" key={i}><span className={`comment-face face-${i%5}`}>{c.name.slice(0,1)}</span><div><strong>{c.name}</strong><p>{c.text}</p><button onClick={()=>{setReply(c.name);input.current?.focus();}}>Yanıtla</button></div><button className="comment-heart" aria-label={`${c.name} yorumunu ${liked.includes(i)?'beğenmekten vazgeç':'beğen'}`} aria-pressed={liked.includes(i)} onClick={()=>setLiked(v=>v.includes(i)?v.filter(n=>n!==i):[...v,i])}><Heart size={15} fill={liked.includes(i)?'currentColor':'none'}/></button></article>)}
 {local.map((c,i)=><article className="sheet-comment" key={`local-${i}`}><span className="comment-face face-mine">{user.name.slice(0,1)}</span><div><strong>{user.name}<small>Sen</small></strong><p>{c.text}</p></div></article>)}
 {!example.length&&!local.length&&<div className="comments-empty"><MessageCircle size={32}/><h3>İlk düşünce senden.</h3><p>Bu konu sana neyi hatırlattı?</p></div>}
 </div><footer>{reply&&<div className="reply-strip">{reply} için yanıt yazıyorsun<button aria-label="Yanıttan vazgeç" onClick={()=>setReply('')}><X size={15}/></button></div>}<div className="quick-reactions">{['👏','💡','🤔','😄','🌿','✨'].map(emoji=><button key={emoji} aria-label={`${emoji} ekle`} onClick={()=>{setText(v=>(v+emoji).slice(0,1000));input.current?.focus();}}>{emoji}</button>)}</div><form onSubmit={e=>{e.preventDefault();send();}}><span className="comment-face face-mine">{user.name.slice(0,1)}</span><textarea ref={input} aria-label="Yorum yaz" placeholder={`${user.name}, bir yorum ekle…`} value={text} maxLength={1000-(reply?reply.length+2:0)} rows={1} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send();}}}/><button className="comment-send" type="submit" disabled={!text.trim()} aria-label="Yorumu kaydet"><Send size={21}/></button></form><p>Yorumların bu cihazda saklanır.</p></footer></div></dialog>;
}
