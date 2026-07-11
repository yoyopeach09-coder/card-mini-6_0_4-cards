// ============================================================
//  detail-modal.js — card detail modal + player play action
// ============================================================
import { $, OWNER } from '../../core/config.js';
import { gs, dom, markDirty } from '../../core/state.js';
import { addLog } from '../panels/log-panel.js';
import { playCardFromHand } from '../../game/game-actions.js';
import { flushBoard } from '../renderers/board-renderer.js';
import { renderHand } from '../renderers/hand-renderer.js';
import { getATKColor, getHPColor } from '../renderers/card-view.js';

export function openDetail(card, src, idx) {
  if (!card || !dom.detailModal) return;
  $('detail-card-name').innerText   = card.name;
  $('detail-card-stars').innerText  = '⭐'.repeat(card.stars || 0);
  $('detail-card-atk').innerText    = `⚔️ ${card.atk}`;
  $('detail-card-atk').style.color  = getATKColor(card);
  $('detail-card-hp').innerText     = `❤️ ${card.hp}`;
  $('detail-card-hp').style.color   = getHPColor(card);
  $('detail-card-wait').innerText   = `⏱️ ${card.waitTime}`;
  $('detail-card-image').style.backgroundImage = `url('${card.image}')`;
  $('detail-card-skills').innerHTML = `<div style="color:#aaa">ไม่มีทักษะ</div>`;

  if (src === 'playerHand' && card.waitTime <= 0 && !gs.isGameOver) {
    dom.detailPlayBtn.style.display = 'block';
    dom.detailPlayBtn.onclick = () => { playCard(idx); dom.detailModal.style.display = 'none'; };
  } else {
    dom.detailPlayBtn.style.display = 'none';
  }
  dom.detailModal.style.display = 'flex';
}

export function playCard(idx) {
  const e = gs.playerBoard.indexOf(null);
  if (e === -1) { alert('สนามเต็มแล้ว!'); return; }
  const cardName = gs.hand[idx]?.name;
  const placed = playCardFromHand(true, idx, e);
  if (!placed) return;
  addLog(`👉 <span class="log-player">${OWNER.PLAYER}</span> ลงการ์ด <span class="log-player">${cardName}</span>`);
  markDirty(); flushBoard(); renderHand();
}
