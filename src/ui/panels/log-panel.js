// ============================================================
//  log-panel.js — Battle Log rendering
//  ขึ้นกับ: core/state.js (dom refs เท่านั้น)
//
//  ย้ายมาจาก core/state.js: การ render log entry (สร้าง DOM element,
//  จัดรูปแบบเวลา, ตัด log เก่าทิ้ง) เป็น view concern ไม่ควรอยู่ใน core
//
//  Phase B2: อัปเดตคอมเมนต์ — Phase 3.2 (game/* emit(EV.LOG,...) แทนการ
//  import addLog ตรงๆ) เสร็จสมบูรณ์แล้ว src/game/* ไม่มีที่ไหน import
//  addLog จากไฟล์นี้โดยตรงอีกต่อไป จุดเดียวที่ import ตรงๆ คือ
//  vfx-handlers.js (subscribe EV.LOG) และ ui/modals/detail-modal.js
//  (เป็น ui เรียก ui ด้วยกันเอง ไม่ผิดกติกา)
// ============================================================
import { dom } from '../../core/state.js';

const LOG_MAX = 150;

export function addLog(msg) {
  if (!dom.logContent) return;
  const e = document.createElement('div');
  e.className = 'log-entry';
  e.innerHTML = `<span class="log-time">[${new Date().toLocaleTimeString('th-TH', { hour12: false })}]</span> ${msg}`;
  dom.logContent.appendChild(e);
  if (dom.logContent.children.length > LOG_MAX) dom.logContent.removeChild(dom.logContent.firstChild);
  dom.logContent.scrollTop = dom.logContent.scrollHeight;
}
