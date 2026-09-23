import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readAllContent,validatePost} from '../scripts/validate-content.mjs';
const posts=readAllContent();
const added=posts.filter(p=>p.id.startsWith('kisa-video-'));
const audit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-23.json','utf8')).videos;
test('short video release has 60 different 1–2 minute sources with actual Turkish tracks',()=>{
 assert.equal(added.length,60);assert.equal(new Set(added.map(p=>p.video.url)).size,60);
 const previousIds=new Set(posts.filter(p=>!p.id.startsWith('kisa-video-')).map(p=>p.video?.url).filter(Boolean));
 for(const p of added){const v=p.video,a=audit.find(a=>a.postId===p.id);assert.ok(a);assert.equal(a.videoId,v.url);assert.equal(v.duration,a.durationSeconds);assert.ok(v.duration>=60&&v.duration<=120);assert.ok(!previousIds.has(v.url));assert.equal(a.playabilityStatus,'OK');assert.equal(a.playableInEmbed,true);assert.equal(a.availableInTurkey,true);assert.equal(a.captionLanguage,'tr');assert.equal(v.captionLanguage,'tr');assert.equal(v.captionKind,a.captionKind);assert.equal(v.publisher,a.publisher);assert.equal(p.display,'video');assert.ok(v.poster.startsWith('https://'));}
});
test('verified videos reject unsupported language and malformed presentation metadata',()=>{
 const p=added[0];
 assert.throws(()=>validatePost({...p,video:{...p.video,audioLanguage:'en',captionLanguage:'en'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,poster:'javascript:alert(1)'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,orientation:'sideways'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,captionKind:'auto-translation'}}));
});
