// ============================================================
//  state.js — gs (Game State) · dom (DOM Refs) · Helpers
//  ขึ้นกับ: config.js
//  หมายเหตุ: addLog() ย้ายไป ui/panels/log-panel.js แล้ว (view concern
//  ไม่ควรอยู่ใน core) — ที่นี่คง dom {} ไว้เป็น registry กลางของ DOM refs
// ============================================================
import { BOARD_SIZE } from './config.js';

// ── gs — mutable game state object ──────────────────────────
// ทุก module import { gs } แล้ว mutate ผ่าน gs.xxx = yyy ได้ตรง
export const gs = {
  playerHP:        50000,
  enemyHP:         100000,
  isGameOver:      false,
  cardUidCounter:  0,
  combatStats:     {},
  uiRuntime:       {},
  playerDeck:      [],
  enemyDeck:       [],
  hand:            [],
  enemyHand:       [],
  playerBoard:     Array(BOARD_SIZE).fill(null),
  enemyBoard:      Array(BOARD_SIZE).fill(null),
  playerGraveyard: [],
  enemyGraveyard:  [],
  boardDirty:      false,
  turnLocked:      false,   // single source of truth แทนการอ่าน dom.endTurnBtn.disabled (ดู Phase 3.3)
};

// ── dom — DOM references (assigned in main.js DOMContentLoaded) ─
export const dom = {
  handZone:         null,
  enemyHandZone:    null,
  playerBoardSlots: null,
  enemyBoardSlots:  null,
  playerHeroText:   null,
  enemyHeroText:    null,
  playerHeroEl:     null,
  enemyHeroEl:      null,
  endTurnBtn:       null,
  logContent:       null,
  logToggle:        null,
  logContainer:     null,
  statsBtn:         null,
  statsContainer:   null,
  battlefieldEl:    null,
  detailModal:      null,
  detailClose:      null,
  detailPlayBtn:    null,
  graveBtn:         null,
  graveModal:       null,
  closeModal:       null,
  graveList:        null,
};

// ── resetGameState ────────────────────────────────────────────
// เรียกใน initGame() ก่อนเริ่มเกมใหม่ทุกครั้ง
export function resetGameState() {
  gs.playerHP        = 50000;
  gs.enemyHP         = 100000;
  gs.isGameOver      = false;
  gs.cardUidCounter  = 0;
  gs.combatStats     = {};
  gs.uiRuntime       = {};
  gs.playerDeck      = [];
  gs.enemyDeck       = [];
  gs.hand            = [];
  gs.enemyHand       = [];
  gs.playerBoard     = Array(BOARD_SIZE).fill(null);
  gs.enemyBoard      = Array(BOARD_SIZE).fill(null);
  gs.playerGraveyard = [];
  gs.enemyGraveyard  = [];
  gs.boardDirty      = false;
  gs.turnLocked      = false;
}


// ── Combat stats helpers ─────────────────────────────────────
// Phase B3: engine พื้นฐาน (combat.js/game-actions.js) เขียนแค่
// dmg/taken/heal/buffAtk/buffHP/kills เท่านั้น — hpLoss, maxHpLost,
// shieldBlocked ยังไม่มี logic ไหนเขียนค่าในตอนนี้ (ไม่มีระบบชิลด์/DoT)
// นี่คือ hook ที่ตั้งใจเตรียมรอไว้ให้ระบบสกิล (stats-panel.js มี bar
// สำหรับ field พวกนี้อยู่แล้ว) — ไม่ใช่ dead code ห้ามลบตอนคลีนนิ่ง
export function createCombatStats(card = {}) {
  return {
    name: card.name || '',
    owner: card.owner || '',
    isClone: !!card.isClone,
    dmg: 0,
    taken: 0,
    heal: 0,
    buffAtk: 0,
    buffHP: 0,
    hpLoss: 0,          // reserved — skill hook (poison/DoT ฯลฯ)
    maxHpLost: 0,       // reserved — skill hook (maxHP reduction)
    shieldBlocked: 0,   // reserved — skill hook (shield/armor)
    kills: 0,
  };
}

export function ensureCombatStats(card) {
  if (!card?.uid) return null;
  const defaults = createCombatStats(card);
  if (!gs.combatStats[card.uid]) gs.combatStats[card.uid] = defaults;
  else gs.combatStats[card.uid] = { ...defaults, ...gs.combatStats[card.uid], name: card.name || gs.combatStats[card.uid].name, owner: card.owner || gs.combatStats[card.uid].owner, isClone: !!card.isClone };
  return gs.combatStats[card.uid];
}

export function addCombatStat(card, field, amount = 1) {
  const stat = ensureCombatStats(card);
  const value = Math.floor(Number(amount) || 0);
  if (!stat || !field || value <= 0) return 0;
  stat[field] = Math.floor(Number(stat[field] || 0) + value);
  return value;
}

// ── UI runtime helpers ────────────────────────────────────────
// Phase C1 (cleanup ก่อนระบบสกิล DSL): _displayHP/_displayATK เดิมฝัง
// อยู่บน Card object ตรงๆ และมีคนเขียนสองฝ่าย (game logic เขียน snapshot
// "ก่อน mutate" + renderer เขียน snapshot "หลัง animate") — ถ้ามีมากกว่า
// 1 mutation ต่อการ์ดเดียวกันก่อน flush ครั้งถัดไป (เช่น thorns/multi-hit/
// aura ที่กำลังจะมากับสกิล DSL) ค่าที่ game logic เขียนจะทับกันเอง ทำให้
// renderer เห็นแค่ delta ของ mutation ล่าสุด แอนิเมชันของ mutation ก่อนหน้า
// หายไปเงียบๆ
//
// ย้าย field พวกนี้มาไว้ที่ bucket แยก keyed ด้วย uid (ตาม pattern เดียว
// กับ combatStats ด้านบน — ไม่ใช้ WeakMap เพราะ cloneCard() ใช้
// structuredClone ซึ่งสร้าง object reference ใหม่ทุกครั้ง แต่ uid ถูก
// generate ใหม่ให้ clone อยู่แล้วโดยตั้งใจ จึงเหมาะกว่า) — renderer
// (board-renderer.js) เป็นจุดเดียวที่อ่าน/เขียน bucket นี้ ห้าม game/combat
// module แตะอีก
export function ensureUiRuntime(card) {
  if (!card?.uid) return null;
  if (!gs.uiRuntime[card.uid]) {
    gs.uiRuntime[card.uid] = { displayHP: card.hp, displayATK: card.atk };
  }
  return gs.uiRuntime[card.uid];
}

// ── Board helpers ─────────────────────────────────────────────
export const getMyBoard = p => p ? gs.playerBoard : gs.enemyBoard;
export const markDirty  = () => { gs.boardDirty = true; };