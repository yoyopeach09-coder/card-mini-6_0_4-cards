// ============================================================
//  rng.js — Seeded RNG (ตัวกลางเดียวสำหรับสุ่มทั้งหมดในเกม)
//  ไม่ขึ้นกับไฟล์ใด · ES Module
//
//  กฎ (ARCHITECTURE_RULES ข้อ 6): ห้ามใช้ Math.random() กระจายทั่วไฟล์
//  ใน gameplay logic ทุกจุด (deck build, สกิลในอนาคต: crit/dodge/
//  random target ฯลฯ) ต้องเรียกผ่าน rng.next()/pick()/shuffle()/int()
//  เท่านั้น — เพื่อให้ seed ได้ (reproducible run / รีเพลย์)
//
//  ข้อยกเว้น: Math.random() ที่ใช้แค่ "จิตเตอร์ภาพ" ล้วน ๆ ใน vfx/*
//  (เช่น float-engine.js สุ่มตำแหน่ง float text ±px) ไม่ต้องผ่าน rng
//  เพราะไม่กระทบผลเกม — แต่ถ้าเมื่อไหร่ผลลัพธ์นั้นย้อนกลับไปมีผลต่อ
//  state (dmg/target/order) ต้องย้ายมาใช้ rng ทันที
//
//  Engine: mulberry32 — เล็ก เร็ว deterministic พอสำหรับเกมนี้
//  (ไม่ใช่ crypto-secure — ไม่จำเป็นสำหรับเกมออฟไลน์คนเดียว)
// ============================================================

let _state = (Date.now() ^ 0x9e3779b9) >>> 0;

function _next32() {
  _state |= 0;
  _state = (_state + 0x6d2b79f5) | 0;
  let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (t ^ (t >>> 14)) >>> 0;
}

// ── seed ─────────────────────────────────────────────────────
// ตั้ง seed ใหม่ (เช่นก่อน buildDeck ตอน initGame ถ้าต้องการรันซ้ำได้)
// n=0 หรือไม่ส่งค่า → ใช้ 1 กัน state ตายเป็น 0
export function seed(n) {
  _state = (n >>> 0) || 1;
}

// ── next ─────────────────────────────────────────────────────
// สุ่ม float [0, 1) แทน Math.random()
export function next() {
  return _next32() / 4294967296;
}

// ── int ──────────────────────────────────────────────────────
// สุ่ม integer [min, max] ทั้งสองด้าน inclusive
export function int(min, max) {
  return min + Math.floor(next() * (max - min + 1));
}

// ── chance ───────────────────────────────────────────────────
// true ด้วยความน่าจะเป็น p (0..1) — ใช้กับ crit/dodge/proc ในอนาคต
export function chance(p) {
  return next() < p;
}

// ── pick ─────────────────────────────────────────────────────
// สุ่มหยิบ 1 element จาก array (ไม่แก้ array เดิม)
export function pick(arr) {
  if (!arr || !arr.length) return undefined;
  return arr[Math.floor(next() * arr.length)];
}

// ── shuffle ──────────────────────────────────────────────────
// คืน array ใหม่ที่สลับลำดับแล้ว (Fisher–Yates) — ไม่แก้ array เดิม
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const rng = { seed, next, int, chance, pick, shuffle };
export default rng;
