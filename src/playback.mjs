const positions=new Map();
export function rememberPosition(id,seconds,duration=0){
 if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0)return;
 positions.set(id,duration>0&&seconds>=duration-.5?0:seconds);
}
export function rememberedPosition(id){return positions.get(id)||0;}
export function closestVisibleVideo(candidates){
 return candidates.filter(c=>c.active&&c.fraction>.5).sort((a,b)=>a.distance-b.distance)[0]?.id;
}
