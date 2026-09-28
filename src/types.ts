export type Point = { x: number; y: number; z?: number };
export type FaceFrame = { landmarks: Point[]; blendshapes: Record<string, number>; ts: number };
export type HandFrame = { landmarks: Point[]; handedness: string; ts: number };
export type TrackingFrame = { face?: FaceFrame; hands: HandFrame[]; ts: number; duration: number };
export type IssueId = "no_face" | "center_face" | "open_eyes" | "relax_brows" | "turn_head" | "no_hand" | "straighten_finger" | "move_left" | "move_right" | "move_up" | "move_down";
export type Evaluation = { valid: boolean; quality: number; gates: Record<string, boolean>; issues: { id: IssueId; text: string; priority: number }[]; metrics: Record<string, number> };
export type Phase = "landing" | "loading" | "calibrating" | "ready" | "countdown" | "sigma" | "roundResult" | "moggerProfile" | "moggerFinger" | "results" | "paused" | "recoverableError";
