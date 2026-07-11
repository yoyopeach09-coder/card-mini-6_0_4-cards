// ============================================================
//  turn-control.js — endTurn (Player + Enemy turn orchestration)
//  ขึ้นกับ: config.js · state.js · events.js · game-actions.js · turn.js
//  ห้าม import จาก ui/* และห้ามแตะ dom.* เลย (Phase 3.3) —
//  ใช้ gs.turnLocked เป็น single source of truth แทน dom.endTurnBtn.disabled
//  ทุก UI/log sync ผ่าน emit() เท่านั้น
// ============================================================
import { sleep, cloneCard, HAND_LIMIT, OWNER } from '../core/config.js';
import { gs, markDirty } from '../core/state.js';
import { emit, EV } from '../core/events.js';
import { playCardFromHand } from './game-actions.js';
import { processTurnPhase } from './turn.js';

export async function endTurn() {
  if (gs.isGameOver || gs.turnLocked) return;
  gs.turnLocked = true;  emit(EV.LOCK_TURN);

  // ── Player turn ───────────────────────────────────────────
  emit(EV.LOG, `--- เทิร์น <span class='log-player'>${OWNER.PLAYER}</span> ---`);
  await processTurnPhase(true);
  if (gs.isGameOver) return;

  // ── Enemy turn ────────────────────────────────────────────
  emit(EV.LOG, `--- เทิร์น <span class='log-enemy'>${OWNER.ENEMY}</span> ---`);

  gs.enemyHand.forEach(c => { if (c.waitTime > 0) c.waitTime--; });
  // Phase A2 audit: cloneCard() ตรงนี้ปลอดภัย — splice() เอาต้นฉบับออกจาก
  // deck ทันที เหลือแค่โคลนอยู่ในมือ ไม่มี uid ซ้ำอยู่พร้อมกัน 2 ที่
  // (ต่างจาก makeClone() ใน deck.js ที่ตั้งใจให้ต้นฉบับ+โคลนอยู่ร่วมกัน)
  if (gs.enemyDeck.length && gs.enemyHand.length < HAND_LIMIT)
    gs.enemyHand.push(cloneCard(gs.enemyDeck.splice(0, 1)[0]));
  emit(EV.RENDER_ENEMY_HAND); emit(EV.UPDATE_DECK_COUNT);

  const toPlay = gs.enemyHand.filter(c => c.waitTime <= 0);
  for (const c of toPlay) {
    const e = gs.enemyBoard.indexOf(null);
    if (e !== -1) {
      playCardFromHand(false, gs.enemyHand.indexOf(c), e);
      emit(EV.LOG, `👉 <span class="log-enemy">${OWNER.ENEMY}</span> ลงการ์ด ${c.name}`);
      markDirty(); emit(EV.FLUSH_BOARD); emit(EV.RENDER_ENEMY_HAND);
    }
  }
  markDirty(); emit(EV.FLUSH_BOARD); emit(EV.RENDER_ENEMY_HAND); await sleep(600);

  await processTurnPhase(false);
  if (gs.isGameOver) return;

  // ── Tick player hand + draw ────────────────────────────────
  gs.hand.forEach(c => { if (c.waitTime > 0) c.waitTime--; });
  if (gs.playerDeck.length && gs.hand.length < HAND_LIMIT)
    gs.hand.push(cloneCard(gs.playerDeck.splice(0, 1)[0]));
  emit(EV.RENDER_HAND); emit(EV.UPDATE_DECK_COUNT);

  gs.turnLocked = false; emit(EV.UNLOCK_TURN);
}
