// ============================================================
//  misc-panels.js — deck/grave counters
// ============================================================
import { $ } from '../../core/config.js';
import { gs } from '../../core/state.js';

export function updateDeckCount() {
  const p = $('player-deck-count'), e = $('enemy-deck-count');
  if (p) p.innerText = `🎴 กองการ์ดเรา: ${gs.playerDeck.length}`;
  if (e) e.innerText = `🎴 กองการ์ดศัตรู: ${gs.enemyDeck.length}`;
}

export function updateGrave() {
  const g = $('grave-count');
  if (g) g.innerText = gs.playerGraveyard.length;
}
