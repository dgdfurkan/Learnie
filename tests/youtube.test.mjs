import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeOptions,videoTime} from '../src/youtube.mjs';
import {normalizePreferences} from '../src/preference-model.mjs';
test('one Learnie control layer: YouTube controls hidden, Turkish captions and API-driven startup kept',()=>{
 const vars=youtubeOptions('https://dgdfurkan.github.io');
 assert.equal(vars.cc_lang_pref,'tr');assert.equal(vars.cc_load_policy,1);
 assert.equal(vars.playsinline,1);assert.equal(vars.controls,0);assert.equal(vars.fs,0);assert.equal(vars.autoplay,0);
 assert.equal(vars.origin,'https://dgdfurkan.github.io');
 assert.ok(!('modestbranding'in vars));assert.ok(!('showinfo'in vars));
});
test('legacy controls migrate without losing the saved sound preference',()=>{
 for(const videoControls of [undefined,'minimal','native','unknown'])assert.equal(normalizePreferences({videoControls}).videoControls,'native');
 assert.equal(normalizePreferences({videoMuted:false}).videoMuted,false);
 assert.equal(normalizePreferences({}).videoMuted,false,'videos start with sound by default');
 assert.equal(normalizePreferences({videoMuted:true}).videoMuted,false,'the old muted default is reset once');
 assert.equal(normalizePreferences({videoMuted:true,videoPolicy:2}).videoMuted,true,'a new explicit mute is kept');
 assert.equal(normalizePreferences({}).videoVolume,100);
 assert.equal(normalizePreferences({videoVolume:43}).videoVolume,43);
 assert.equal(normalizePreferences({videoVolume:200}).videoVolume,100);
 assert.equal(videoTime(118.9),'1:58');assert.equal(videoTime(-1),'0:00');
});
