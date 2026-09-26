import test from 'node:test';
import assert from 'node:assert/strict';
import {addActivity,dayKey,streak,todayCount,recallCandidate} from '../src/learning-model.mjs';
test('daily activity counts locally and keeps a consecutive streak',()=>{
 const d=(s)=>new Date(`${s}T12:00:00`);
 let a={};a=addActivity(a,d('2026-09-24'));a=addActivity(a,d('2026-09-25'),3);
 assert.equal(todayCount(a,d('2026-09-25')),3);assert.equal(dayKey(d('2026-09-05')),'2026-09-05');
 assert.equal(streak(a,d('2026-09-25')),2);
 assert.equal(streak(a,d('2026-09-26')),2,'today not started yet keeps yesterday’s streak');
 assert.equal(streak(a,d('2026-09-27')),0);
 const long=Array.from({length:500},(_,i)=>i).reduce((acc,i)=>addActivity(acc,new Date(2024,0,1+i)),{});
 assert.ok(Object.keys(long).length<=400);
});
test('recall prefers unanswered quizzes and never picks unseen posts',()=>{
 const posts=[{id:'a',title:'A',subtitle:'a'},{id:'b',title:'B',subtitle:'b',quiz:{}},{id:'c',title:'C',subtitle:'c'}];
 assert.equal(recallCandidate(posts,{seen:['a','b']},0).id,'b');
 assert.equal(recallCandidate(posts,{seen:['a','b'],answers:{b:1}},0).id,'a');
 assert.equal(recallCandidate(posts,{seen:[]},0),undefined);
 assert.equal(recallCandidate(posts,{seen:['a'],recalled:['a']},1),undefined);
});
