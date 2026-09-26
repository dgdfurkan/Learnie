// Documented player options only. Branding is deliberately left to YouTube.
export function youtubeOptions(origin=''){
 // Learnie draws the only control layer, so YouTube's bar is hidden. When iOS
 // needs a tap inside the frame, the video is cued and YouTube's large play
 // button (shown even without controls) receives it.
 return {autoplay:0,playsinline:1,hl:'tr',rel:0,cc_lang_pref:'tr',cc_load_policy:1,iv_load_policy:3,color:'white',controls:0,disablekb:1,fs:0,origin};
}
export function videoTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
