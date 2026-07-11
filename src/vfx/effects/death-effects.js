// ============================================================
//  death-effects.js — card death dissolve VFX
// ============================================================
import { sd } from '../../core/config.js';

export function shatterCard(slotEl) {
  if (!slotEl) return;
  const rect = slotEl.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return;

  const cardEl = slotEl.querySelector('.card');
  const sourceEl = cardEl || slotEl;
  const imgUrl = cardEl?.querySelector('.card-image-bg')?.style.backgroundImage || 'none';

  sourceEl.classList.add('card-death-source');
  sd(() => sourceEl.classList.remove('card-death-source'), 520);

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const ghost = document.createElement('div');
  ghost.className = 'battle-vfx card-death-ghost';
  ghost.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;background-image:${imgUrl};`;
  document.body.appendChild(ghost);
  sd(() => ghost.remove(), 520);

  const ring = document.createElement('div');
  ring.className = 'battle-vfx card-death-ring';
  const size = Math.max(rect.width, rect.height);
  ring.style.cssText = `left:${centerX}px;top:${centerY}px;width:${size}px;height:${size}px;`;
  document.body.appendChild(ring);
  sd(() => ring.remove(), 540);

  [
    { x: -30, y: -44, s: 0.72, d: 0.00 },
    { x:  28, y: -50, s: 0.62, d: 0.03 },
    { x: -38, y:  14, s: 0.56, d: 0.06 },
    { x:  34, y:  20, s: 0.66, d: 0.09 },
  ].forEach((mote) => {
    const el = document.createElement('div');
    el.className = 'battle-vfx card-death-mote';
    el.style.cssText = [
      `left:${centerX}px`,
      `top:${centerY}px`,
      `--dm-x:${mote.x}px`,
      `--dm-y:${mote.y}px`,
      `--dm-s:${mote.s}`,
      `--dm-delay:${mote.d}s`,
    ].join(';');
    document.body.appendChild(el);
    sd(() => el.remove(), 700);
  });
}

// ── Blood Nova AOE VFX ───────────────────────────────────────
// Visual only: rule damage is resolved by combat.js before/after this runs.
