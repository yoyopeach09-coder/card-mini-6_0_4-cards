// ============================================================
//  win-check.js — Single source of truth สำหรับเช็คจบเกม
//  ขึ้นกับ: core/state.js · core/events.js
//
//  Phase A1: ก่อนหน้านี้ตรรกะแพ้/ชนะฝังอยู่ใน ui/panels/hero-hp.js
//  (updateHeroHP) — ทำงานได้แค่ "โดยบังเอิญ" เพราะ event นั้นถูก emit
//  หลังทุกจุดที่ตอนนี้มีการเปลี่ยน HP hero เท่านั้น ถ้าอนาคตมีสกิลที่
//  ทำให้ hero ตายทางอื่นแล้วลืม emit UPDATE_HERO_HP เกมจะไม่รู้ว่าจบแล้ว
//
//  ตอนนี้: checkGameOver() เป็นจุดเดียวที่ตัดสินและ set gs.isGameOver
//  เรียกได้จากทุกที่ที่ HP/board/deck เปลี่ยน (combat.js, turn.js, ...)
//  ไม่ต้องรอ UI sync — แล้ว emit(EV.GAME_OVER) ให้ vfx-handlers.js
//  ไปจัดการ alert/log/stats panel ต่อ (เป็น view concern แยกออกไป)
// ============================================================
import { gs } from '../core/state.js';
import { emit, EV } from '../core/events.js';

// ── checkGameOver ─────────────────────────────────────────────
// return true ถ้าเพิ่งจบเกม (idempotent — เรียกซ้ำได้ปลอดภัย ไม่ทำอะไรถ้า
// gs.isGameOver = true ไปแล้ว)
export function checkGameOver() {
  if (gs.isGameOver) return false;

  const pOut = !gs.playerDeck.length && !gs.hand.length      && gs.playerBoard.every(c => !c);
  const eOut = !gs.enemyDeck.length  && !gs.enemyHand.length  && gs.enemyBoard.every(c => !c);

  const playerDead = gs.playerHP <= 0 || pOut;
  const enemyDead  = gs.enemyHP  <= 0 || eOut;

  if (!playerDead && !enemyDead) return false;

  gs.isGameOver = true;

  // เช็ค mutual KO ก่อนเสมอ — เดิมใช้ else-if ทำให้เคส HP ทั้งคู่ ≤0
  // พร้อมกันรายงานแค่ฝั่งเดียว
  let winner, reason;
  if (playerDead && enemyDead) {
    winner = 'draw';
    reason = (pOut && eOut) ? 'ไพ่หมดทั้งคู่!' : 'HP หมดพร้อมกัน!';
  } else if (playerDead) {
    winner = 'enemy';
    reason = pOut ? 'ไพ่หมด!' : 'HP หมด!';
  } else {
    winner = 'player';
    reason = eOut ? 'ไพ่หมด!' : 'HP หมด!';
  }

  emit(EV.GAME_OVER, { winner, reason });
  return true;
}
