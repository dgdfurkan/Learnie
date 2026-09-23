// Documented player options only. Branding is deliberately left to YouTube.
export function youtubeOptions(mode='minimal',origin=''){
 return {autoplay:1,playsinline:1,hl:'tr',rel:0,cc_lang_pref:'tr',cc_load_policy:1,iv_load_policy:3,color:'white',controls:mode==='native'?1:0,origin};
}
export function videoTime(seconds){const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
