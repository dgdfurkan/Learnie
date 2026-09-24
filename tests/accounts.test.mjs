import test from 'node:test';
import assert from 'node:assert/strict';
import {accountPosts,accountStats,normalizeFollowing} from '../src/accounts.mjs';
import {readAllContent} from '../scripts/validate-content.mjs';

test('account grids include every matching post once without changing the feed order',()=>{
 const posts=readAllContent(),original=posts.map(p=>p.id);
 for(const handle of new Set(posts.map(p=>p.handle))){
  const selected=accountPosts(posts,handle);
  assert.equal(selected.length,posts.filter(p=>p.handle===handle).length);
  assert.ok(selected.every(p=>p.handle===handle));
  assert.equal(new Set(selected.map(p=>p.id)).size,selected.length);
  for(let i=1;i<selected.length;i++)assert.ok(selected[i-1].updatedAt>=selected[i].updatedAt);
 }
 assert.deepEqual(posts.map(p=>p.id),original);
});
test('following safely migrates old backups and social counts respect simulation settings',()=>{
 assert.deepEqual(normalizeFollowing(undefined),[]);
 assert.deepEqual(normalizeFollowing(['atolyeden',null,'',42,'atolyeden','x'.repeat(101)]),['atolyeden']);
 assert.deepEqual(accountStats('atolyeden',false,false),{followers:0,following:0});
 assert.deepEqual(accountStats('atolyeden',false,true),{followers:1,following:0});
 const before=accountStats('atolyeden',true,false),after=accountStats('atolyeden',true,true);
 assert.equal(after.followers,before.followers+1);
 assert.deepEqual(accountStats('atolyeden',true,false),before);
});
