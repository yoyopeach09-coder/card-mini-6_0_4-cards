// ============================================================
//  effect-handlers.js — ผูก effect type (FX.*) เข้ากับฟังก์ชัน apply จริง
//  ขึ้นกับ: queue.js · game/combat.js · game/game-actions.js
//
//  เรียก setupEffectHandlers() ครั้งเดียวตอน boot (main.js) เหมือน
//  setupVFXHandlers() — จุดนี้เป็นจุดเดียวที่ผูก FX type → ฟังก์ชัน apply
//  จริง engine พื้นฐานผูกแค่ DAMAGE/HERO_DAMAGE/HEAL/BUFF ไว้ก่อน
//  (เท่าที่มีตอนนี้) ระบบสกิลในอนาคตที่ต้องการ DEBUFF/DRAW/SHIELD/
//  SUMMON/ADD_STATUS แค่มาเพิ่ม onEffect(FX.XXX, ...) ตรงนี้ที่เดียว
//  ไม่ต้องแก้ queue.js หรือจุด queueEffect() ที่เรียกใช้เลย
// ============================================================
import { onEffect, FX } from './queue.js';
import { _applyDamageInternal, _applyHeroDamageInternal } from '../game/combat.js';
import { applyCardHeal, applyCardBuff } from '../game/game-actions.js';

export function setupEffectHandlers() {
  // payload ตรงกับ argument list เดิมของฟังก์ชัน apply ที่มีอยู่แล้ว —
  // handler แค่ destructure แล้วส่งต่อ ไม่มี logic ใหม่ตรงนี้ (ของเดิม
  // ยังอยู่ที่ combat.js/game-actions.js เหมือนเดิมทุกอย่าง)
  onEffect(FX.DAMAGE, ({ target, rawDmg, loc, isTargetPlayer, sourceType, attackerCard, floatDelayMs }) =>
    _applyDamageInternal(target, rawDmg, loc, isTargetPlayer, sourceType, attackerCard, floatDelayMs));

  onEffect(FX.HERO_DAMAGE, ({ isTargetPlayer, rawDmg, loc, attackerCard, floatDelayMs }) =>
    _applyHeroDamageInternal(isTargetPlayer, rawDmg, loc, attackerCard, floatDelayMs));

  onEffect(FX.HEAL, ({ card, amount, sourceCard, opts }) =>
    applyCardHeal(card, amount, sourceCard, opts));

  onEffect(FX.BUFF, ({ card, delta, sourceCard }) =>
    applyCardBuff(card, delta, sourceCard));

  // FX.DEBUFF / FX.DRAW / FX.SHIELD / FX.SUMMON / FX.ADD_STATUS —
  // ยังไม่มี handler เพราะยังไม่มี logic ฝั่ง engine ให้ผูก (ไม่มีระบบ
  // ชิลด์/status ในตอนนี้) queueEffect() ฝั่งนี้จะ warn เฉย ๆ ถ้าถูกเรียก
  // ก่อนมี handler จริง — ตั้งใจปล่อยว่างไว้รอสกิล ไม่ใช่ลืมทำ
}
