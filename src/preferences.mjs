export const defaultPreferences = Object.freeze({theme:'system',focus:false,reveal:'word',wordSpeed:180,charSpeed:18,textSize:1,narration:false,music:false,musicVolume:18,savedLayout:'grid',videoControls:'native',videoMuted:false,videoVolume:100,voiceURI:'',speechRate:1});
export function normalizePreferences(raw={}) {
 const p=raw&&typeof raw==='object'?raw:{};
 const pick=(key,values)=>values.includes(p[key])?p[key]:defaultPreferences[key];
 const number=(key,min,max)=>typeof p[key]==='number'&&Number.isFinite(p[key])?Math.min(max,Math.max(min,p[key])):defaultPreferences[key];
 return {theme:pick('theme',['system','light','dark']),focus:typeof p.focus==='boolean'?p.focus:false,reveal:pick('reveal',['word','char']),wordSpeed:number('wordSpeed',60,360),charSpeed:number('charSpeed',5,40),textSize:number('textSize',.9,1.2),narration:typeof p.narration==='boolean'?p.narration:false,music:typeof p.music==='boolean'?p.music:false,musicVolume:number('musicVolume',0,40),savedLayout:pick('savedLayout',['grid','list']),videoControls:'native',videoMuted:typeof p.videoMuted==='boolean'?p.videoMuted:false,videoVolume:number('videoVolume',0,100),voiceURI:typeof p.voiceURI==='string'&&p.voiceURI.length<=300?p.voiceURI:'',speechRate:number('speechRate',.7,1.3)};
}
export function splitPassages(text,limit=18){
 const words=text.trim().split(/\s+/u);const chunks=[];let chunk=[];
 for(const word of words){if(chunk.length&&chunk.join(' ').length+word.length>132){chunks.push(chunk.join(' '));chunk=[];}chunk.push(word);if(chunk.length>=limit||(chunk.length>=9&&/[.!?…]$/u.test(word))){chunks.push(chunk.join(' '));chunk=[];}}
 if(chunk.length)chunks.push(chunk.join(' '));return chunks;
}
export function revealUnits(text,mode){return mode==='char'?Array.from(text):text.match(/\S+\s*/gu)||[];}
export function createScenes(post,prefs){
 const raw=[{title:post.title,text:post.subtitle,kicker:post.category,cover:true},...post.slides.flatMap((slide,i)=>splitPassages(slide.text).map((text,j)=>({title:'',text,kicker:slide.kicker||post.category,cover:false,section:i,part:j})))];
 let start=0;return raw.map(s=>{const units=revealUnits(s.text,prefs.reveal);const speed=prefs.reveal==='word'?prefs.wordSpeed/60:prefs.charSpeed;const seconds=prefs.focus?units.length/speed+3:Math.max(5,s.text.split(/\s+/u).length/2.5+2);const narrationSeconds=prefs.narration?(s.title+' '+s.text).split(/\s+/u).length/2+3:0;const frames=Math.ceil(Math.max(seconds,narrationSeconds)*30)+18;const result={...s,start,frames};start+=frames;return result;});
}
export function visibleUnitCount(text,mode,frame,prefs){const speed=mode==='word'?prefs.wordSpeed/60:prefs.charSpeed;return Math.min(revealUnits(text,mode).length,Math.max(0,Math.floor((frame-18)/30*speed)+1));}
