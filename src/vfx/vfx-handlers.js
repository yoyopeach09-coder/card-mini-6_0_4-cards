// ============================================================
//  vfx-handlers.js — Single subscriber for UI + VFX events
//  ขึ้นกับ: events.js · vfx.js · ui.js · config.js · state.js (dom) ·
//  ui/panels/log-panel.js (addLog)
//
//  กติกาโครงสร้าง: src/game/* ห้าม import จาก src/ui/* หรือ src/vfx/*
//  โดยเด็ดขาด และห้ามแตะ dom.* เลย — ทุกจุดที่ game logic ต้องการ sync UI
//  (flushBoard, renderHand, ...), เล่น VFX (showFloat, shatterCard, ...),
//  log (addLog), หรือ lock/unlock ปุ่มจบเทิร์น ต้อง emit() event แทน
//  แล้วไฟล์นี้เป็นไฟล์เดียวที่ subscribe และเรียกฟังก์ชันจริงจาก ui/ui.js
//  กับ vfx/vfx.js — รวมถึงเป็นจุดเดียวที่ resolve location descriptor
//  { isPlayer, idx, target } ที่ game/* ส่งมา ให้กลายเป็น dom element จริง
//  (ดู resolveEl ด้านล่าง — Phase 3.4/3.5)
//
//  subscribe ใน setupVFXHandlers() ซึ่งเรียกครั้งเดียวตอน boot
//  initGame() ไม่ต้อง clear เพราะ handler ไม่ได้ hold state เกม
//
//  Engine พื้นฐาน: เหลือแค่ UI-sync 6 ตัว + LOG/LOCK_TURN/UNLOCK_TURN +
//  FLOAT/IMPACT/CARD_SWING/CARD_UNSWING/SHATTER/HIT_SHAKE/SCREEN_SHAKE
// ============================================================
import { on, EV } from '../core/events.js';
import { showFloat, shatterCard } from './vfx.js';
import {
  flushBoard, updateHeroHP, updateGrave,
  renderHand, renderEnemyHand, updateDeckCount,
  renderStatsUI, openDetail,
} from '../ui/ui.js';
import { addLog } from '../ui/panels/log-panel.js';
import { sd, OWNER } from '../core/config.js';
import { dom } from '../core/state.js';

// ── resolveEl (Phase 3.4/3.5) ──────────────────────────────────
// game/* ส่งแค่ location descriptor { isPlayer, idx, target } มาแทน DOM
// element ตรง ๆ — ฟังก์ชันนี้เป็นจุดเดียวที่ resolve descriptor → dom.*
// convention: isPlayer=true → ฝั่งผู้เล่น (ตรงกับ dom.playerXxx)
function resolveEl({ isPlayer, idx, target = 'slot' } = {}) {
  if (target === 'hero') return isPlayer ? dom.playerHeroEl : dom.enemyHeroEl;
  const slots = isPlayer ? dom.playerBoardSlots : dom.enemyBoardSlots;
  return slots?.[idx] ?? null;
}

