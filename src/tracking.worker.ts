/// <reference lib="webworker" />
import { FaceLandmarker, FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
type Init = { type:"init"; session:number };
type Frame = { type:"frame"; bitmap:ImageBitmap; ts:number; session:number };
let face:FaceLandmarker|undefined, hand:HandLandmarker|undefined;
const post=(data:unknown,transfer?:Transferable[])=>self.postMessage(data,transfer ?? []);
async function init(session:number){
 try { const wasmRoot=new URL("../mediapipe/",self.location.href).href;
   const model=(name:string)=>new URL(`../models/${name}`,self.location.href).href;
   const vision=await FilesetResolver.forVisionTasks(wasmRoot);
   const create=async(delegate:"GPU"|"CPU")=>({
     face:await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:model("face_landmarker.task"),delegate},runningMode:"VIDEO",numFaces:1,outputFaceBlendshapes:true}),
     hand:await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:model("hand_landmarker.task"),delegate},runningMode:"VIDEO",numHands:2})
   });
   let tasks; try{tasks=await create("GPU")}catch{tasks=await create("CPU")}; face=tasks.face; hand=tasks.hand;
   post({type:"ready",session});
 } catch(error) { post({type:"error",session,message:error instanceof Error?error.message:"Не удалось загрузить модели"}); }
}
self.onmessage=async(e:MessageEvent<Init|Frame|{type:"close"}>)=>{ const data=e.data;
 if(data.type==="init") return void init(data.session);
 if(data.type==="close"){face?.close();hand?.close();face=undefined;hand=undefined;return;}
 if(!face||!hand)return; const start=performance.now();
 try { const faces=face.detectForVideo(data.bitmap,data.ts),hands=hand.detectForVideo(data.bitmap,data.ts); data.bitmap.close();
   const blend=Object.fromEntries((faces.faceBlendshapes[0]?.categories??[]).map(c=>[c.categoryName,c.score]));
   post({type:"result",session:data.session,ts:data.ts,duration:performance.now()-start,face:faces.faceLandmarks[0]?{landmarks:faces.faceLandmarks[0],blendshapes:blend,ts:data.ts}:undefined,hands:hands.landmarks.map((landmarks,i)=>({landmarks,handedness:hands.handednesses[i]?.[0]?.categoryName??"",ts:data.ts}))});
 } catch(error) { try{data.bitmap.close()}catch{}; post({type:"frameError",session:data.session,message:error instanceof Error?error.message:"Ошибка распознавания"}); }
};
export {};
