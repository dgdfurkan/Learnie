import test from 'node:test';
import assert from 'node:assert/strict';
import {youtubeOptions,videoTime} from '../src/youtube.mjs';
import {normalizePreferences} from '../src/preferences.mjs';
test('both player modes retain Turkish captions and supported branding behavior',()=>{
 for(const mode of ['minimal','native']){const vars=youtubeOptions(mode,'https://dgdfurkan.github.io');assert.equal(vars.cc_lang_pref,'tr');assert.equal(vars.cc_load_policy,1);assert.equal(vars.playsinline,1);assert.equal(vars.controls,mode==='native'?1:0);assert.equal(vars.origin,'https://dgdfurkan.github.io');assert.ok(!('modestbranding'in vars));assert.ok(!('showinfo'in vars));}
});
test('legacy preferences migrate to minimal controls and preserve an explicit native choice',()=>{
 assert.equal(normalizePreferences({}).videoControls,'minimal');assert.equal(normalizePreferences({videoControls:'native'}).videoControls,'native');assert.equal(normalizePreferences({videoControls:'unknown'}).videoControls,'minimal');assert.equal(videoTime(118.9),'1:58');assert.equal(videoTime(-1),'0:00');
});
