// ============================================================
//  board-renderer.js — board diff/patch renderer
// ============================================================
import { BOARD_SIZE } from '../../core/config.js';
import { gs, dom, ensureUiRuntime } from '../../core/state.js';
import { animateHP } from '../panels/hero-hp.js';
import {
  applyStatColors, cardRenderSig, createCardHTML,
  getATKColor, getHPColor,
} from './card-view.js';

const _slotCache = {
  player: Array.from({ length: BOARD_SIZE }, () => ({ uid: null, sig: '' })),
  enemy:  Array.from({ length: BOARD_SIZE }, () => ({ uid: null, sig: '' })),
};

export const flushBoard = () => { if (gs.boardDirty) { realRenderBoard(); gs.boardDirty = false; } };

export function resetSlotCache() {
  for (let i = 0; i < BOARD_SIZE; i++) {
    _slotCache.player[i] = { uid: null, sig: '' };
    _slotCache.enemy[i]  = { uid: null, sig: '' };
  }
}

function _animateCardHP(slot, card) {
  const hpEl = slot.querySelector('.card-hp-val'); if (!hpEl) return;
  if (hpEl.parentElement) hpEl.parentElement.style.color = getHPColor(card);
  const rt = ensureUiRuntime(card); if (!rt) return;
  const prev = rt.displayHP ?? card.hp;
  if (prev !== card.hp) animateHP(hpEl, prev, card.hp, '');
  rt.displayHP = card.hp;
}
function _animateCardATK(slot, card) {
  const atkEl = slot.querySelector('.card-atk-val'); if (!atkEl) return;
  if (atkEl.parentElement) atkEl.parentElement.style.color = getATKColor(card);
  const rt = ensureUiRuntime(card); if (!rt) return;
  const prev = rt.displayATK ?? card.atk;
  if (prev !== card.atk) animateHP(atkEl, prev, card.atk, '');
  rt.displayATK = card.atk;
}

function patchBoardSlot(slot, card) {
  applyStatColors(slot, card);
  const innerCard = slot.querySelector('.card .card');
  if (innerCard) {
    innerCard.className = `card${card.isUR ? ' card-ur' : ''}`;
  }
}

export function realRenderBoard() {
  const process = (slots, board, cache, borderColor, ownerKey) => {
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const card = board[i];
      if (!card) {
        if (cache[i].uid !== null) { s.innerHTML = ''; cache[i].uid = null; cache[i].sig = ''; }
        continue;
      }
      const sig = cardRenderSig(card);
      const sameCard = cache[i].uid === card.uid;
      const sameSig = cache[i].sig === sig;
      if (sameCard && sameSig) continue;
      if (!sameCard) {
        s.innerHTML = '';
        const el = document.createElement('div');
        el.className = 'card';
        el.style.cssText = `width:100%;height:100%;margin:0;border:2px solid ${borderColor};`;
        el.innerHTML = createCardHTML(card, 'board');
        el.onclick = () => import('../modals/detail-modal.js').then(({ openDetail }) => openDetail(card, ownerKey + 'Board', i));
        s.appendChild(el);
      } else {
        patchBoardSlot(s, card);
      }
      cache[i].uid = card.uid;
      cache[i].sig = sig;
      _animateCardHP(s, card);
      _animateCardATK(s, card);
    }
  };
  process(dom.playerBoardSlots, gs.playerBoard, _slotCache.player, '#4cff4c', 'player');
  process(dom.enemyBoardSlots,  gs.enemyBoard,  _slotCache.enemy,  '#ff4c4c', 'enemy');
}
