import fs from 'node:fs';
import path from 'node:path';
export function validatePost(p,ids=new Set()){
 const fail=m=>{throw new Error(`${p?.id||'Bilinmeyen içerik'}: ${m}`);};
 if(!p||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id))fail('id küçük Latin harf, rakam ve tire içermeli.');
 if(ids.has(p.id))fail('Tekrarlanan içerik kimliği.');ids.add(p.id);
 for(const key of ['title','subtitle','account','handle','category','updatedAt'])if(typeof p[key]!=='string'||!p[key].trim())fail(`${key} zorunlu.`);
 if(!['Bilim','Uzay','Sanat','Tarih','Coğrafya','Felsefe','İnanç','Doğa','Teknoloji'].includes(p.category))fail('Kategori geçersiz.');
 if(!['carousel','story','experiment','perspective','reel'].includes(p.format))fail('Biçim geçersiz.');
 if(!Number.isFinite(p.minutes)||p.minutes<=0)fail('Okuma süresi geçersiz.');
 if(!/^#[a-f\d]{6}$/i.test(p.accent))fail('Vurgu rengi geçersiz.');
 if(!Array.isArray(p.slides)||p.slides.length<2||p.slides.length>8)fail('2–8 anlatım kartı gerekli.');
 for(const s of p.slides)if(!s.title||!s.text||s.text.length>650)fail('Kart metni eksik veya 650 karakterden uzun.');
 const https=u=>{try{return new URL(u).protocol==='https:';}catch{return false;}};
 if(!p.cover||!https(p.cover.url)||!https(p.cover.source)||!p.cover.credit||!p.cover.alt||!p.cover.license)fail('Dış görsel URL, açıklama, kaynak, sanatçı ve lisans gerekli.');
 if(!p.sources?.length||p.sources.some(s=>!s.label||!https(s.url)))fail('Geçerli bilgi kaynağı gerekli.');
 if(!Array.isArray(p.comments)||p.comments.some(c=>!c.name||!c.text))fail('Örnek yorum biçimi geçersiz.');
 if(p.quiz&&(!p.quiz.question||!p.quiz.explanation||p.quiz.options.length<2||!Number.isInteger(p.quiz.answer)||p.quiz.answer<0||p.quiz.answer>=p.quiz.options.length))fail('Soru yanıtı geçersiz.');
 if(p.experiment&&!['pressure','light'].includes(p.experiment))fail('Deney türü geçersiz.');
 if(p.video&&(!['youtube','file'].includes(p.video.kind)||(p.video.kind==='youtube'?!/^[a-zA-Z0-9_-]{11}$/.test(p.video.url):!https(p.video.url))))fail('Video kaynağı geçersiz.');
 return true;
}
export function readAllContent(root='public/content'){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'));if(manifest.version!==1||!manifest.packs.length)throw new Error('İçerik manifesti geçersiz.');
 const ids=new Set();const posts=[];
 for(const pack of manifest.packs){if(!/^[a-z0-9-]+\.json$/.test(pack.file))throw new Error('Paket dosya adı geçersiz.');const data=JSON.parse(fs.readFileSync(path.join(root,pack.file),'utf8'));if(data.version!==1)throw new Error('Paket sürümü geçersiz.');for(const post of data.posts){validatePost(post,ids);posts.push(post);}}
 return posts;
}
if(process.argv[1]?.endsWith('validate-content.mjs')){const posts=readAllContent();console.log(`${posts.length} içerik doğrulandı; kimlikler benzersiz, kaynaklar ve dış görsel adresleri tanımlı.`);}
