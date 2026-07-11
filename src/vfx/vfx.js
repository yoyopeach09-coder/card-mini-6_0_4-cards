// ============================================================
//  vfx.js — facade for split VFX modules
//  Engine พื้นฐาน: เหลือแค่ float / dom-utils / death (shatter) VFX
// ============================================================
export { getEffectRect, cleanupAllEffects } from './dom-utils.js';
export { showFloat, updateFloats } from './float-engine.js';
export { shatterCard } from './effects/death-effects.js';
