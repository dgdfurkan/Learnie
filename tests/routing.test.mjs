import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePostRoute,readerPath} from '../src/routing.mjs';
import {sharePath} from '../src/engine.mjs';
test('old and new share URLs open Reels while preserving the exact post identity',()=>{
 assert.deepEqual(parsePostRoute('/Learnie/p/ay-nasil-olustu/'),{id:'ay-nasil-olustu',slide:0,mode:'reels'});
 const url=new URL(sharePath('ornek',2,'/Learnie/'),'https://dgdfurkan.github.io');
 assert.deepEqual(parsePostRoute(url.pathname,url.search),{id:'ornek',slide:2,mode:'reels'});
});
test('reading is explicit and malformed routes cannot crash the shared entry',()=>{
 const url=new URL(readerPath('ornek',3,'/Learnie/'),'https://dgdfurkan.github.io');
 assert.deepEqual(parsePostRoute(url.pathname,url.search),{id:'ornek',slide:3,mode:'read'});
 assert.equal(parsePostRoute('/Learnie/p/%E0%A4%A/'),null);
 assert.equal(parsePostRoute('/Learnie/p/ornek/','?slide=no').slide,0);
});
