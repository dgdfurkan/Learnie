import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ArrowDown,ArrowRight,ArrowUpRight,ChevronDown,Plus,ScanLine,Terminal,Quote,Layers,BookOpen,MessageCircle} from 'lucide-react';
import type {Post,Slide} from './types';
import {MotionScene} from './MotionScene';
import {seedNumber} from './engine.mjs';


const paperLayouts=['newspaper','receipt','notebook','book','glossary','casefile','sticky'];
const technicalLayouts=['diagram','cutaway','equation','network','process','route','sequence','growth','layers','timeline'];
export function EditorialCover({post,children,onOpen}:{post:Post;children:ReactNode;onOpen:()=>void}){
 const layout=post.layout||'gallery';const ref=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(false);const seed=seedNumber(post.id);
 useEffect(()=>{const observer=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{threshold:.15});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const headline=<h2>{post.title}</h2>;const topic=<span className="design-topic">{post.topic||post.category}</span>;
 const graphic=<div className="design-graphic" aria-hidden="true"><MotionScene post={post} frame={35}/></div>;
 return <div ref={ref} className={`editorial-cover design-${layout} ${paperLayouts.includes(layout)?'design-paper':''} ${technicalLayouts.includes(layout)?'design-technical':''} ${visible?'design-visible':''} design-variant-${seed%4}`} style={{'--ink-accent':post.accent} as CSSProperties}>
 <div className="design-photo">{children}</div><div className="design-veil"/>
 <div className="design-overline">{topic}<span>{post.category}</span></div>
 {layout==='chat'?<div className="cover-chat"><span><MessageCircle size={20}/> Aklıma takıldı</span><div>{headline}</div><p>{post.subtitle}</p></div>
 :layout==='terminal'?<div className="design-console"><div><i/><i/><i/><span>merak.txt</span></div><span className="console-command">&gt; biraz_yakından_bak</span>{headline}<p><span>↳</span> {post.subtitle}</p></div>
 :layout==='receipt'?<div className="cover-receipt"><span>MERAK DÖKÜMÜ</span><hr/>{headline}<p>{post.subtitle}</p><hr/><div className="barcode" aria-hidden="true"/><small>BEDELİ: BİR DAKİKA</small></div>
 :layout==='newspaper'?<div className="design-news"><div>MERAK POSTASI</div><span>Bugünün küçük keşfi · {post.category}</span>{headline}<p>{post.subtitle}</p></div>
 :layout==='comic'?<div className="cover-comic"><span>Bir dakika…</span>{headline}<p>{post.subtitle}</p></div>
 :layout==='postcard'?<div className="cover-postcard"><div className="design-stamp">L<br/>↗</div><small>Bir meraklıya,</small>{headline}<p>{post.subtitle}</p></div>
 :layout==='profile'?<div className="cover-profile"><div className="profile-orbit" aria-hidden="true"/><span>YAKINDAN TANI</span>{headline}<p>{post.subtitle}</p></div>
 :layout==='puzzle'||layout==='door'||layout==='reveal'?<div className="design-question"><span className="question-mark" aria-hidden="true">{layout==='door'?'↗':'?'}</span>{headline}<p>{post.subtitle}</p><span className="design-peek"><Plus size={17}/> İçinde bir açıklama var</span></div>
 :technicalLayouts.includes(layout)?<div className="design-blueprint"><span className="blueprint-cross" aria-hidden="true">+</span>{graphic}{headline}<p>{post.subtitle}</p></div>
 :layout==='comparison'||layout==='split'||layout==='beforeafter'||layout==='balance'||layout==='myth'?<div className="design-dual"><span className="dual-word">BİR DE<br/>BÖYLE BAK.</span>{headline}<p>{post.subtitle}</p></div>
 :<div className="design-headline">{layout==='number'&&<span className="design-big-index" aria-hidden="true">01</span>}{layout==='book'&&<BookOpen size={32}/>} {layout==='glossary'&&<span className="design-definition">Bir kavram.</span>}{layout==='casefile'&&<span className="design-file"><ScanLine size={17}/> AÇIK DOSYA</span>}{headline}<p>{post.subtitle}</p>{layout==='punchline'&&<span className="design-swoop" aria-hidden="true">↴</span>}</div>}
 <button className="design-open" onClick={onOpen}>İçeri gir <ArrowUpRight size={17}/></button><span className="design-signature" aria-hidden="true">learnie / keşif</span>
 </div>;
}

export function EditorialSlide({post,slide,index}:{post:Post;slide:Slide;index:number}){
 return <div className={`editorial-slide narrative-${post.layout||'notebook'}`} style={{'--ink-accent':post.accent} as CSSProperties}><header><span>{post.topic||post.category}</span><span>{index+2} / {post.slides.length+1}</span></header><div className="editorial-slide-content"><span className="editorial-slide-index">{String(index+1).padStart(2,'0')}</span><h3>{slide.title}</h3><p>{slide.text}</p>{['diagram','network','prism','growth','layers'].includes(post.layout||'')&&<div className="slide-diagram" aria-hidden="true"><MotionScene post={post} frame={40}/></div>}</div><footer><span>Learnie</span><ArrowRight size={18}/></footer></div>;
}

export function PostNarrative({post,initialSlide=0}:{post:Post;initialSlide?:number}){
 const [opened,setOpened]=useState<number[]>(initialSlide>0?[initialSlide-1]:[0]);const layout=post.layout||'notebook';const expandable=['reveal','door','puzzle'].includes(layout);
 const icons:Record<string,ReactNode>={terminal:<Terminal size={19}/>,chat:<MessageCircle size={19}/>,layers:<Layers size={19}/>,book:<BookOpen size={19}/>,punchline:<Quote size={19}/>,casefile:<ScanLine size={19}/>};
 return <div className={`post-narrative narrative-${layout}`} style={{'--ink-accent':post.accent} as CSSProperties}>
 {layout==='newspaper'&&<div className="narrative-masthead">MERAK POSTASI <span>{post.topic}</span></div>}
 {layout==='receipt'&&<div className="narrative-masthead">KÜÇÜK BİR BİLGİ DÖKÜMÜ<div className="barcode" aria-hidden="true"/></div>}
 {['diagram','cutaway','network','prism','growth'].includes(layout)&&<div className="narrative-diagram"><MotionScene post={post} frame={48} reduced/><small>Temsili çizim</small></div>}
 {post.slides.map((s,i)=><section key={i} data-slide={i+1} className={`narrative-panel ${opened.includes(i)?'is-open':''}`}>
 <div className="narrative-marker" aria-hidden="true">{icons[layout]||String(i+1).padStart(2,'0')}</div>
 {expandable?<><button className="narrative-reveal" aria-expanded={opened.includes(i)} onClick={()=>setOpened(v=>v.includes(i)?v.filter(n=>n!==i):[...v,i])}><h2>{s.title}</h2><ChevronDown size={22}/></button><div className="reveal-content" hidden={!opened.includes(i)}><p>{s.text}</p></div></>:<><h2>{s.title}</h2><p>{s.text}</p></>}
 {['process','sequence','route','timeline','equation'].includes(layout)&&i<post.slides.length-1&&<ArrowDown className="narrative-connector" aria-hidden="true"/>}
 </section>)}
 {layout==='receipt'&&<div className="receipt-total"><span>TOPLAM</span><strong>{post.slides.length} küçük keşif</strong></div>}
 </div>;
}
