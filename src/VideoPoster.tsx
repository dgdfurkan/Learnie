import {useState} from 'react';
import type {Post} from './types';
/** Portrait posters for Shorts, a standard frame otherwise, then a typographic fallback. */
export function posterSources(post:Post){
 const video=post.video;if(!video)return [post.cover.url];
 if(video.kind!=='youtube')return [video.poster||post.cover.url];
 const portrait=video.orientation!=='landscape';
 return [...new Set([video.poster,portrait?`https://i.ytimg.com/vi/${video.url}/oardefault.jpg`:`https://i.ytimg.com/vi/${video.url}/hq720.jpg`,`https://i.ytimg.com/vi/${video.url}/hqdefault.jpg`].filter((u):u is string=>!!u))];
}
export function VideoPoster({post,className='',eager=false}:{post:Post;className?:string;eager?:boolean}){
 const [attempt,setAttempt]=useState(0);const sources=posterSources(post);const video=post.video;
 if(attempt>=sources.length)return <span className={`${className} video-poster-fallback`} role="img" aria-label={post.title}><small>{video?.publisher||post.account}</small><strong>{post.title}</strong></span>;
 const src=sources[attempt];
 const img=(cls:string)=><img className={cls} src={src} alt="" loading={eager?'eager':'lazy'} decoding="async" fetchPriority={eager?'high':'auto'} referrerPolicy="no-referrer" onError={()=>setAttempt(n=>n+1)}/>;
 // A 4:3 frame with a vertical video in the middle: show just the video, never the black side bands.
 const pillar=video?.orientation!=='landscape'&&(video?.posterKind==='pillarbox'||/\/(hq|sd)default\.jpg/.test(src));
 return pillar?<span className={`${className} poster-pillar`}>{img('poster-pillar-img')}</span>:img(className);
}
