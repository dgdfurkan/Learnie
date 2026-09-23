import {useState,type CSSProperties,type ReactNode} from 'react';
import {ArrowUpRight,ArrowRight,Plus,Play,Copy} from 'lucide-react';
import {MotionScene} from './MotionScene';
import {seedNumber} from './engine.mjs';
import type {Post,Slide} from './types';
export function artStyle(post:Post):CSSProperties{const art=post.art;return {'--art-paper':art?.paper||'#f3eee2','--art-ink':art?.ink||'#21211e','--art-font':art?.font||'DM Sans','--reading-font':['Bebas Neue','Oswald'].includes(art?.font||'')?'DM Sans':art?.font||'DM Sans','--art-accent':post.accent,'--art-align':art?.align||'start'} as CSSProperties;}
export function PostArtwork({post,children,compact=false,body=false}:{post:Post;children?:ReactNode;compact?:boolean;body?:boolean}){
 const layout=post.layout||'poster';const art=post.art;const photo=art?.kind==='photo'||(!art&&!!children);const n=seedNumber(post.id);const technical=post.id.startsWith('spor-')||['diagram','process','cutaway','equation','layers','network','prism','growth','sequence','balance','mosaic','route'].includes(layout);
 return <div className={`post-artwork artwork-${layout} artwork-${art?.kind||'photo'} artwork-${art?.position||'bottom'} artwork-variant-${n%4} ${compact?'artwork-thumb':''} ${body?'artwork-single':''}`} style={artStyle(post)}>
 {photo&&<div className="artwork-image">{children||<img src={post.cover.url} alt={compact?'':post.cover.alt} loading="lazy"/>}</div>}
 {!photo&&<div className="artwork-texture" aria-hidden="true"/>}
 <div className="artwork-overline"><span>{layout==='newspaper'?'MERAK POSTASI':layout==='receipt'?'BİR MERAK DÖKÜMÜ':layout==='terminal'?'merak.txt':post.art?.label||post.topic||post.category}</span><span>{layout==='postcard'?'↗':layout==='terminal'?'● ● ●':post.category}</span></div>
 {technical&&art?.kind!=='photo'&&<div className="artwork-figure" aria-hidden="true"><MotionScene post={post} frame={n%120} reduced/></div>}
 {layout==='chat'?<div className="artwork-chat-panel"><span>{post.subtitle}</span><strong>{post.title}</strong>{body&&<p>{post.slides[0].text}</p>}</div>
 :layout==='receipt'?<div className="artwork-receipt-panel"><span>GÜNÜN HESABI</span><hr/><h2>{post.title}</h2><p>{body?post.slides[0].text:post.subtitle}</p><hr/><div className="artwork-barcode"/><small>BEDELİ: BİRAZ MERAK</small></div>
 :layout==='comic'?<div className="artwork-comic-panel"><span>Bir saniye…</span><h2>{post.title}</h2><p>{body?post.slides[0].text:post.subtitle}</p></div>
 :layout==='terminal'?<div className="artwork-terminal-panel"><span>~ / bugün_ne_öğrendim</span><h2><i>❯</i> {post.title}</h2><p>{body?post.slides[0].text:post.subtitle}</p><b className="artwork-cursor" aria-hidden="true">▌</b></div>
 :layout==='newspaper'?<div className="artwork-newspaper-panel"><h2>{post.title}</h2><p>{body?post.slides[0].text:post.subtitle}</p><span>HAYATIN İÇİNDEN BİR AYRINTI</span></div>
 :layout==='puzzle'||layout==='reveal'||layout==='door'?<div className="artwork-question"><span aria-hidden="true">?</span><h2>{post.title}</h2><p>{body?post.slides[0].text:post.subtitle}</p></div>
 :<div className="artwork-copy">{layout==='glossary'&&<span className="artwork-definition">Bir kelime, bir dünya.</span>}{layout==='book'&&<span className="artwork-bookline"/>}{layout==='number'&&<span className="artwork-big" aria-hidden="true">{post.title.match(/\d[\d.,]*/)?.[0]||'!'}</span>}<h2>{post.title}</h2>{(body||!compact)&&<p>{body?post.slides[0].text:post.subtitle}</p>}{layout==='punchline'&&<span className="artwork-arrow" aria-hidden="true">↳</span>}</div>}
 <div className="artwork-foot"><span>@{post.handle}</span><span>{body?'Bir bakışta':post.display==='video'?'İzle':compact?'':`${post.minutes} dk`}</span></div>
 </div>;
}
export function EditorialCover({post,children,onOpen}:{post:Post;children:ReactNode;onOpen:()=>void}){return <div className="artwork-wrapper"><PostArtwork post={post} body={post.display==='single'}>{children}</PostArtwork><button className="artwork-open" aria-label={`${post.title} gönderisini oku`} onClick={onOpen}><ArrowUpRight size={19}/></button></div>;}
export function EditorialSlide({post,slide,index}:{post:Post;slide:Slide;index:number}){
 return <div className={`reading-card reading-${post.layout||'notebook'} reading-page-${index%3}`} style={artStyle(post)}><div className="reading-top"><span>@{post.handle}</span><span>{index+2} / {post.slides.length+1}</span></div><div className="reading-copy"><p>{slide.text}</p></div><footer><small>{post.topic||post.category}</small><ArrowRight size={18}/></footer></div>;
}
export function PostThumbnail({post}:{post:Post}){return <><>{post.display==='video'&&post.video?<img className="thumbnail-video" src={post.video.poster||(post.video.kind==='youtube'?`https://i.ytimg.com/vi/${post.video.url}/hqdefault.jpg`:post.cover.url)} alt="" loading="lazy"/>:<PostArtwork post={post} compact/>}</>{(post.display!=='single')&&<span className="thumbnail-type" aria-hidden="true">{post.display==='video'||post.format==='reel'?<Play size={19} fill="currentColor"/>:<Copy size={17}/>}</span>}</>;}
export function PostNarrative({post,initialSlide=0}:{post:Post;initialSlide?:number}){
 return <div className="continuous-narrative">{post.slides.map((s,i)=><p key={i} data-slide={i+1}>{s.text}</p>)}</div>;
}
