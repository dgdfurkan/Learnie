import Dexie, {type Table} from 'dexie';
import type {Post,UserState} from './types';
export const BASE=import.meta.env.BASE_URL as string;
const db=new Dexie('learnie-local-v1') as Dexie & {state:Table<{key:string;value:UserState}>};
db.version(1).stores({state:'key'});
export const emptyState:UserState={read:[],liked:[],saved:[],seen:[],storySeen:[],answers:{},comments:{},name:'Meraklı',simulation:true};
export async function loadState():Promise<UserState>{try {const row=await db.state.get('user'); return {...emptyState,...row?.value};}catch{return {...emptyState};}}
let saveQueue=Promise.resolve();
export function saveState(value:UserState){saveQueue=saveQueue.catch(()=>{}).then(()=>db.state.put({key:'user',value})).then(()=>{});return saveQueue;}
export async function loadContent(onProgress?:(posts:Post[])=>void):Promise<Post[]>{
 const response=await fetch(`${BASE}content/index.json`); if(!response.ok)throw new Error('İçerik listesi yüklenemedi.');
 const manifest=await response.json(); const posts:Post[]=[];
 // Packs stay separate. Progressive delivery makes later additions inexpensive.
 for(const pack of manifest.packs){const r=await fetch(`${BASE}content/${pack.file}`);if(!r.ok)throw new Error('Bir içerik paketi yüklenemedi.');const data=await r.json();posts.push(...data.posts);onProgress?.([...posts]);}
 return posts;
}
export function parseBackup(raw:string):UserState {
 const payload=JSON.parse(raw);if(payload.app!=='Learnie'||payload.version!==1||!payload.state)throw new Error('Bu bir Learnie yedeği değil.');
 const s=payload.state;
 for(const key of ['liked','saved','seen','storySeen'])if(!Array.isArray(s[key])||!s[key].every((x:unknown)=>typeof x==='string'))throw new Error('Yedek içeriği geçersiz.');
 if(typeof s.name!=='string'||s.name.length>50||typeof s.simulation!=='boolean'||!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers)||!s.comments||typeof s.comments!=='object'||Array.isArray(s.comments))throw new Error('Yedek içeriği geçersiz.');
 if(!Object.values(s.answers).every(x=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<20))throw new Error('Yanıt verisi geçersiz.');
 for(const list of Object.values(s.comments)){if(!Array.isArray(list)||list.some(c=>typeof c.text!=='string'||c.text.length>1000||typeof c.createdAt!=='string'))throw new Error('Yorum verisi geçersiz.');}
 if(s.read!==undefined&&(!Array.isArray(s.read)||!s.read.every((x:unknown)=>typeof x==='string')))throw new Error('Okuma verisi geçersiz.');
 return {read:s.read||[],liked:s.liked,saved:s.saved,seen:s.seen,storySeen:s.storySeen,answers:s.answers,comments:s.comments,name:s.name,simulation:s.simulation};
}
