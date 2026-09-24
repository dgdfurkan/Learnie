import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readAllContent,validatePost} from '../scripts/validate-content.mjs';
const posts=readAllContent();
const added=posts.filter(p=>p.id.startsWith('kisa-video-'));
const audit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-23.json','utf8')).videos;
const secondAudit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-23-batch-2.json','utf8')).videos;
const thirdAudit=JSON.parse(fs.readFileSync('docs/video-audit-2026-09-24.json','utf8')).videos;
const releases=[{videos:audit,count:60,min:60},{videos:secondAudit,count:100,min:60},{videos:thirdAudit,count:200,min:30}];
test('200 additional videos preserve earlier releases without reusing a source',()=>{
 for(const release of releases)assert.equal(release.videos.length,release.count);
 assert.equal(added.length,360);
 const youtube=posts.filter(p=>p.video?.kind==='youtube');
 assert.equal(new Set(youtube.map(p=>p.video.url)).size,youtube.length);
 assert.equal(new Set(releases.flatMap(r=>r.videos.map(a=>a.postId))).size,360);
});
test('every short source has verified embed permission, Turkish captions and matching metadata',()=>{
 const byId=new Map(posts.map(p=>[p.id,p]));
 for(const release of releases)for(const a of release.videos){const p=byId.get(a.postId);assert.ok(p);const v=p.video;assert.equal(a.videoId,v.url);assert.equal(v.duration,a.durationSeconds);assert.ok(v.duration>=release.min&&v.duration<=120);assert.equal(a.playabilityStatus,'OK');assert.equal(a.playableInEmbed,true);assert.equal(a.availableInTurkey,true);assert.equal(a.captionLanguage,'tr');assert.equal(v.captionLanguage,'tr');assert.equal(v.captionKind,a.captionKind);assert.equal(v.publisher,a.publisher);assert.equal(v.verifiedAt,a.checkedAt);assert.equal(p.display,'video');assert.ok(v.poster.startsWith('https://'));assert.ok(!v.poster.includes('/frame0.jpg'));assert.ok(p.slides.every(s=>s.text.length<=300));}
});
test('verified videos reject unsupported language and malformed presentation metadata',()=>{
 const p=added[0];
 assert.throws(()=>validatePost({...p,video:{...p.video,audioLanguage:'en',captionLanguage:'en'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,poster:'javascript:alert(1)'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,orientation:'sideways'}}));
 assert.throws(()=>validatePost({...p,video:{...p.video,captionKind:'auto-translation'}}));
});
