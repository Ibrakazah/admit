import { RULES } from "./config";
export type Hold = { since:number|null; lastTs:number|null; scores:number[] };
export const emptyHold=():Hold=>({since:null,lastTs:null,scores:[]});
export function advanceHold(hold:Hold, pass:boolean, score:number, ts:number){ if(!pass || (hold.lastTs!==null && ts<=hold.lastTs) || (hold.lastTs!==null&&ts-hold.lastTs>300)) return emptyHold(); const next=hold.since===null?{since:ts,lastTs:ts,scores:[score]}:{since:hold.since,lastTs:ts,scores:[...hold.scores,score]}; return next; }
export function holdProgress(h:Hold,now:number){return h.since===null?0:Math.min(1,(now-h.since)/RULES.holdMs)};
export function stableScore(h:Hold){ if(h.since===null || h.scores.length<3)return 0; return Math.round(h.scores.reduce((a,b)=>a+b,0)/h.scores.length); }
