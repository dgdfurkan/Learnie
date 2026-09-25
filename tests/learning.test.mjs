import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLearning,normalizeLearning,recordRecall,dailySelection,reviewDue,weeklyActivity,afterDays} from '../src/learning.mjs';
const posts=Array.from({length:15},(_,i)=>({id:`p-${i}`,category:['Bilim','Sanat','Tarih'][i%3],video:{publisher:`publisher-${i%5}`}}));
test('daily selection stays stable across completed cards and has topic and publisher variety',()=>{
 const l=emptyLearning(),a=dailySelection(posts,l,'2026-09-25');
 const next=recordRecall(l,a[0].id,{note:'A fact',remembered:true},'2026-09-25');
 assert.deepEqual(dailySelection(posts,next,'2026-09-25'),a);assert.equal(new Set(a.map(p=>p.category)).size,3);assert.equal(new Set(a.map(p=>p.video.publisher)).size,3);
 assert.equal(dailySelection(posts,{...l,topic:'Sanat'},'2026-09-25').every(p=>p.category==='Sanat'),true);
});
test('review scheduling, daily progress and notes survive normalized storage',()=>{
 let l=recordRecall(emptyLearning(),'p-0',{note:'Bir fikir',application:'Anlatacağım',remembered:true},'2026-09-25');
 assert.equal(l.records['p-0'].due,'2026-09-26');assert.equal(reviewDue(posts,l,'2026-09-25').length,0);assert.equal(reviewDue(posts,l,'2026-09-26').length,1);
 l=recordRecall(l,'p-0',{note:'Düzenlendi',remembered:true},'2026-09-25');assert.equal(l.records['p-0'].reviews,1);assert.equal(l.days['2026-09-25'].length,1);
 l=recordRecall(l,'p-0',{note:'Hatırladım',remembered:true},'2026-09-26');assert.equal(l.records['p-0'].due,'2026-09-29');assert.deepEqual(normalizeLearning(JSON.parse(JSON.stringify(l))),l);
 l=recordRecall(l,'p-0',{remembered:false},'2026-09-29');assert.equal(l.records['p-0'].due,'2026-09-30');assert.equal(l.records['p-0'].level,0);
});
test('old backups get safe defaults and malformed learning records are ignored',()=>{
 assert.deepEqual(normalizeLearning(undefined),emptyLearning());
 const normalized=normalizeLearning({goal:999,records:{bad:{due:'nonsense'},good:{due:'2026-10-01',note:'x'.repeat(1000),level:99}},days:{'2026-09-25':['p-0','p-0',7]}});
 assert.equal(normalized.goal,3);assert.ok(!normalized.records.bad);assert.equal(normalized.records.good.note.length,600);assert.equal(normalized.records.good.level,4);assert.deepEqual(normalized.days['2026-09-25'],['p-0']);
});
test('local calendar reviews cross month boundaries without UTC day shifts',()=>{
 assert.equal(afterDays('2026-09-30',1),'2026-10-01');assert.equal(afterDays('2026-12-31',1),'2027-01-01');
 const l=recordRecall(emptyLearning(),'p-0',{remembered:true},'2026-09-25');assert.equal(weeklyActivity(l,'2026-09-25').at(-1).count,1);
});
