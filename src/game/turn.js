// ============================================================
//  turn.js — checkDeaths · shiftBoards · processTurnPhase
//  ขึ้นกับ: config.js · state.js · events.js · combat.js · deck.js
//
//  ห้าม import จาก ui/* และห้ามแตะ dom.* เลย (Phase 3.5)
//  ทุก UI/log sync และการเคลียร์ DOM ของช่องที่การ์ดตายผ่าน emit() เท่านั้น
//  initCard นำเข้าแบบ static จาก deck.js แล้ว (Phase 4.1 — ยืนยันไม่มี circular dep)
//
//  Engine พื้นฐาน: ไม่มีสกิลใดๆ — tick สถานะ/passive ทั้งหมดถูกตัดออก
// ============================================================
import { BOARD_SIZE } from '../core/config.js';
import { gs, getMyBoard, markDirty } from '../core/state.js';
import { emit, EV } from '../core/events.js';
import { executeAttack } from './combat.js';
import { sleep } from '../core/config.js';
import { initCard } from '../data/deck.js';
import { checkGameOver } from './win-check.js';

// ── checkDeaths ───────────────────────────────────────────────
export async function checkDeaths() {
  let changed = false, loop = true;

  while (loop) {
    loop = false;

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (const [board, grave] of [
        [gs.enemyBoard,  gs.enemyGraveyard],
        [gs.playerBoard, gs.playerGraveyard],
      ]) {
        if (!board[i] || board[i].hp > 0) continue;

        const deadCard  = board[i];
        const deadIsPlayer = board === gs.playerBoard;

        emit(EV.LOG, `💀 <span class="${deadIsPlayer ? 'log-player' : 'log-enemy'}">${deadCard.name}</span> ตาย`);

        // Phase 3.5: ส่งแค่ isPlayer/idx แทน slotEl ตรง ๆ — vfx-handlers.js
        // เป็นคน resolve dom element และเคลียร์ innerHTML เอง (หลัง shatterCard อ่าน rect/imgUrl แล้ว)
        emit(EV.SHATTER, { isPlayer: deadIsPlayer, idx: i });
        await sleep(200);
        grave.push(deadCard); board[i] = null; changed = true; loop = true;
      }
    }
  }

  if (changed) {
    emit(EV.UPDATE_HERO_HP); emit(EV.UPDATE_GRAVE); markDirty(); emit(EV.FLUSH_BOARD);
    checkGameOver();   // การ์ดตายอาจทำให้บอร์ดว่าง → เข้าเงื่อนไข "ไพ่หมด"
  }
}

// ── shiftBoards ───────────────────────────────────────────────
export async function shiftBoards() {
  const np = [...gs.playerBoard.filter(Boolean), ...Array(BOARD_SIZE).fill(null)].slice(0, BOARD_SIZE);
  const ne = [...gs.enemyBoard.filter(Boolean),  ...Array(BOARD_SIZE).fill(null)].slice(0, BOARD_SIZE);
  if (gs.playerBoard.some((c, i) => c !== np[i]) || gs.enemyBoard.some((c, i) => c !== ne[i])) {
    gs.playerBoard = np; gs.enemyBoard = ne;
    emit(EV.LOG, `➡️ <span style="color:#aaa">กระดานเลื่อน...</span>`);
    markDirty(); emit(EV.FLUSH_BOARD); await sleep(250);
  }
}

// ── processTurnPhase ──────────────────────────────────────────
export async function processTurnPhase(isPlayer) {
  getMyBoard(isPlayer).forEach(initCard);

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (gs.isGameOver) return;

    const myBoard = getMyBoard(isPlayer);
    const pCard   = myBoard[i];
    if (!pCard || pCard.hp <= 0) continue;

    await executeAttack(pCard, getMyBoard(!isPlayer)[i], i, isPlayer);
    await checkDeaths(); markDirty(); emit(EV.FLUSH_BOARD); await sleep(300);
  }

  if (!gs.isGameOver) await shiftBoards();
}
