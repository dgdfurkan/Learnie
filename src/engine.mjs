// Fisher–Yates plus category diversity. IDs stay immutable; only order changes.
export function shuffle(items, random = Math.random) {
 const result=[...items]; for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];} return result;
}
export function nextBatch(posts, seen = [], queued = [], size = 12, random = Math.random) {
 const blocked=new Set([...seen,...queued]); const available=shuffle(posts.filter(p=>!blocked.has(p.id)),random);
 const output=[];let previous=null;
 while(available.length&&output.length<size){let index=available.findIndex(p=>p.category!==previous);if(index<0)index=0;const [post]=available.splice(index,1);output.push(post.id);previous=post.category;}
 return output;
}
export function seedNumber(id) { return [...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7); }
export function normalize(text) { return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i'); }
export function sharePath(id, slide=0, base='/Learnie/') { return `${base}p/${encodeURIComponent(id)}/${slide>0?`?slide=${slide+1}`:''}`; }
