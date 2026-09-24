import test from 'node:test';
import assert from 'node:assert/strict';
import {rememberPosition,rememberedPosition,closestVisibleVideo} from '../src/playback.mjs';
import {chooseVoice,turkishVoices,speechSegments,wordBoundaryEnd,spokenUnitCount} from '../src/narration.mjs';
import {isBackSwipe} from '../src/gestures.mjs';
import {normalizePreferences} from '../src/preferences.mjs';

test('only one eligible video wins autoplay; covered and half-visible videos never win',()=>{
 const rows=[{id:'background',active:false,fraction:1,distance:0},{id:'next',active:true,fraction:.5,distance:0},{id:'visible',active:true,fraction:.9,distance:15},{id:'farther',active:true,fraction:.9,distance:160}];
 assert.equal(closestVisibleVideo(rows),'visible');
 assert.equal(closestVisibleVideo(rows.slice(0,2)),undefined);
 assert.equal(closestVisibleVideo([]),undefined);
});
test('returning videos resume independently and completed videos start over',()=>{
 rememberPosition('first',38.25,90);rememberPosition('second',9,60);
 assert.equal(rememberedPosition('first'),38.25);assert.equal(rememberedPosition('second'),9);
 for(const invalid of [-1,NaN,Infinity,undefined])rememberPosition('first',invalid,90);
 assert.equal(rememberedPosition('first'),38.25);
 rememberPosition('first',90,90);assert.equal(rememberedPosition('first'),0);
});
test('Turkish voice choice uses a real available voice and preserves explicit preferences',()=>{
 const basic={voiceURI:'local-tr',lang:'tr-TR',name:'Türkçe',default:true};
 const natural={voiceURI:'natural-tr',lang:'tr_TR',name:'Türkçe Natural'};
 const english={voiceURI:'en',lang:'en-US',name:'English Neural'};
 assert.deepEqual(turkishVoices([english,basic,natural]),[basic,natural]);
 assert.equal(chooseVoice([english,basic,natural]),natural);
 assert.equal(chooseVoice([basic,natural],basic.voiceURI),basic);
 assert.equal(chooseVoice([basic],'removed'),basic);assert.equal(chooseVoice([english]),undefined);
 const prefs=normalizePreferences({voiceURI:basic.voiceURI,speechRate:1.15,videoMuted:false});
 assert.equal(prefs.voiceURI,basic.voiceURI);assert.equal(prefs.speechRate,1.15);assert.equal(prefs.videoMuted,false);
 assert.equal(normalizePreferences({speechRate:99}).speechRate,1.3);
});
test('speech segments and word offsets preserve Turkish text, punctuation and emoji',()=>{
 const text='İlk cümle burada. Şimdi 🌿 ikinci cümleyi dinleyelim! Sonra?';
 const segments=speechSegments(text);assert.equal(segments.map(s=>s.text).join(''),text);
 for(const s of segments)assert.equal(text.slice(s.start,s.end),s.text);
 const line='Şimdi 🌿 ikinci cümleyi dinleyelim!';
 const end=wordBoundaryEnd(line,line.indexOf('ikinci'));assert.equal(line.slice(0,end),'Şimdi 🌿 ikinci');
 assert.equal(spokenUnitCount(line,'word',0),0);assert.equal(spokenUnitCount(line,'word',end),3);
 assert.equal(spokenUnitCount(line,'char',end),Array.from(line.slice(0,end)).length);
});
test('back gestures accept either inward edge swipe without stealing vertical or carousel swipes',()=>{
 assert.equal(isBackSwipe({x:8,y:200,width:390},{x:110,y:218}),true);
 assert.equal(isBackSwipe({x:382,y:200,width:390},{x:260,y:210}),true);
 assert.equal(isBackSwipe({x:180,y:200,width:390},{x:60,y:210}),false);
 assert.equal(isBackSwipe({x:8,y:200,width:390},{x:110,y:380}),false);
 assert.equal(isBackSwipe({x:8,y:200,width:390},{x:65,y:200}),false);
 assert.equal(isBackSwipe({x:8,y:200,width:390},{x:-100,y:200}),false);
});
