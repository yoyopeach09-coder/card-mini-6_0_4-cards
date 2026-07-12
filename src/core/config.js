// ============================================================
//  config.js — Constants · Pure Helpers
//  ไม่ขึ้นกับไฟล์ใด · ES Module
// ============================================================

export const BOARD_SIZE = 7;
export const HAND_LIMIT  = 7;

// OWNER — ชื่อเจ้าของการ์ด/บอร์ด ใช้ร่วมกันทุกเลเยอร์ (data/game/ui)
// ห้าม hardcode string 'พีช'/'บอส' ซ้ำที่อื่น ให้ import จากตรงนี้เท่านั้น
export const OWNER = Object.freeze({ PLAYER: 'พีช', ENEMY: 'บอส' });

// cfg.gameSpeed — mutate ผ่าน object ได้จากทุก module
export const cfg = { gameSpeed: 2 };

export const sleep = ms       => new Promise(r => setTimeout(r, ms / cfg.gameSpeed));
export const sd    = (fn, ms) => setTimeout(fn, ms / cfg.gameSpeed);
export const $     = id       => document.getElementById(id);

// ── Attack swing pacing (Phase F2 cleanup) ──────────────────────
// ตัวเลขจังหวะภาพล้วน ๆ (ms) — ไม่ใช่ผลตัดสินเกม เดิมอยู่เป็น sleep() ฝัง
// อยู่กลาง game/combat.js เอง (ผูก engine เข้ากับจังหวะ animation ตรง ๆ
// ขัดกฎข้อ 5) ย้ายมาไว้ที่นี่เพราะเป็นจุดเดียวที่ทั้ง game/combat.js (ส่ง
// ออกไปเป็นแค่ delayMS hint ผ่าน event ไม่ sleep() รอเอง) และ
// vfx/vfx-handlers.js (เป็นคนหน่วงจริงด้วย sd()) import ร่วมกันได้โดยไม่
// ผิดกฎ (engine ห้าม import จาก vfx/*, vfx ห้ามเป็นคนตัดสิน timing ของ
// engine) — game/turn.js ก็ใช้ค่านี้คิดจังหวะพักระหว่างการ์ดตีแต่ละตัวด้วย
export const ATTACK_ANIM_MS = Object.freeze({
  IMPACT: 175,   // จังหวะดาบสับถึงเป้า (สอดคล้อง CSS anim-loa-attack-*)
  RECOIL: 175,   // ค้างท่าก่อนชักดาบกลับ
  SETTLE: 60,    // บัฟเฟอร์ก่อนการ์ดถัดไปเริ่มตี (เดิม sleep(60) ท้าย executeAttack)
});

export function cloneCard(c) {
  try   { return structuredClone(c); }
  catch { return { ...c }; }
}
