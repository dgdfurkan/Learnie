import {seedNumber} from './engine.mjs';
export function formatCount(n){return n<10000?String(n):`${(n/1000).toLocaleString('tr-TR',{maximumFractionDigits:1})} B`;}
export function engagement(post,user){const seed=seedNumber(post.id);return {likes:(user.simulation?(seed%5===0?seed%80:seed%18400):0)+(user.liked.includes(post.id)?1:0),comments:(user.simulation?post.comments.length:0)+(user.comments[post.id]?.length||0),shares:user.simulation?seed%347:0};}
function shuffled(items,random){const rest=[...items];for(let i=rest.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}return rest;}
/**
 * Reels order: the chosen post first, then unseen before seen, mostly short
 * videos with a narrated card after every few videos. Every post appears once.
 */
export function reelQueue(posts,firstId,seen=[],random=Math.random,every=4){
 const done=new Set(seen),first=posts.find(p=>p.id===firstId);
 const rest=shuffled(posts.filter(p=>p!==first),random);
 const fresh=rest.filter(p=>!done.has(p.id)),old=rest.filter(p=>done.has(p.id));
 const ordered=[...fresh,...old];
 const videos=ordered.filter(p=>p.display==='video'),cards=ordered.filter(p=>p.display!=='video');
 const out=first?[first]:[];let v=0,c=0;
 while(v<videos.length||c<cards.length){
  for(let k=0;k<every&&v<videos.length;k++)out.push(videos[v++]);
  if(c<cards.length)out.push(cards[c++]);
  if(v>=videos.length)while(c<cards.length)out.push(cards[c++]);
 }
 return out;
}
