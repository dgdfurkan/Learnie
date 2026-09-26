// Small learning loop: a daily goal, a streak of active days and spaced recall.
export const GOALS=[5,10,20];
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function addActivity(activity={},date=new Date(),amount=1){
 const key=dayKey(date),next={...activity,[key]:(activity[key]||0)+amount};
 // Keep roughly one year so the stored state stays small.
 const keys=Object.keys(next).sort();for(const old of keys.slice(0,Math.max(0,keys.length-400)))delete next[old];
 return next;
}
export function todayCount(activity={},date=new Date()){return activity[dayKey(date)]||0;}
/** Consecutive active days ending today, or yesterday when today has not started yet. */
export function streak(activity={},date=new Date()){
 const day=new Date(date.getFullYear(),date.getMonth(),date.getDate());
 if(!activity[dayKey(day)])day.setDate(day.getDate()-1);
 let n=0;while(activity[dayKey(day)]>0){n++;day.setDate(day.getDate()-1);}
 return n;
}
/**
 * A recall prompt for a post seen earlier: prefer unanswered quizzes, then
 * posts not recalled yet. Deterministic per slot so it stays stable on rerender.
 */
/** @param {any[]} posts @param {{seen?:string[],recalled?:string[],answers?:Record<string,number>,exclude?:string[]}} state @param {number} [slot] */
export function recallCandidate(posts,{seen=[],recalled=[],answers={},exclude=[]},slot=0){
 const seenSet=new Set(seen),done=new Set(recalled),skip=new Set(exclude);
 const pool=posts.filter(p=>seenSet.has(p.id)&&!skip.has(p.id)&&p.subtitle&&p.title);
 const quizzes=pool.filter(p=>p.quiz&&answers[p.id]===undefined);
 const fresh=pool.filter(p=>!done.has(p.id)&&!p.quiz);
 const list=quizzes.length&&slot%2===0?quizzes:fresh.length?fresh:quizzes;
 return list.length?list[(slot*7919)%list.length]:undefined;
}
