// ============================================================
//  dom-utils.js — shared VFX DOM helpers
// ============================================================

export const getEffectRect = (el) => {
  if (!el || !el.getBoundingClientRect) return null;
  return el.getBoundingClientRect();
};

export function cleanupAllEffects() {
  document.querySelectorAll('.battle-vfx').forEach(el => el.remove());
}
