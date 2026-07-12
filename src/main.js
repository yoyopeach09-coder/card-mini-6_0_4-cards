// ============================================================
//  main.js — Boot · DOM Refs · Speed · initGame
//  ES Module entry point — <script type="module" src="main.js">
// ============================================================
import { cfg, $, cloneCard } from './core/config.js';
import { gs, dom, resetGameState, markDirty } from './core/state.js';
import { cleanupAllEffects, updateFloats } from './vfx/vfx.js';
import {
  flushBoard, renderHand, renderEnemyHand, resetSlotCache,
  resetHPDisplays, updateHeroHP, updateDeckCount,
  renderStatsUI, openDetail, createCardHTML, addLog,
} from './ui/ui.js';
import { buildDeck } from './data/deck.js';
import { rng } from './core/rng.js';
import { endTurn } from './game/turn-control.js';
import { resetAutoPlay } from './game/auto-play.js';
import { createAutoBtn } from './ui/panels/auto-play-btn.js';
import { setupVFXHandlers } from './vfx/vfx-handlers.js';
import { setupEffectHandlers } from './core/effect-handlers.js';

// ── initGame ──────────────────────────────────────────────────
export async function initGame() {
  cleanupAllEffects();
  resetSlotCache();
  resetHPDisplays();
  resetAutoPlay();   // emits EV.AUTO_PLAY_CHANGED — ui/panels/auto-play-btn.js sync ปุ่มเอง
  resetGameState();

  // Rule 2: ผูก RNG กับ run นี้โดยตรง — สุ่ม seed ใหม่ทุกครั้งที่เริ่มเกม
  // (กัน sequence สุ่มไหลต่อเนื่องข้ามรอบ) แล้วเก็บไว้ใน gs + log ไว้ให้เห็น
  // เพื่อรีเพลย์ run เดิมซ้ำได้ (พิมพ์ seed นี้ใส่ตอน debug ได้ในอนาคต)
  gs.rngSeed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  rng.seed(gs.rngSeed);

  gs.playerDeck = buildDeck(true);
  gs.enemyDeck  = buildDeck(false);
  updateHeroHP();

  // Opening hand (3 cards each)
  for (let i = 0; i < 3; i++) {
    if (gs.playerDeck.length) gs.hand.push(cloneCard(gs.playerDeck.splice(0,1)[0]));
    if (gs.enemyDeck.length)  gs.enemyHand.push(cloneCard(gs.enemyDeck.splice(0,1)[0]));
  }
  renderHand(); renderEnemyHand(); markDirty(); flushBoard(); updateDeckCount();
  addLog('⚔️ เริ่มการต่อสู้!');
  addLog(`🎲 seed: ${gs.rngSeed}`);

  if (dom.endTurnBtn) dom.endTurnBtn.disabled = false;
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Register VFX event handlers (once, at boot) ─────────────
  setupVFXHandlers();

  // ── Register Effect Queue handlers (once, at boot) ──────────
  // ผูก FX.DAMAGE/HERO_DAMAGE/HEAL/BUFF → ฟังก์ชัน apply จริงใน
  // game/combat.js · game/game-actions.js (ดู core/effect-handlers.js)
  setupEffectHandlers();

  // ── Speed controls ──────────────────────────────────────────
  const btnX05 = $('speed-x05'), btnX1 = $('speed-x1'), btnX2 = $('speed-x2');
  const setSpeed = (s) => {
    cfg.gameSpeed = s;
    document.documentElement.style.setProperty('--speed', s);
    [btnX05, btnX1, btnX2].forEach(b => {
      if (b) { b.style.background = '#444'; b.style.borderColor = '#777'; }
    });
    const active = s === 0.5 ? btnX05 : s === 1 ? btnX1 : btnX2;
    if (active) { active.style.background = '#007bff'; active.style.borderColor = '#fff'; }
  };
  if (btnX05) btnX05.onclick = () => setSpeed(0.5);
  if (btnX1)  btnX1.onclick  = () => setSpeed(1);
  if (btnX2)  btnX2.onclick  = () => setSpeed(2);
  setSpeed(2);

  // ── DOM refs ────────────────────────────────────────────────
  dom.handZone          = $('player-hand');
  dom.enemyHandZone     = $('enemy-hand');
  dom.playerBoardSlots  = document.querySelectorAll('.player-board .card-slot');
  dom.enemyBoardSlots   = document.querySelectorAll('.enemy-board .card-slot');
  dom.playerHeroText    = document.querySelector('.player-hero p');
  dom.enemyHeroText     = document.querySelector('.enemy-hero p');
  dom.playerHeroEl      = document.querySelector('.player-hero');
  dom.enemyHeroEl       = document.querySelector('.enemy-hero');
  dom.endTurnBtn        = $('end-turn-btn');
  dom.logContent        = $('battle-log-content');
  dom.logToggle         = $('battle-log-toggle');
  dom.logContainer      = $('battle-log-container');
  dom.battlefieldEl     = document.querySelector('.battlefield');

  // ── Log panel ───────────────────────────────────────────────
  if (dom.logToggle) dom.logToggle.onclick = () =>
    dom.logContainer.style.display = dom.logContainer.style.display === 'none' ? 'flex' : 'none';
  const logClose = $('close-log-btn');
  if (logClose) logClose.onclick = () => dom.logContainer.style.display = 'none';
  const logCopy  = $('copy-log-btn');
  if (logCopy) logCopy.onclick = () =>
    navigator.clipboard.writeText(dom.logContent.innerText).then(() => {
      const orig = logCopy.innerText; logCopy.innerText = '✅ Copied!';
      setTimeout(() => logCopy.innerText = orig, 2000);
    });

  // ── Stats panel ──────────────────────────────────────────────
  dom.statsBtn       = $('stats-toggle-btn');
  dom.statsContainer = $('stats-container');

  if (dom.statsBtn && dom.statsContainer) {
    dom.statsBtn.onclick = () => {
      dom.statsContainer.style.display = dom.statsContainer.style.display === 'none' ? 'flex' : 'none';
      if (dom.statsContainer.style.display === 'flex') renderStatsUI();
    };
    const closeStatsBtn = $('close-stats-btn');
    if (closeStatsBtn) closeStatsBtn.onclick = () => dom.statsContainer.style.display = 'none';
  }

  // ── Card detail modal ────────────────────────────────────────
  dom.detailModal   = $('card-detail-modal');
  dom.detailClose   = $('close-detail-modal');
  dom.detailPlayBtn = $('detail-play-btn');
  if (dom.detailClose) dom.detailClose.onclick = () =>
    dom.detailModal.style.display = 'none';

  // ── Graveyard modal ──────────────────────────────────────────
  dom.graveBtn   = $('graveyard-btn');
  dom.graveModal = $('grave-modal');
  dom.closeModal = $('close-modal');
  dom.graveList  = $('grave-list');
  if (dom.graveBtn) dom.graveBtn.onclick = () => {
    dom.graveModal.style.display = 'flex';
    dom.graveList.innerHTML = '';
    gs.playerGraveyard.forEach((c, i) => {
      const el = document.createElement('div'); el.className = 'card dead-card';
      el.innerHTML = createCardHTML(c, 'grave');
      el.onclick   = () => openDetail(c, 'graveyard', i);
      dom.graveList.appendChild(el);
    });
  };
  if (dom.closeModal) dom.closeModal.onclick = () =>
    dom.graveModal.style.display = 'none';

  // ── ESC closes all modals ────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (dom.detailModal)    dom.detailModal.style.display    = 'none';
    if (dom.graveModal)     dom.graveModal.style.display     = 'none';
    if (dom.statsContainer) dom.statsContainer.style.display = 'none';
    if (dom.logContainer)   dom.logContainer.style.display   = 'none';
  });

  // ── Buttons ──────────────────────────────────────────────────
  if (dom.endTurnBtn) dom.endTurnBtn.onclick = endTurn;
  createAutoBtn();

  // ── Start RAF float loop ─────────────────────────────────────
  requestAnimationFrame(updateFloats);

  // ── Boot game ────────────────────────────────────────────────
  initGame();
});