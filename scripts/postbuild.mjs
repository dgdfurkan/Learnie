import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {readAllContent} from './validate-content.mjs';
const base='/Learnie/',origin='https://dgdfurkan.github.io';
await fs.mkdir('dist/icons',{recursive:true});
const svg=await fs.readFile('public/icon.svg');
for(const [name,size] of [['icon-192',192],['icon-512',512],['apple-touch-icon',180]])await sharp(svg).resize(size,size).png().toFile(`dist/icons/${name}.png`);
await sharp({create:{width:512,height:512,channels:4,background:'#f16a36'}}).composite([{input:await sharp(svg).resize(340).png().toBuffer(),gravity:'centre'}]).png().toFile('dist/icons/maskable-512.png');
const template=await fs.readFile('dist/index.html','utf8');const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const posts=readAllContent();
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
