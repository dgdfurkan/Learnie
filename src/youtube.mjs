// Documented player options only. Branding is deliberately left to YouTube.
export function youtubeOptions(origin=''){
 // One player is reused for every video. Learnie's layer covers the frame, so
 // YouTube's controls stay out of the way; they are kept because when a
 // browser (iOS) needs a tap inside the frame for sound, YouTube's own play
 // button is the only thing that can receive it.
 return {autoplay:0,playsinline:1,hl:'tr',rel:0,cc_lang_pref:'tr',cc_load_policy:1,iv_load_policy:3,color:'white',controls:1,disablekb:1,fs:0,origin};
}
export function videoTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
