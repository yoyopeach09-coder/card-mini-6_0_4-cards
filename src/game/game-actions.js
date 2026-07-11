// ============================================================
//  game-actions.js — Shared mutation helpers for cards/boards
//  ขึ้นกับ: config.js · state.js · deck.js
//
//  เป้าหมาย: UI/AI/Skill เรียก action เดียวกัน ไม่ mutate board/hand
//  คนละทางแบบกระจัดกระจาย
// ============================================================
import { BOARD_SIZE, OWNER } from '../core/config.js';
import { gs, getMyBoard, markDirty, addCombatStat } from '../core/state.js';
import { initCard } from '../data/deck.js';

export const getHand = isPlayer => isPlayer ? gs.hand : gs.enemyHand;
export const firstEmptySlot = board => board.findIndex(c => !c);

export function getOwnerRefs(isPlayer) {
  return {
    hand: getHand(isPlayer),
    board: getMyBoard(isPlayer),
    graveyard: isPlayer ? gs.playerGraveyard : gs.enemyGraveyard,
    ownerName: isPlayer ? OWNER.PLAYER : OWNER.ENEMY,
  };
}

export function clampCardHP(card) {
  if (!card) return null;
  card.maxHP = Math.max(1, Math.floor(card.maxHP || card.hp || 1));
  card.hp = Math.max(0, Math.min(Math.floor(card.hp || 0), card.maxHP));
  return card;
}

export function applyCardHeal(card, amount, sourceCard = card, { cap = true } = {}) {
  if (!card || amount <= 0) return 0;
  const before = card.hp;
  card.hp = cap ? Math.min(card.maxHP, card.hp + amount) : card.hp + amount;
  const actual = Math.max(0, card.hp - before);
  if (actual > 0) addCombatStat(sourceCard, 'heal', actual);
  markDirty();
  return actual;
}

export function applyCardBuff(card, { atk = 0, maxHP = 0, hp = 0 } = {}, sourceCard = card) {
  if (!card) return card;
  if (atk) {
    card.baseATK = (card.baseATK || card.atk) + atk;
    card.atk = Number(card.atk) + atk;
    if (atk > 0) addCombatStat(sourceCard, 'buffAtk', atk);
  }
  if (maxHP) {
    card.maxHP = Math.max(1, (card.maxHP || card.hp || 1) + maxHP);
    card.hp = Math.min(card.maxHP, card.hp + maxHP);
    if (maxHP > 0) addCombatStat(sourceCard, 'buffHP', maxHP);
  }
  if (hp) {
    const beforeHp = card.hp;
    card.hp += hp;
    clampCardHP(card);
    if (hp > 0) addCombatStat(sourceCard, 'heal', Math.max(0, card.hp - beforeHp));
    markDirty();
    return card;
  }
  clampCardHP(card);
  markDirty();
  return card;
}

export function placeCardOnBoard(card, board, slotIndex, { init = true, summoned = false } = {}) {
  if (!card || !board || slotIndex < 0 || slotIndex >= BOARD_SIZE || board[slotIndex]) return null;
  if (summoned) { card.isSummoned = true; card.waitTime = 0; }
  board[slotIndex] = card;
  if (init) initCard(card);
  markDirty();
  return card;
}

// ── _playFromHand — shared logic สำหรับลงการ์ดจากมือ ────────────
// playCardFromHand / summonCardFromHand ต่างกันแค่ flag `summoned`
// (summoned = true → waitTime รีเป็น 0 ทันที ดู placeCardOnBoard)
function _playFromHand(isPlayer, handIndex, slotIndex, { summoned }) {
  const hand = getHand(isPlayer);
  const board = getMyBoard(isPlayer);
  const targetSlot = slotIndex ?? firstEmptySlot(board);
  if (targetSlot === -1 || targetSlot == null || !hand[handIndex]) return null;
  const [card] = hand.splice(handIndex, 1);
  return placeCardOnBoard(card, board, targetSlot, { init: true, summoned });
}

export const playCardFromHand   = (isPlayer, handIndex, slotIndex = null) =>
  _playFromHand(isPlayer, handIndex, slotIndex, { summoned: false });

export const summonCardFromHand = (isPlayer, handIndex, slotIndex = null) =>
  _playFromHand(isPlayer, handIndex, slotIndex, { summoned: true });
