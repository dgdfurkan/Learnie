import {layoutNames} from '../src/presentation.mjs';
import fs from 'node:fs';
import path from 'node:path';
export function validatePost(p,ids=new Set()){
 const fail=m=>{throw new Error(`${p?.id||'Bilinmeyen içerik'}: ${m}`);};
 if(!p||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id))fail('id küçük Latin harf, rakam ve tire içermeli.');
 if(ids.has(p.id))fail('Tekrarlanan içerik kimliği.');ids.add(p.id);
 for(const key of ['title','subtitle','account','handle','category','updatedAt'])if(typeof p[key]!=='string'||!p[key].trim())fail(`${key} zorunlu.`);
 if(!['Bilim','Uzay','Sanat','Tarih','Coğrafya','Felsefe','İnanç','Doğa','Teknoloji','Spor','Gündelik','Sağlık','Soru','Finans','Edebiyat'].includes(p.category))fail('Kategori geçersiz.');
 if(!['carousel','story','experiment','perspective','reel'].includes(p.format))fail('Biçim geçersiz.');
 if(!Number.isFinite(p.minutes)||p.minutes<=0)fail('Okuma süresi geçersiz.');
 if(!/^#[a-f\d]{6}$/i.test(p.accent))fail('Vurgu rengi geçersiz.');
 if(!Array.isArray(p.slides)||p.slides.length<1||p.slides.length>8)fail('1–8 anlatım kartı gerekli.');
 for(const s of p.slides)if(typeof s.title!=='string'||!s.text||s.text.length>650)fail('Kart metni eksik veya 650 karakterden uzun.');
 const https=u=>{try{return new URL(u).protocol==='https:';}catch{return false;}};
 if(!p.cover||!https(p.cover.url)||!https(p.cover.source)||!p.cover.credit||!p.cover.alt||!p.cover.license)fail('Dış görsel URL, açıklama, kaynak, sanatçı ve lisans gerekli.');
 if(!p.sources?.length||p.sources.some(s=>!s.label||!https(s.url)))fail('Geçerli bilgi kaynağı gerekli.');
 if(!Array.isArray(p.comments)||p.comments.some(c=>!c.name||!c.text))fail('Örnek yorum biçimi geçersiz.');
 if(p.quiz&&(!p.quiz.question||!p.quiz.explanation||p.quiz.options.length<2||!Number.isInteger(p.quiz.answer)||p.quiz.answer<0||p.quiz.answer>=p.quiz.options.length))fail('Soru yanıtı geçersiz.');
 if(p.topic!==undefined&&(typeof p.topic!=='string'||!p.topic.trim()||p.topic.length>100))fail('Konu başlığı geçersiz.');
 if(p.layout!==undefined&&!layoutNames.includes(p.layout))fail('Sunum düzeni geçersiz.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.updatedAt)||Number.isNaN(Date.parse(p.updatedAt)))fail('Kontrol tarihi geçersiz.');
 if(p.cover.licenseUrl&&!https(p.cover.licenseUrl))fail('Lisans bağlantısı geçersiz.');
 if(p.motion&&!['tennis','football','bottle','orbit','geometry','art','particles','wave','prism','pendulum','flow','layers','network','helix','growth','balance','gears','mosaic','pulse','probability'].includes(p.motion))fail('Animasyon türü geçersiz.');
 if(p.experiment&&!['pressure','light'].includes(p.experiment))fail('Deney türü geçersiz.');
 if(p.display&&!['single','carousel','video'].includes(p.display))fail('Gösterim biçimi geçersiz.');
 if(p.art&&(!['photo','type','diagram','collage'].includes(p.art.kind)||!/^#[a-f\d]{6}$/i.test(p.art.paper)||!/^#[a-f\d]{6}$/i.test(p.art.ink)))fail('Gönderi renkleri geçersiz.');
 if(p.video?.duration!==undefined&&(!Number.isFinite(p.video.duration)||p.video.duration<=0||p.video.duration>300))fail('Video 1–300 saniye olmalı.');
 if(p.avatar&&!https(p.avatar))fail('Hesap görseli HTTPS olmalı.');
 if(p.display==='video'&&(!p.video||!p.video.duration))fail('Video gösteriminde kaynak gerekli.');
 if(p.video&&(!['youtube','file'].includes(p.video.kind)||(p.video.kind==='youtube'?!/^[a-zA-Z0-9_-]{11}$/.test(p.video.url):!https(p.video.url))))fail('Video kaynağı geçersiz.');
 return true;
}
export function readAllContent(root='public/content'){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'index.json'),'utf8'));if(manifest.version!==1||!manifest.packs.length)throw new Error('İçerik manifesti geçersiz.');
 const ids=new Set();const posts=[];
 for(const pack of manifest.packs){if(!/^[a-z0-9-]+\.json$/.test(pack.file))throw new Error('Paket dosya adı geçersiz.');const data=JSON.parse(fs.readFileSync(path.join(root,pack.file),'utf8'));if(data.version!==1)throw new Error('Paket sürümü geçersiz.');if(pack.count!==data.posts.length)throw new Error(`${pack.file}: manifest sayısı içerikle eşleşmiyor.`);for(const post of data.posts){validatePost(post,ids);posts.push(post);}}
 return posts;
}
if(process.argv[1]?.endsWith('validate-content.mjs')){const posts=readAllContent();console.log(`${posts.length} içerik doğrulandı; kimlikler benzersiz, kaynaklar ve dış görsel adresleri tanımlı.`);}
