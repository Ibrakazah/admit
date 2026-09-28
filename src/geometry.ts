import type { Point } from "./types";
export const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const dist=(a:Point,b:Point,aspect=1)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y);
export const angle=(a:Point,b:Point,c:Point)=>{const ab=[a.x-b.x,a.y-b.y],cb=[c.x-b.x,c.y-b.y]; const d=ab[0]*cb[0]+ab[1]*cb[1]; return Math.acos(clamp(d/(Math.hypot(...ab)*Math.hypot(...cb)||1),-1,1))*180/Math.PI};
export const average=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
