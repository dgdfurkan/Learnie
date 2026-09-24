export function turkishVoices(voices){return voices.filter(v=>/^tr(?:[-_]|$)/i.test(v.lang));}
export function chooseVoice(voices,uri=''){
 const list=turkishVoices(voices);const exact=list.find(v=>v.voiceURI===uri);if(exact)return exact;
 const score=v=>(/natural|neural|online|enhanced|premium/i.test(v.name)?20:0)+(/Google/i.test(v.name)?10:0)+(v.default?1:0);
 return [...list].sort((a,b)=>score(b)-score(a))[0];
}
export function speechSegments(text){
 if(typeof Intl.Segmenter==='function')return [...new Intl.Segmenter('tr',{granularity:'sentence'}).segment(text)].map(s=>({text:s.segment,start:s.index,end:s.index+s.segment.length}));
 return [{text,start:0,end:text.length}];
}
export function wordBoundaryEnd(text,index){const rest=text.slice(index);const word=rest.match(/^\s*\S+/u);return Math.min(text.length,index+(word?.[0].length||0));}
export function spokenUnitCount(text,mode,chars){
 const units=mode==='char'?Array.from(text):text.match(/\S+\s*/gu)||[];let length=0,count=0;
 for(const unit of units){if(length>=chars)break;length+=unit.length;count++;}return count;
}
