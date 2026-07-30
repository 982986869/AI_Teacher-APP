/**
 * ARKit-52 expression targets for the Ailernova teacher.
 *
 * Every key here MUST match Apple's ARKit blendshape naming exactly.
 * That naming is what lets us swap the model, plug in any lip-sync
 * service, or drive the face from an iPhone without touching this file.
 *
 * Weights are 0..1. Anything omitted resolves to 0.
 */

export const EXPRESSIONS = {
  idle: {
    mouthSmileLeft: 0.18,
    mouthSmileRight: 0.18,
    browInnerUp: 0.05,
  },

  thinking: {
    browDownLeft: 0.35,
    browDownRight: 0.1,
    browInnerUp: 0.25,
    eyeSquintLeft: 0.25,
    eyeSquintRight: 0.25,
    eyeLookUpLeft: 0.3,
    eyeLookUpRight: 0.3,
    mouthPucker: 0.2,
    mouthLeft: 0.15,
  },

  celebrating: {
    mouthSmileLeft: 0.9,
    mouthSmileRight: 0.9,
    mouthOpen: 0.25,
    jawOpen: 0.2,
    cheekSquintLeft: 0.6,
    cheekSquintRight: 0.6,
    eyeSquintLeft: 0.55,
    eyeSquintRight: 0.55,
    browOuterUpLeft: 0.6,
    browOuterUpRight: 0.6,
    browInnerUp: 0.4,
  },

  encouraging: {
    mouthSmileLeft: 0.4,
    mouthSmileRight: 0.4,
    browInnerUp: 0.65,
    browOuterUpLeft: 0.2,
    browOuterUpRight: 0.2,
    eyeSquintLeft: 0.15,
    eyeSquintRight: 0.15,
    headTiltHint: 0, // consumed by the rig driver, not a real ARKit shape
  },

  explaining: {
    browInnerUp: 0.2,
    browOuterUpLeft: 0.25,
    browOuterUpRight: 0.25,
    mouthSmileLeft: 0.12,
    mouthSmileRight: 0.12,
  },
};

/**
 * Per-state rig hints the blendshapes can't express.
 * Radians. Applied additively to the head bone.
 */
export const POSE_HINTS = {
  idle: { pitch: 0, yaw: 0, roll: 0 },
  thinking: { pitch: -0.06, yaw: 0.12, roll: 0.08 },
  celebrating: { pitch: -0.08, yaw: 0, roll: 0 },
  encouraging: { pitch: 0.04, yaw: 0, roll: 0.14 },
  explaining: { pitch: 0, yaw: 0, roll: 0 },
};

/**
 * Oculus/Rhubarb viseme -> ARKit shape mixes.
 *
 * Rhubarb Lip Sync emits mouth cues A..H plus X (rest). Feeding those
 * through here gets you serviceable lip sync with zero runtime cost —
 * you pre-bake the timing JSON alongside your TTS audio and just play
 * them together. See README for the pipeline.
 */
export const VISEMES = {
  X: {},
  A: { mouthClose: 0.6, mouthPressLeft: 0.3, mouthPressRight: 0.3 },
  B: { jawOpen: 0.12, mouthStretchLeft: 0.2, mouthStretchRight: 0.2 },
  C: { jawOpen: 0.34, mouthFunnel: 0.1 },
  D: { jawOpen: 0.55, mouthStretchLeft: 0.1, mouthStretchRight: 0.1 },
  E: { jawOpen: 0.28, mouthFunnel: 0.4, mouthPucker: 0.3 },
  F: { jawOpen: 0.14, mouthPucker: 0.75, mouthFunnel: 0.5 },
  G: { jawOpen: 0.16, mouthLowerDownLeft: 0.4, mouthLowerDownRight: 0.4 },
  H: { jawOpen: 0.3, tongueOut: 0.25 },
};

export const STATES = Object.keys(EXPRESSIONS);
