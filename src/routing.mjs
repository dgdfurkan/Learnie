import {sharePath} from './engine.mjs';
export function parsePostRoute(pathname,search=''){
 const match=pathname.match(/\/p\/([^/]+)/);if(!match)return null;
 try{const params=new URLSearchParams(search),raw=Number(params.get('slide')||1);return {id:decodeURIComponent(match[1]),slide:Number.isFinite(raw)?Math.max(0,Math.floor(raw)-1):0,mode:params.get('mode')==='read'?'read':'reels'};}catch{return null;}
}
export function readerPath(id,slide,base){const path=sharePath(id,slide,base);return `${path}${path.includes('?')?'&':'?'}mode=read`;}
