// ============================================================
//  deck.js — Card Initialisation & Deck Builder
//  ขึ้นกับ: config.js · state.js · cards.js
// ============================================================
import { cloneCard, OWNER } from '../core/config.js';
import { gs, ensureCombatStats, ensureUiRuntime } from '../core/state.js';
import { cardDB } from './cards.js';

// ── getCombatStateDefaults ────────────────────────────────────
// Single source of truth สำหรับ combat state fields ทั้งหมด
// ใช้ทั้งใน initCard() และ revival code
// หมายเหตุ (Phase C1): _displayHP/_displayATK ย้ายออกไปอยู่ gs.uiRuntime[uid]
// แล้ว (ดู state.js: ensureUiRuntime) ไม่ใช่ field บน Card object อีกต่อไป —
// ที่นี่เหลือแค่ game-state fields จริงๆ
export function getCombatStateDefaults(c) {
  return {
    isSummoned:    !!c.isSummoned,
    isDying:       false,
    _killCredited: false,
  };
}

// ── initCard ──────────────────────────────────────────────────
export function initCard(c) {
  if (!c) return;

  // printedBase* = ค่าหน้าการ์ดเดิม ใช้สำหรับ UI เทียบสีบัฟ/ดีบัฟเท่านั้น
  // แยกจาก baseATK/baseHP เพราะบางระบบอาจปรับ base เพื่อใช้คำนวณเกมเพลย์ต่อ
  c.printedBaseHP  = c.printedBaseHP  ?? c.baseHP  ?? c.hp;
  c.printedBaseATK = c.printedBaseATK ?? c.baseATK ?? c.atk;

  if (c._initialized) {
    ensureCombatStats(c);
    return;
  }
  Object.assign(c, {
    baseHP: c.hp, maxHP: c.hp, baseATK: c.atk,
    printedBaseHP: c.printedBaseHP, printedBaseATK: c.printedBaseATK,
    baseWait: c.waitTime,
    ...getCombatStateDefaults(c),
    _initialized: true,
  });
  if (!c.uid) { c.uid = ++gs.cardUidCounter; c.owner = 'Unknown'; }
  ensureCombatStats(c);
  ensureUiRuntime(c);
}

// ── buildDeck ─────────────────────────────────────────────────
function makeDeckCard(c, isPlayer) {
  const nc = cloneCard(c);
  nc.printedBaseHP  = nc.hp;
  nc.printedBaseATK = nc.atk;
  nc.uid   = ++gs.cardUidCounter;
  nc.owner = isPlayer ? OWNER.PLAYER : OWNER.ENEMY;
  return nc;
}

export function buildDeck(isPlayer) {
  const d = [];
  const counts = {};
  const target = 10;

  while (d.length < target) {
    const c = cardDB[Math.floor(Math.random() * cardDB.length)];
    counts[c.id] = counts[c.id] || 0;
    if (c.stars === 6 && counts[c.id] >= 1) continue;
    if (c.stars === 5 && counts[c.id] >= 2) continue;
    if (c.stars  <  5 && counts[c.id] >= 3) continue;
    d.push(makeDeckCard(c, isPlayer));
    counts[c.id]++;
  }

  return d;
}

// ── makeClone (Phase A2) ──────────────────────────────────────
// สำหรับสกิลในอนาคตที่ clone การ์ดบนสนาม/มือ (เช่น "Soul Rip" เดิม)
// ห้ามใช้ cloneCard() ตรง ๆ แล้ว placeCardOnBoard เลย — cloneCard เป็นแค่
// structuredClone ทำให้ uid ซ้ำกับต้นฉบับ → gs.combatStats[uid] ชนกัน
// stats ของต้นฉบับกับโคลนจะปนกัน
//
// makeClone คัดลอกสถานะปัจจุบันของ sourceCard มาทั้งหมด (รวม hp/atk ที่
// โดนบัฟ/โดนตีมาแล้ว) แล้วให้ uid ใหม่ + ผูก combatStats bucket ใหม่
// ไม่เรียก initCard() ซ้ำ เพราะ source ที่ initCard แล้วมี baseHP/maxHP/
// baseATK ที่ถูกต้องอยู่แล้ว — การเรียก initCard() ซ้ำจะ reset maxHP ให้
// เท่ากับ hp ปัจจุบัน (ผิด ถ้า source โดนตีมาก่อนโคลน)
export function makeClone(sourceCard, { owner } = {}) {
  if (!sourceCard) return null;
  const nc = cloneCard(sourceCard);
  nc.uid           = ++gs.cardUidCounter;
  nc.isClone       = true;
  nc._killCredited = false;
  nc.isDying       = false;
  if (owner) nc.owner = owner;
  ensureCombatStats(nc);   // bucket แยกจากต้นฉบับ ไม่งั้น stats ปนกัน
  ensureUiRuntime(nc);     // uid ใหม่ → bucket แสดงผลใหม่ตาม hp/atk ปัจจุบันของ clone
  return nc;
}

// ── makeToken (Phase A2) ───────────────────────────────────────
// สำหรับสกิลในอนาคตที่ summon การ์ดใหม่จาก cardDB (ไม่ใช่ clone จากสนาม/มือ
// และไม่ใช่การจั่วจากเด็ค) — ใช้ pattern เดียวกับ makeDeckCard ทุกอย่าง
// (ตั้ง printedBase*/uid/owner ให้ แต่ยังไม่เรียก initCard() ที่นี่ —
// ปล่อยให้ placeCardOnBoard({ init:true }) เป็นคนเรียกตอนวางบอร์ดจริง
// เพื่อกัน double-init เหมือนการ์ดจากมือปกติ)
export function makeToken(cardDBEntry, isPlayer) {
  return makeDeckCard(cardDBEntry, isPlayer);
}
