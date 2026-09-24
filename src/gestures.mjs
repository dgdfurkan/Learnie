export function isBackSwipe({x,y,width},end){
 const dx=end.x-x,dy=end.y-y;
 return Math.abs(dx)>=72&&Math.abs(dx)>Math.abs(dy)*1.5&&((x<=30&&dx>0)||(x>=width-30&&dx<0));
}
