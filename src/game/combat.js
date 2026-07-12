// ============================================================
//  combat.js — _applyDamageInternal · executeAttack
//  ขึ้นกับ: config.js · state.js · events.js
//
//  ห้าม import จาก ui/* หรือ vfx/* และห้ามแตะ dom.* เลย (Phase 3.4)
//  ทุก VFX/UI/log sync ผ่าน emit() เท่านั้น — ตำแหน่งเป้าหมายส่งเป็น
//  location descriptor { isPlayer, idx, target } แทน DOM element ตรง ๆ
//  vfx-handlers.js เป็นจุดเดียวที่รับ event แล้ว resolve dom + เรียก ui.js / vfx.js จริง
//
//  Engine พื้นฐาน: ไม่มีสกิลใดๆ — ตีเรียงตาตามลำดับ, ลบ HP ตรงๆ,
//  ไม่มี crit/dodge/armor/status ใดๆ
// ============================================================
import { ATTACK_ANIM_MS } from '../core/config.js';
import { gs, getMyBoard, markDirty, addCombatStat } from '../core/state.js';
import { emit, EV } from '../core/events.js';
import { checkGameOver } from './win-check.js';
import { queueEffect, resolveEffectQueue, FX, PRIORITY } from '../core/queue.js';

// ── _applyDamageInternal ─────────────────────────────────────
// Rule pipeline กลางสำหรับ card damage: clamp + ลบ HP ตรงๆ
// หมายเหตุ (Phase 3.4): `loc` คือ location descriptor { isPlayer, idx, target }
// แทนที่ DOM element ตรง ๆ — vfx-handlers.js เป็นคน resolve เป็น el เอง
//
// หมายเหตุ (Phase E1 — Effect Queue): ฟังก์ชันนี้ยังคงเป็น "ตัว apply จริง"
// เหมือนเดิมทุกอย่าง แต่ตอนนี้ถูกเรียกผ่าน FX.DAMAGE handler (ผูกไว้ใน
// core/effect-handlers.js) แทนที่ executeAttack() ด้านล่างจะเรียกตรง ๆ —
// เพื่อให้ effect หลายตัว (รวมสกิลในอนาคต) resolve เรียงตาม priority/id
// ผ่าน resolveEffectQueue() จุดเดียว ไม่ใช่ตามลำดับที่โค้ดเรียกสุ่ม ๆ
//
// ⚠️ ห้ามเรียกตรงจาก game logic/สกิลใหม่เด็ดขาด — ชื่อขึ้นต้น _ เป็น
// สัญญาณ "internal — ห้าม import ตรง" (ยัง export เพราะ effect-handlers.js
// ต้อง import มาผูกกับ FX.DAMAGE เป็นจุดเดียวที่อนุญาต) ก่อนหน้านี้ใช้ชื่อ
// applyDamage แบบไม่มีสัญญาณเตือน ทำให้เป็นช่องให้ game logic ใหม่เผลอ
// import ตรงได้ง่าย ๆ โดยไม่มี error ใด ๆ เตือน ซึ่งจะข้าม priority/queue
// ทำให้ resolution order ตายตัว (Rule 7-8) พังแบบเงียบ ๆ — ถ้าต้องการ
// apply damage จาก game logic ให้ queueEffect(FX.DAMAGE, ...) เท่านั้น
export function _applyDamageInternal(target, rawDmg, loc, isTargetPlayer, sourceType = 'normal', attackerCard = null, floatDelayMs = 0) {
  if (!target || isNaN(rawDmg)) return 0;
  const dmg = Math.max(0, Math.floor(rawDmg));

  const beforeHP = target.hp;
  const effective = Math.max(0, Math.min(dmg, target.hp));
  target.hp -= effective;

  addCombatStat(attackerCard, 'dmg', effective);
  addCombatStat(target, 'taken', effective);
  if (beforeHP > 0 && target.hp <= 0 && attackerCard && attackerCard !== target && !target._killCredited) {
    target._killCredited = true;
    addCombatStat(attackerCard, 'kills', 1);
  }

  if (effective > 0) {
    emit(EV.FLOAT, { msg: `-${effective}`, loc, type: 'dmg', delayMS: floatDelayMs });
  }

  markDirty();
  return effective;
}

// ⚠️ ห้ามเรียกตรงจาก game logic/สกิลใหม่เด็ดขาด — เหตุผลเดียวกับ
// _applyDamageInternal ด้านบน ใช้ queueEffect(FX.HERO_DAMAGE, ...) แทน
export function _applyHeroDamageInternal(isTargetPlayer, rawDmg, loc, attackerCard = null, floatDelayMs = 0) {
  const dmg = Math.max(0, Math.floor(rawDmg || 0));
  if (!dmg) return 0;
  if (isTargetPlayer) gs.playerHP = Math.max(0, gs.playerHP - dmg);
  else gs.enemyHP = Math.max(0, gs.enemyHP - dmg);
  addCombatStat(attackerCard, 'dmg', dmg);
  emit(EV.FLOAT, { msg: `-${dmg}`, loc, type: 'dmg', delayMS: floatDelayMs });
  checkGameOver();
  return dmg;
}