// ── setupVFXHandlers ──────────────────────────────────────────
// เรียกครั้งเดียวตอน DOMContentLoaded ใน main.js
export function setupVFXHandlers() {

  // ── UI sync events (no payload) ──────────────────────────────
  // เดิม game/* เรียก flushBoard()/updateHeroHP()/... ตรง ๆ จาก ui/ui.js
  // ตอนนี้ game/* emit() เท่านั้น แล้วมารวมศูนย์ที่นี่ที่เดียว
  on(EV.FLUSH_BOARD,       () => flushBoard());
  on(EV.UPDATE_HERO_HP,    () => updateHeroHP());
  on(EV.UPDATE_GRAVE,      () => updateGrave());
  on(EV.RENDER_HAND,       () => renderHand());
  on(EV.RENDER_ENEMY_HAND, () => renderEnemyHand());
  on(EV.UPDATE_DECK_COUNT, () => updateDeckCount());

  // Phase 3: log / turn-lock sync (เดิม game/* เรียก addLog()/dom.endTurnBtn ตรง ๆ)
  on(EV.LOG,         (msg) => addLog(msg));
  on(EV.LOCK_TURN,   () => { if (dom.endTurnBtn) dom.endTurnBtn.disabled = true; });
  on(EV.UNLOCK_TURN, () => { if (dom.endTurnBtn) dom.endTurnBtn.disabled = false; });

  // การ์ดในมือ/บนบอร์ดถูกคลิก → เปิด detail modal (เดิมใช้ dynamic
  // import() ตรงใน onclick ของ board-renderer.js/hand-renderer.js เพื่อ
  // เลี่ยง circular dependency — ย้ายมา emit() แล้ว subscribe รวมศูนย์ที่นี่
  // เหมือน UI-sync event อื่นทั้งหมดแทน)
  on(EV.OPEN_DETAIL, ({ card, src, idx }) => openDetail(card, src, idx));

  // Phase A1: game-over — game/win-check.js เป็นคนตัดสิน ที่นี่แค่จัดการ
  // presentation (log/alert/stats panel) เดิมเคยฝังอยู่ใน hero-hp.js
  on(EV.GAME_OVER, ({ winner, reason }) => {
    const label = winner === 'draw'
      ? `⚔️ เสมอ! (${reason})`
      : winner === 'player'
        ? `🎉 <span class='log-player'>${OWNER.PLAYER}</span> ชนะ (${reason})`
        : `💀 <span class='log-player'>${OWNER.PLAYER}</span> แพ้ (${reason})`;
    addLog(label);
    sd(() => {
      alert(winner === 'draw' ? `เสมอ: ${reason}` : winner === 'player' ? `ชนะ: ${reason}` : `แพ้: ${reason}`);
      renderStatsUI();
      if (dom.statsContainer) dom.statsContainer.style.display = 'flex';
    }, 500);
  });

  // float: { msg, el?, loc?, type='dmg', delayMS=0 }
  // el = DOM element ตรง ๆ (จาก UI layer), loc = location descriptor (จาก game/* — Phase 3.4)
  on(EV.FLOAT, ({ msg, el, loc, type = 'dmg', delayMS = 0 }) => {
    showFloat(msg, el ?? resolveEl(loc), type, delayMS);
  });

  // impact claw: { isPlayer, idx, target, delayMS? }  — slash + flash on target slot/hero
  // Phase F2: delayMS (จาก game/combat.js) = จังหวะดาบสับถึงเป้า — engine
  // เองไม่ sleep() รอเรื่องนี้แล้ว ที่นี่เป็นคนหน่วงการแสดงผลจริงด้วย sd()
  on(EV.IMPACT, (payload) => {
    const runImpact = () => {
      const el = resolveEl(payload);
      if (!el) return;
      el.style.position = 'relative';
      const w = el.offsetWidth  || 100;
      const h = el.offsetHeight || 140;
      const flash = document.createElement('div');
      flash.className = 'slash-impact-flash';
      el.appendChild(flash); sd(() => flash.remove(), 320);
      [{ rot: -38, ox: -28, oy: -8 },
       { rot: -22, ox: -20, oy:  4 },
       { rot:  -8, ox: -14, oy: 14 }]
        .forEach((def, si) => {
          const slash = document.createElement('div');
          slash.className = 'claw-slash';
          slash.style.cssText =
            `left:${w / 2 + def.ox}px;top:${h / 2 + def.oy}px;` +
            `--slash-rot:${def.rot}deg;animation-delay:${si * 18}ms;`;
          el.appendChild(slash);
          setTimeout(() => slash.remove(), 420);
        });
      el.classList.add('hit-shake');
      sd(() => el.classList.remove('hit-shake'), 240);
    };
    if (payload?.delayMS > 0) sd(runImpact, payload.delayMS);
    else runImpact();
  });

  // hit-shake only (no claw): { el }
  on(EV.HIT_SHAKE, ({ el }) => {
    if (!el) return;
    el.classList.add('hit-shake');
    sd(() => el.classList.remove('hit-shake'), 240);
  });

  // card attack swing: { isPlayer, idx, animClass } — resolve slotEl/cardEl เอง
  on(EV.CARD_SWING, (payload) => {
    const slotEl = resolveEl(payload);
    const cardEl = slotEl?.querySelector('.card');
    if (!cardEl) return;
    slotEl.style.zIndex = '600';
    cardEl.classList.remove(payload.animClass);
    void cardEl.offsetWidth;   // reflow to restart animation
    cardEl.classList.add(payload.animClass);
  });

  // card unswing (recoil done): { isPlayer, idx, animClass, delayMS? }
  // Phase F2: delayMS (จาก game/combat.js) = impact+recoil รวมกัน — engine
  // ไม่ sleep() รอแล้ว ที่นี่เป็นคนหน่วงจริงด้วย sd()
  on(EV.CARD_UNSWING, (payload) => {
    const runUnswing = () => {
      const slotEl = resolveEl(payload);
      const cardEl = slotEl?.querySelector('.card');
      cardEl?.classList.remove(payload.animClass);
      if (slotEl) slotEl.style.zIndex = '';
    };
    if (payload?.delayMS > 0) sd(runUnswing, payload.delayMS);
    else runUnswing();
  });

  // shatter: { isPlayer, idx } — resolve slotEl เอง, ต้องเรียก shatterCard
  // (อ่าน rect/imgUrl) ก่อนเคลียร์ innerHTML เสมอ ตามลำดับด้านล่าง
  on(EV.SHATTER, (payload) => {
    const slotEl = resolveEl(payload);
    shatterCard(slotEl);
    if (slotEl) slotEl.innerHTML = '';
  });

  // screen shake: currently no-op, reserved for future generic use.
  on(EV.SCREEN_SHAKE, () => {
    // Intentionally no-op.
  });
}
