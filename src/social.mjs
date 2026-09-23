import {seedNumber} from './engine.mjs';
export function formatCount(n){return n<10000?String(n):`${(n/1000).toLocaleString('tr-TR',{maximumFractionDigits:1})} B`;}
export function engagement(post,user){const seed=seedNumber(post.id);return {likes:(user.simulation?(seed%5===0?seed%80:seed%18400):0)+(user.liked.includes(post.id)?1:0),comments:(user.simulation?post.comments.length:0)+(user.comments[post.id]?.length||0),shares:user.simulation?seed%347:0};}
export function reelQueue(posts,firstId){const rest=[...posts];for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}const first=rest.find(p=>p.id===firstId);return first?[first,...rest.filter(p=>p.id!==firstId)]:rest;}
