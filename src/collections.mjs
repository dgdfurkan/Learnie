export function normalizeCollections(value,saved){
 if(!Array.isArray(value))return [];
 const allowed=new Set(saved),ids=new Set();
 return value.filter(c=>c&&typeof c.id==='string'&&c.id.length>0&&c.id.length<100&&typeof c.name==='string'&&c.name.trim()&&c.name.length<=50&&Array.isArray(c.postIds)&&!ids.has(c.id)&&ids.add(c.id)).map(c=>({id:c.id,name:c.name.trim(),postIds:[...new Set(c.postIds.filter(id=>typeof id==='string'&&allowed.has(id)))],createdAt:typeof c.createdAt==='string'?c.createdAt:''}));
}
export function setCollectionMembership(collections,collectionId,postId,included){return collections.map(c=>c.id===collectionId?{...c,postIds:included?[...new Set([...c.postIds,postId])]:c.postIds.filter(id=>id!==postId)}:c);}
export function removeSavedPost(user,id){return {...user,saved:user.saved.filter(x=>x!==id),collections:user.collections.map(c=>({...c,postIds:c.postIds.filter(x=>x!==id)}))};}
