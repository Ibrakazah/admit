import { FACE, HAND } from "./config";
import { clamp, dist } from "./geometry";
import type { Evaluation, FaceFrame, HandFrame, Point } from "./types";

const p=(face:FaceFrame,i:number)=>face.landmarks[i];
const fresh=(face?:FaceFrame)=>!!face && face.landmarks.length>454 && face.landmarks.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y));
const shape=(f:FaceFrame,n:string)=>f.blendshapes[n] ?? 0;
export function sigma(face?:FaceFrame):Evaluation {
 if(!fresh(face)) return {valid:false,quality:0,gates:{face:false},issues:[{id:"no_face",text:"Лицо не видно — вернись в кадр",priority:10}],metrics:{}};
 const f=face!; const size=dist(p(f,FACE.forehead),p(f,FACE.chin)); const centered= size>.18 && p(f,FACE.nose).x>.2 && p(f,FACE.nose).x<.8;
 const left=shape(f,"eyeSquintLeft"), right=shape(f,"eyeSquintRight"), brow=(shape(f,"browDownLeft")+shape(f,"browDownRight"))/2;
 const eye=clamp((left+right)/1.05), browScore=clamp(brow/.52), quality=Math.round((eye*.6+browScore*.4)*100);
 const issues=[] as Evaluation["issues"]; if(!centered) issues.push({id:"center_face",text:"Держи лицо целиком в рамке",priority:9}); else if(eye<.58) issues.push({id:"open_eyes",text:"Прищурься сильнее",priority:7}); else if(browScore<.46) issues.push({id:"relax_brows",text:"Слегка опусти брови",priority:6});
 return {valid:centered,quality,gates:{face:centered,eyes:eye>=.58,brows:browScore>=.46},issues,metrics:{eye,brow:browScore,size}};
}
export function headYaw(face?:FaceFrame){ if(!fresh(face)) return 0; const f=face!, l=dist(p(f,FACE.nose),p(f,FACE.leftCheek)),r=dist(p(f,FACE.nose),p(f,FACE.rightCheek)); return clamp(Math.abs(l-r)/(l+r||1)*2); }
export function profile(face?:FaceFrame):Evaluation { const yaw=headYaw(face); if(!fresh(face)) return sigma(undefined); const quality=Math.round(clamp((yaw-.11)/.17)*100); return {valid:true,quality,gates:{face:true,yaw:yaw>=.18},issues:yaw>=.18?[]:[{id:"turn_head",text:"Поверни голову в сторону до зелёной дуги",priority:8}],metrics:{yaw}}; }
function straightIndex(h:HandFrame){ const a=h.landmarks; if(a.length<21)return false; const bend=Math.abs((a[HAND.indexTip].x-a[HAND.indexMcp].x)*(a[HAND.indexPip].y-a[HAND.indexMcp].y)-(a[HAND.indexTip].y-a[HAND.indexMcp].y)*(a[HAND.indexPip].x-a[HAND.indexMcp].x)); return dist(a[HAND.indexTip],a[HAND.indexMcp])>.075 && bend<.012; }
export function palm(hands:HandFrame[]){ return hands.some(h=>h.landmarks.length>=21 && dist(h.landmarks[HAND.indexTip],h.landmarks[HAND.wrist])>.17 && dist(h.landmarks[HAND.middleTip],h.landmarks[HAND.wrist])>.19 && dist(h.landmarks[HAND.pinkyTip],h.landmarks[HAND.wrist])>.14); }
export function finger(face?:FaceFrame,hands:HandFrame[]=[]):Evaluation { const base=profile(face); if(!fresh(face))return base; if(!base.gates.yaw)return {...base,gates:{...base.gates,finger:false,target:false}}; const f=face!, side=(p(f,FACE.nose).x-p(f,FACE.leftCheek).x) < (p(f,FACE.rightCheek).x-p(f,FACE.nose).x) ? FACE.rightCheek:FACE.leftCheek; const target:Point={x:p(f,side).x,y:(p(f,side).y+p(f,FACE.forehead).y)/2}; const scale=dist(p(f,FACE.forehead),p(f,FACE.chin)); const hand=hands.find(straightIndex); if(!hand)return {valid:true,quality:0,gates:{...base.gates,finger:false,target:false},issues:[{id:"straighten_finger",text:"Выпрями указательный палец",priority:8}],metrics:{...base.metrics}}; const tip=hand.landmarks[HAND.indexTip],dx=(tip.x-target.x)/scale,dy=(tip.y-target.y)/scale,d=Math.hypot(dx,dy),hit=d<.27; let issue:Evaluation["issues"][0]|undefined; if(!hit) issue=Math.abs(dy)>.2?{id:dy<0?"move_down":"move_up",text:dy<0?"Опусти палец немного ниже":"Подними палец немного выше",priority:7}:{id:dx<0?"move_right":"move_left",text:"Сдвинь палец к метке",priority:7}; const quality=Math.round(clamp(1-d/.54)*100); return {valid:true,quality,gates:{...base.gates,finger:true,target:hit},issues:issue?[issue]:[],metrics:{...base.metrics,distance:d,targetX:target.x,targetY:target.y}}; }
