import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {readAllContent} from './validate-content.mjs';
const base='/Learnie/',origin='https://dgdfurkan.github.io';
await fs.mkdir('dist/icons',{recursive:true});
const svg=await fs.readFile('src/assets/brand.svg');
await fs.writeFile('dist/icon.svg',svg);
for(const [name,size] of [['icon-192',192],['icon-512',512],['apple-touch-icon',180]])await sharp(svg).resize(size,size).png().toFile(`dist/icons/${name}.png`);
await sharp({create:{width:512,height:512,channels:4,background:'#000000'}}).composite([{input:await sharp(svg).resize(340).png().toBuffer(),gravity:'centre'}]).png().toFile('dist/icons/maskable-512.png');
const template=await fs.readFile('dist/index.html','utf8');const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const posts=readAllContent();
const catalog=JSON.stringify({version:1,posts});
const catalogFile=`catalog-${crypto.createHash('sha256').update(catalog).digest('hex').slice(0,12)}.json`;
await fs.writeFile(`dist/content/${catalogFile}`,catalog);
const contentIndex=JSON.parse(await fs.readFile('dist/content/index.json','utf8'));
await fs.writeFile('dist/content/index.json',JSON.stringify({...contentIndex,catalog:catalogFile}));
for(const p of posts){const canonical=origin+base+'p/'+p.id+'/';const meta=`<link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Learnie"/><meta property="og:title" content="${escape(p.title)}"/><meta property="og:description" content="${escape(p.subtitle)}"/><meta property="og:url" content="${canonical}"/><meta property="og:image" content="${escape(p.cover.url)}"/><meta name="twitter:card" content="summary_large_image"/>`;
 const html=template.replace(/<title>.*?<\/title>/,`<title>${escape(p.title)} · Learnie</title>`).replace('</head>',meta+'</head>');await fs.mkdir(`dist/p/${p.id}`,{recursive:true});await fs.writeFile(`dist/p/${p.id}/index.html`,html);}
await fs.writeFile('dist/404.html',template);await fs.writeFile('dist/.nojekyll','');
const walk=async(dir)=>{const result=[];for(const f of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())result.push(...await walk(p));else result.push(p);}return result;};
const files=(await walk('dist')).filter(p=>!p.startsWith('dist/p/')&&!p.endsWith('404.html')&&!p.endsWith('sw.js'));
const hash=crypto.createHash('sha256');for(const file of files.sort())hash.update(await fs.readFile(file));const version=hash.digest('hex').slice(0,12);
const urls=[base,...files.map(p=>base+p.slice(5))];
const sw=`const CACHE='learnie-${version}';const BASE=${JSON.stringify(base)};const URLS=${JSON.stringify(urls)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)));});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('learnie-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(BASE))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(BASE+'index.html')));return;}
if(u.pathname.includes('/content/')){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));return;}
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`;
await fs.writeFile('dist/sw.js',sw);
await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[origin+base,...posts.map(p=>origin+base+'p/'+p.id+'/')].map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`);
console.log(`PWA ${version}: ${urls.length} uygulama dosyası, ${posts.length} kalıcı gönderi sayfası. İçerik görseli kopyalanmadı.`);
// A developer-only, noindex page for checking real CSS breakpoints in a framed viewport.
await fs.mkdir('dist/__preview__',{recursive:true});
await fs.writeFile('dist/__preview__/index.html',`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Learnie · Responsive preview</title><style>body{margin:0;background:#292b29;color:#eee;font:14px system-ui;display:grid;justify-items:center;gap:16px;padding:20px}nav{display:flex;align-items:center;gap:16px}select{padding:8px}iframe{background:#101110;border:1px solid #555;border-radius:20px;max-width:100%;height:844px}a{color:#ddd}</style></head><body><nav><label>Görünüm <select id="width"><option value="390">390 px · Telefon</option><option value="320">320 px · Küçük telefon</option><option value="768">768 px · Tablet</option></select></label><a href="${base}">Uygulamayı aç</a></nav><iframe title="Learnie mobil önizleme" src="${base}?preview=${version}" width="390" allow="autoplay"></iframe><script>document.getElementById('width').addEventListener('change',function(){document.querySelector('iframe').width=this.value})</script></body></html>`);
