// ============================================================
//  combat.js — applyDamage · executeAttack
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
import { sleep } from '../core/config.js';
import { gs, getMyBoard, markDirty, addCombatStat } from '../core/state.js';
import { emit, EV } from '../core/events.js';
import { checkGameOver } from './win-check.js';

const LOA_IMPACT_MS = 175;
const LOA_RECOIL_MS = 175;

// ── applyDamage ───────────────────────────────────────────────
// Rule pipeline กลางสำหรับ card damage: clamp + ลบ HP ตรงๆ
// หมายเหตุ (Phase 3.4): `loc` คือ location descriptor { isPlayer, idx, target }
// แทนที่ DOM element ตรง ๆ — vfx-handlers.js เป็นคน resolve เป็น el เอง
export function applyDamage(target, rawDmg, loc, isTargetPlayer, sourceType = 'normal', attackerCard = null) {
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
    emit(EV.FLOAT, { msg: `-${effective}`, loc, type: 'dmg' });
  }

  markDirty();
  return effective;
}

export function applyHeroDamage(isTargetPlayer, rawDmg, loc, attackerCard = null) {
  const dmg = Math.max(0, Math.floor(rawDmg || 0));
  if (!dmg) return 0;
  if (isTargetPlayer) gs.playerHP = Math.max(0, gs.playerHP - dmg);
  else gs.enemyHP = Math.max(0, gs.enemyHP - dmg);
  addCombatStat(attackerCard, 'dmg', dmg);
  emit(EV.FLOAT, { msg: `-${dmg}`, loc, type: 'dmg' });
  checkGameOver();
  return dmg;
}

// ── executeAttack ─────────────────────────────────────────────
// หมายเหตุ (Phase 3.4): combat.js ไม่รู้จัก dom.* อีกต่อไป — ส่งแค่
// { isPlayer, idx } ผ่าน event แล้วให้ vfx-handlers.js เป็นคน resolve
// dom element เอง (isPlayer=true → ฝั่งผู้เล่น, ตาม convention เดียวกับ
// SHATTER ใน turn.js)
export async function executeAttack(attacker, defender, idx, isPlayer) {
  if (!attacker || gs.isGameOver) return;

  const anim  = isPlayer ? 'anim-loa-attack-up' : 'anim-loa-attack-down';
  const aName = `<span class="${isPlayer ? 'log-player' : 'log-enemy'}">${attacker.name}</span>`;

  if (attacker.hp <= 0 || gs.isGameOver) return;

  emit(EV.CARD_SWING, { isPlayer, idx, animClass: anim });
  await sleep(LOA_IMPACT_MS);

  if (defender?.hp <= 0) defender = null;

  if (defender) {
    const dmg   = attacker.atk;
    const dName = `<span class="${!isPlayer ? 'log-player' : 'log-enemy'}">${defender.name}</span>`;
    const loc   = { isPlayer: !isPlayer, idx, target: 'slot' };

    emit(EV.IMPACT, loc);
    emit(EV.LOG, `⚔️ ${aName} → ${dName} (<span class="log-dmg">${dmg}</span>)`);
    applyDamage(defender, dmg, loc, !isPlayer, 'normal', attacker);

  } else {
    // No defender — hit hero directly
    const loc = { isPlayer: !isPlayer, target: 'hero' };
    emit(EV.IMPACT, loc);
    const dmg = attacker.atk;
    applyHeroDamage(!isPlayer, dmg, loc, attacker);
    emit(EV.LOG, `⚔️ ${aName} → ฮีโร่ (<span class="log-dmg">${dmg}</span>)`);
  }

  emit(EV.UPDATE_HERO_HP);
  await sleep(LOA_RECOIL_MS);
  emit(EV.CARD_UNSWING, { isPlayer, idx, animClass: anim });
  await sleep(60);
}