// ── executeAttack ─────────────────────────────────────────────
// หมายเหตุ (Phase 3.4): combat.js ไม่รู้จัก dom.* อีกต่อไป — ส่งแค่
// { isPlayer, idx } ผ่าน event แล้วให้ vfx-handlers.js เป็นคน resolve
// dom element เอง (isPlayer=true → ฝั่งผู้เล่น, ตาม convention เดียวกับ
// SHATTER ใน turn.js)
//
// หมายเหตุ (Phase F2 — เอา sleep() ออกจาก engine): เดิมฟังก์ชันนี้ await
// sleep(LOA_IMPACT_MS)/sleep(LOA_RECOIL_MS)/sleep(60) คั่นกลาง ทำให้ engine
// เอง "รอ animation" ตรง ๆ (ขัดกฎข้อ 5: engine คำนวณจบก่อนเสมอ, animation
// ตามหลัง) ตอนนี้ตัดสินผลดาเมจ "จบทันที" ไม่รอใคร ส่วนจังหวะภาพ (สับ →
// กระทบ → ค้างท่า → ชักกลับ) ส่งไปแค่เป็น delayMS hint ผ่าน event ให้
// vfx-handlers.js เป็นคนหน่วงแสดงผลเองทั้งหมดด้วย sd() — ถ้า animation
// พัง/ถูกปิด ผลเกม (HP/kills/log) ยังถูกต้องและเกิดขึ้นจริงอยู่ดี
export async function executeAttack(attacker, defender, idx, isPlayer) {
  if (!attacker || gs.isGameOver) return;
  if (attacker.hp <= 0 || gs.isGameOver) return;

  const anim  = isPlayer ? 'anim-loa-attack-up' : 'anim-loa-attack-down';
  const aName = `<span class="${isPlayer ? 'log-player' : 'log-enemy'}">${attacker.name}</span>`;

  if (defender?.hp <= 0) defender = null;

  // เริ่ม swing ทันที (delayMS ไม่ใส่ = แสดงทันที) — engine ไม่ block รอ
  // จังหวะนี้อีกต่อไป
  emit(EV.CARD_SWING, { isPlayer, idx, animClass: anim });

  if (defender) {
    const dmg   = attacker.atk;
    const dName = `<span class="${!isPlayer ? 'log-player' : 'log-enemy'}">${defender.name}</span>`;
    const loc   = { isPlayer: !isPlayer, idx, target: 'slot' };

    emit(EV.IMPACT, { ...loc, delayMS: ATTACK_ANIM_MS.IMPACT });
    emit(EV.LOG, `⚔️ ${aName} → ${dName} (<span class="log-dmg">${dmg}</span>)`);
    // Phase E1: push เข้า effect queue แทนเรียก _applyDamageInternal() ตรง ๆ —
    // ถ้าอนาคตมีสกิลอื่น queueEffect() เพิ่มเข้ามาพร้อมกัน (เช่น thorns
    // สวนกลับ, on-hit trigger) ทุกอย่างจะ resolve เรียงตาม priority/id
    // เดียวกันตรงนี้ ไม่ใช่ต่างคนต่างเรียกฟังก์ชันซ้อนกันเอง
    queueEffect(FX.DAMAGE, { target: defender, rawDmg: dmg, loc, isTargetPlayer: !isPlayer, sourceType: 'normal', attackerCard: attacker, floatDelayMs: ATTACK_ANIM_MS.IMPACT }, PRIORITY.NORMAL);
    await resolveEffectQueue();

  } else {
    // No defender — hit hero directly
    const loc = { isPlayer: !isPlayer, target: 'hero' };
    emit(EV.IMPACT, { ...loc, delayMS: ATTACK_ANIM_MS.IMPACT });
    const dmg = attacker.atk;
    queueEffect(FX.HERO_DAMAGE, { isTargetPlayer: !isPlayer, rawDmg: dmg, loc, attackerCard: attacker, floatDelayMs: ATTACK_ANIM_MS.IMPACT }, PRIORITY.NORMAL);
    await resolveEffectQueue();
    emit(EV.LOG, `⚔️ ${aName} → ฮีโร่ (<span class="log-dmg">${dmg}</span>)`);
  }

  emit(EV.UPDATE_HERO_HP);
  emit(EV.CARD_UNSWING, { isPlayer, idx, animClass: anim, delayMS: ATTACK_ANIM_MS.IMPACT + ATTACK_ANIM_MS.RECOIL });
}
