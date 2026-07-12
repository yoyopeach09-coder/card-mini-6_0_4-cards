// ============================================================
//  auto-play-btn.js — Auto Play button (view layer only)
//  ขึ้นกับ: core/events.js · game/auto-play.js (setAutoPlay/getAutoPlay)
//
//  Phase F1 (cleanup): ย้ายมาจาก game/auto-play.js — document.getElementById/
//  innerHTML/classList ของปุ่ม auto-play ไม่ควรอยู่ใน src/game/* (กฎข้อ 1:
//  engine ห้ามแตะ UI) ไฟล์นี้เป็นจุดเดียวที่ผูกปุ่ม auto-play เข้ากับ DOM จริง
//  game/auto-play.js รู้แค่ "on/off" แล้ว emit(EV.AUTO_PLAY_CHANGED) มาให้
//  ที่นี่ sync สถานะปุ่มเอง — ตรงกันข้าม UI เรียก setAutoPlay() เพื่อ "ขอ"
//  เปลี่ยนสถานะเท่านั้น ไม่ได้เขียน _ap ตรง ๆ (engine ยังเป็นคนตัดสินอยู่)
// ============================================================
import { on, EV } from '../../core/events.js';
import { setAutoPlay, getAutoPlay } from '../../game/auto-play.js';

let autoBtn = null;

// ── createAutoBtn ─────────────────────────────────────────────
// เรียกครั้งเดียวตอน boot (main.js DOMContentLoaded) — ผูก click handler
// และ subscribe EV.AUTO_PLAY_CHANGED เพื่อ sync สถานะปุ่มกับ engine
export function createAutoBtn() {
  autoBtn = document.getElementById('auto-play-btn');
  if (autoBtn) {
    autoBtn.onclick = () => setAutoPlay(!getAutoPlay());
  }
  on(EV.AUTO_PLAY_CHANGED, ({ isAutoPlay }) => _renderAutoBtn(isAutoPlay));
}

function _renderAutoBtn(isAutoPlay) {
  if (!autoBtn) return;
  if (isAutoPlay) {
    autoBtn.innerHTML = '🤖 Auto <span style="color:#4cff4c;font-weight:900">ON</span>';
    autoBtn.classList.add('active');
  } else {
    autoBtn.innerHTML = '🤖 Auto <span style="color:#aaa">OFF</span>';
    autoBtn.classList.remove('active');
  }
}
