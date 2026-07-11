// ============================================================
//  hero-hp.js — hero HP animation only
//
//  Phase A1: ตรรกะแพ้/ชนะย้ายออกไปที่ game/win-check.js แล้ว (single
//  source of truth ที่เรียกได้จากทุกจุดที่ HP/board/deck เปลี่ยน ไม่ใช่
//  แค่ตอน updateHeroHP ถูกเรียก) — ที่นี่เหลือแค่หน้าที่ animate ตัวเลข
//  HP บนหน้าจอเท่านั้น ไม่ตัดสินผลเกม
// ============================================================
import { sd } from '../../core/config.js';
import { gs, dom } from '../../core/state.js';

let _pHPDisplay = -1, _eHPDisplay = -1;
const _hpTimers = new WeakMap();

export function resetHPDisplays() { _pHPDisplay = -1; _eHPDisplay = -1; }

export function animateHP(el, fromVal, toVal, prefix = 'HP: ') {
  if (!el) return;
  if (_hpTimers.has(el)) clearInterval(_hpTimers.get(el));
  el.classList.remove('hp-hit', 'hp-heal');
  void el.offsetWidth;
  el.classList.add(toVal < fromVal ? 'hp-hit' : 'hp-heal');
  sd(() => el.classList.remove('hp-hit', 'hp-heal'), 350);
  let current = fromVal;
  const timer = setInterval(() => {
    const remaining = Math.abs(toVal - current);
    const step = Math.max(1, Math.round(remaining * 0.2));
    current += (toVal > current ? 1 : -1) * step;
    if ((toVal > fromVal && current >= toVal) || (toVal < fromVal && current <= toVal)) current = toVal;
    el.innerText = `${prefix}${current}`;
    if (current === toVal) { clearInterval(timer); _hpTimers.delete(el); }
  }, 16);
  _hpTimers.set(el, timer);
}

export function updateHeroHP() {
  if (!dom.playerHeroText) return;
  if (gs.playerHP !== _pHPDisplay) { animateHP(dom.playerHeroText, _pHPDisplay, gs.playerHP); _pHPDisplay = gs.playerHP; }
  if (gs.enemyHP  !== _eHPDisplay) { animateHP(dom.enemyHeroText,  _eHPDisplay, gs.enemyHP);  _eHPDisplay = gs.enemyHP; }
}
