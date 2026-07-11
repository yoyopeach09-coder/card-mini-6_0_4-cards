// ============================================================
//  hand-renderer.js — player/enemy hand rendering
// ============================================================
import { gs, dom } from '../../core/state.js';
import { createCardHTML } from './card-view.js';

// ── _renderHandInto — shared renderer สำหรับมือผู้เล่น/ศัตรู ──────
// ต่างกันแค่: zone, list ของการ์ด, ctx (สำหรับ createCardHTML + openDetail source),
// และ style เฉพาะจุด (opacity เมื่อยังไม่พร้อมใช้ / margin ซ้อนของมือศัตรู)
function _renderHandInto(zone, list, ctx) {
  if (!zone) return;
  const frag = document.createDocumentFragment();
  list.forEach((c, i) => {
    const el = document.createElement('div'); el.className = 'card';
    if (ctx === 'enemyHand') el.style.margin = '0 -10px';
    el.innerHTML = createCardHTML(c, ctx);
    el.onclick = () => import('../modals/detail-modal.js').then(({ openDetail }) => openDetail(c, ctx, i));
    if (ctx === 'playerHand' && c.waitTime > 0) el.style.opacity = '.7';
    frag.appendChild(el);
  });
  zone.innerHTML = ''; zone.appendChild(frag);
}

export const renderHand      = () => _renderHandInto(dom.handZone,      gs.hand,      'playerHand');
export const renderEnemyHand = () => _renderHandInto(dom.enemyHandZone, gs.enemyHand, 'enemyHand');
