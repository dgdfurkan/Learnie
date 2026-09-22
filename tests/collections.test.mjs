import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCollections,setCollectionMembership,removeSavedPost} from '../src/collections.mjs';
test('old backups migrate without dropping saved posts; corrupt memberships are removed',()=>{
 const saved=['a','b'];assert.deepEqual(normalizeCollections(undefined,saved),[]);
 const input=[null,{id:'one',name:'  Gece okumaları  ',postIds:['a','a','removed',null],createdAt:'2026-09-22'},{id:'one',name:'Duplicate',postIds:['b']},{id:3,name:'Invalid',postIds:[]}];
 assert.deepEqual(normalizeCollections(input,saved),[{id:'one',name:'Gece okumaları',postIds:['a'],createdAt:'2026-09-22'}]);assert.deepEqual(saved,['a','b']);
});
test('one saved post can belong to several collections without duplicate membership',()=>{
 const initial=[{id:'one',name:'İlk',postIds:[]},{id:'two',name:'İkinci',postIds:[]}];
 let current=setCollectionMembership(initial,'one','a',true);current=setCollectionMembership(current,'two','a',true);current=setCollectionMembership(current,'one','a',true);
 assert.deepEqual(current.map(c=>c.postIds),[['a'],['a']]);assert.deepEqual(initial.map(c=>c.postIds),[[],[]]);
 const roundTrip=JSON.parse(JSON.stringify(current));assert.deepEqual(setCollectionMembership(roundTrip,'one','a',false).map(c=>c.postIds),[[],['a']]);
});
test('unsaving cleans all collections while deleting a collection keeps the archive',()=>{
 const state={saved:['a','b'],liked:['a'],collections:[{id:'one',name:'İlk',postIds:['a','b']},{id:'two',name:'İkinci',postIds:['a']}]};
 const next=removeSavedPost(state,'a');assert.deepEqual(next.saved,['b']);assert.deepEqual(next.collections.map(c=>c.postIds),[['b'],[]]);assert.deepEqual(next.liked,['a']);assert.deepEqual(state.saved,['a','b']);
 const deleted={...state,collections:state.collections.filter(c=>c.id!=='one')};assert.deepEqual(deleted.saved,['a','b']);
});
