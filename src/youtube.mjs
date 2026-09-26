// Documented player options only. Branding is deliberately left to YouTube.
export function youtubeOptions(origin=''){
 // One player is reused for every video. Learnie draws the only control layer
 // (tap for sound, hold to pause, progress), so YouTube's own bar is hidden.
 // Playback starts through loadVideoById once the player is ready.
 return {autoplay:0,playsinline:1,hl:'tr',rel:0,cc_lang_pref:'tr',cc_load_policy:1,iv_load_policy:3,color:'white',controls:0,disablekb:1,fs:0,origin};
}
export function videoTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
