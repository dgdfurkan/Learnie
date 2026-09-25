import {seedNumber} from './engine.mjs';
export const emptyLearning=()=>({goal:3,topic:'Tümü',records:{},days:{}});
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function afterDays(day,count){const d=new Date(`${day}T12:00:00`);d.setDate(d.getDate()+count);return localDay(d);}
export function normalizeLearning(raw){
 const next=emptyLearning();if(!raw||typeof raw!=='object')return next;
 next.goal=[3,5,7].includes(raw.goal)?raw.goal:3;
 next.topic=typeof raw.topic==='string'&&raw.topic.length<40?raw.topic:'Tümü';
 for(const [id,r] of Object.entries(raw.records||{}).slice(0,20000)){
  if(!r||typeof r!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(r.due||'')||!Number.isFinite(Date.parse(r.due)))continue;
  next.records[id]={note:typeof r.note==='string'?r.note.slice(0,600):'',application:typeof r.application==='string'?r.application.slice(0,600):'',applied:!!r.applied,level:Math.floor(Math.min(4,Math.max(0,Number(r.level)||0))),due:r.due,last:typeof r.last==='string'?r.last:r.due,reviews:Math.max(0,Number(r.reviews)||0)};
 }
 for(const [day,ids] of Object.entries(raw.days||{}).slice(-730))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&Array.isArray(ids))next.days[day]=[...new Set(ids.filter(id=>typeof id==='string'))];
 return next;
}
export function dailySelection(posts,learning,day=localDay()){
 const chosen=[],remaining=posts.filter(p=>learning.topic==='Tümü'||p.category===learning.topic).sort((a,b)=>{
  return seedNumber(day+a.id)-seedNumber(day+b.id);
 });
 while(remaining.length&&chosen.length<learning.goal){
  let i=remaining.findIndex(p=>!chosen.some(q=>q.category===p.category||q.video?.publisher&&q.video.publisher===p.video?.publisher));
  if(i<0)i=remaining.findIndex(p=>!chosen.some(q=>q.video?.publisher&&q.video.publisher===p.video?.publisher));
  chosen.push(remaining.splice(Math.max(0,i),1)[0]);
 }
 return chosen;
}
export function reviewDue(posts,learning,day=localDay()){return posts.filter(p=>learning.records[p.id]?.due<=day&&learning.records[p.id]?.last!==day).sort((a,b)=>learning.records[a.id].due.localeCompare(learning.records[b.id].due));}
export function recordRecall(learning,id,{note='',application='',remembered=true},day=localDay()){
 const old=learning.records[id];const level=remembered?Math.min(4,(old?.level??-1)+1):0;
 // Idempotent within a local calendar day: repeated taps cannot inflate progress.
 if(old?.last===day)return {...learning,records:{...learning.records,[id]:{...old,note,application}}};
 const interval=remembered?[1,3,7,14,30][level]:1;
 return {...learning,records:{...learning.records,[id]:{note,application,applied:old?.applied||false,level,due:afterDays(day,interval),last:day,reviews:(old?.reviews||0)+1}},days:{...learning.days,[day]:[...new Set([...(learning.days[day]||[]),id])]}};
}
export function weeklyActivity(learning,today=localDay()){return Array.from({length:7},(_,i)=>{const day=afterDays(today,i-6);return {day,count:learning.days[day]?.length||0};});}
export function recallPrompt(post){return post.learning?.question||post.quiz?.question||`“${post.title}” hakkında aklında kalan ana fikri kendi cümlenle nasıl anlatırsın?`;}
export function recallAnswer(post){return post.learning?.answer||post.quiz?.explanation||post.slides.map(s=>s.text).join(' ');}
export function applicationPrompt(post){return post.learning?.application||({Bilim:'Bugün gördüğün bir olayla bu bilgiyi ilişkilendir. Bir örnek not et.',Uzay:'Bu bilgiyi bir arkadaşına tek bir benzetmeyle anlatmayı dene.',Sanat:'Bir görsele yeniden bak. Videodan sonra fark ettiğin bir ayrıntıyı not et.',Tarih:'Bu olayın dönemiyle bugün arasında bir benzerlik veya fark bul.',Coğrafya:'Bahsi geçen yeri bir haritada bul. Komşuları hakkında ne fark ettin?',Felsefe:'Bu düşünceye gündelik hayattan bir örnek ve bir karşı örnek bul.',İnanç:'Bu anlatının ait olduğu gelenekteki anlamını kendi cümlenle özetle.',Doğa:'Çevrendeki bir canlıyı rahatsız etmeden gözlemle. Bu bilgiyle bir bağlantı kur.',Teknoloji:'Kullandığın bir eşyada bu fikrin nerede işe yaradığını düşün.',Gündelik:'Bu bilgiyi bugün kullanabileceğin küçük bir durumu not et.',Sağlık:'Bu bilgi hakkında kaynağa sormak istediğin bir soruyu yaz.',Spor:'Bir maç veya hareketi izlerken anlatılan ayrıntıyı bul.',Finans:'Hayalî bir örnek üzerinde anlatılan kavramı kendi sayılarınla açıkla.',Edebiyat:'Bir cümle veya karakter seç. Anlatılan fikirle bir bağlantı kur.'}[post.category]||'Bu bilgiyi kullanabileceğin bir durum düşün; kendine kısa bir not bırak.');}
