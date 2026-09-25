import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeOptions,videoTime} from '../src/youtube.mjs';
import {normalizePreferences} from '../src/preferences.mjs';
test('one native control layer retains Turkish captions and API-driven startup',()=>{
 const vars=youtubeOptions('https://dgdfurkan.github.io');
 assert.equal(vars.cc_lang_pref,'tr');assert.equal(vars.cc_load_policy,1);
 assert.equal(vars.playsinline,1);assert.equal(vars.controls,1);assert.equal(vars.autoplay,1);
 assert.equal(vars.origin,'https://dgdfurkan.github.io');
 assert.ok(!('modestbranding'in vars));assert.ok(!('showinfo'in vars));
});
test('legacy controls migrate without losing the saved sound preference',()=>{
 for(const videoControls of [undefined,'minimal','native','unknown'])assert.equal(normalizePreferences({videoControls}).videoControls,'native');
 assert.equal(normalizePreferences({videoMuted:false}).videoMuted,false);
 assert.equal(normalizePreferences({}).videoVolume,100);
 assert.equal(normalizePreferences({videoVolume:43}).videoVolume,43);
 assert.equal(normalizePreferences({videoVolume:200}).videoVolume,100);
 assert.equal(videoTime(118.9),'1:58');assert.equal(videoTime(-1),'0:00');
});
