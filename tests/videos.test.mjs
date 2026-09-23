import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readAllContent,validatePost} from '../scripts/validate-content.mjs';
const posts=readAllContent();
const added=posts.filter(p=>p.id.startsWith('kisa-video-'));
const audit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-23.json','utf8')).videos;
const secondAudit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-23-batch-2.json','utf8')).videos;
test('100 additional short videos preserve the original 60 without reusing a source',()=>{
 assert.equal(audit.length,60);assert.equal(secondAudit.length,100);
 assert.equal(added.length,160);assert.equal(new Set(added.map(p=>p.video.url)).size,160);
 const oldIds=new Set(audit.map(a=>a.videoId));
 for(const a of secondAudit)assert.ok(!oldIds.has(a.videoId));
 const youtube=posts.filter(p=>p.video?.kind==='youtube');
 assert.equal(new Set(youtube.map(p=>p.video.url)).size,youtube.length);
});
test('both short video releases have 1–2 minute sources with actual Turkish tracks',()=>{
 const previousIds=new Set(posts.filter(p=>!p.id.startsWith('kisa-video-')).map(p=>p.video?.url).filter(Boolean));
 for(const p of added){const v=p.video,a=[...audit,...secondAudit].find(a=>a.postId===p.id);assert.ok(a);assert.equal(a.videoId,v.url);assert.equal(v.duration,a.durationSeconds);assert.ok(v.duration>=60&&v.duration<=120);assert.ok(!previousIds.has(v.url));assert.equal(a.playabilityStatus,'OK');assert.equal(a.playableInEmbed,true);assert.equal(a.availableInTurkey,true);assert.equal(a.captionLanguage,'tr');assert.equal(v.captionLanguage,'tr');assert.equal(v.captionKind,a.captionKind);assert.equal(v.publisher,a.publisher);assert.equal(p.display,'video');assert.ok(v.poster.startsWith('https://'));assert.ok(!v.poster.includes('/frame0.jpg'));assert.ok(p.slides.every(s=>s.text.length<=300));}
});
test('verified videos reject unsupported language and malformed presentation metadata',()=>{
 const p=added[0];
 assert.throws(()=>validatePost({...p,video:{...p.video,audioLanguage:'en',captionLanguage:'en'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,poster:'javascript:alert(1)'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,orientation:'sideways'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,captionKind:'auto-translation'}}));
});
