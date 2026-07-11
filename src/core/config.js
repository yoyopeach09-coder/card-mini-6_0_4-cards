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

export function cloneCard(c) {
  try   { return structuredClone(c); }
  catch { return { ...c }; }
}
