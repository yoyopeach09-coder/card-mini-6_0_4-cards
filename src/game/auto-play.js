// ============================================================
//  auto-play.js — Auto Play Mode (Player AI)
//  ขึ้นกับ: config.js · state.js · events.js · game-actions.js · turn-control.js
//  ห้าม import จาก ui/* และห้ามแตะ dom.* เลย (Phase 3.2/3.3) —
//  ใช้ gs.turnLocked แทน dom.endTurnBtn.disabled, log ผ่าน emit(EV.LOG, ...)
//  endTurn นำเข้าแบบ static จาก turn-control.js แล้ว (Phase 4.1 — ยืนยันไม่มี circular dep)
// ============================================================
import { sleep } from '../core/config.js';
import { gs, markDirty } from '../core/state.js';
import { emit, EV } from '../core/events.js';
import { playCardFromHand } from './game-actions.js';
import { endTurn } from './turn-control.js';

// ── internal state (not export let — ES exports are read-only from outside) ──
const _ap = { isAutoPlay: false, autoLoopLock: false };

export const getAutoPlay  = ()  => _ap.isAutoPlay;
export function resetAutoPlay() {
  _ap.isAutoPlay   = false;
  _ap.autoLoopLock = false;
}

const AUTO_THINK_MS = 600;

// ── autoPlayCards ─────────────────────────────────────────────
export async function autoPlayCards() {
  const emptySlots = () => gs.playerBoard.reduce((a, c, i) => (!c ? [...a, i] : a), []);

  const ready = [...gs.hand]
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.waitTime <= 0)
    .sort((a, b) => (b.c.stars - a.c.stars) || (b.c.atk - a.c.atk));

  if (!ready.length) return;

  for (const { c } of ready) {
    const slots = emptySlots();
    if (!slots.length) break;
    const cur = gs.hand.indexOf(c);
    if (cur === -1) continue;
    const slot = slots[0];
    emit(EV.LOG, `🤖 <span class="log-player">AUTO</span> ลงการ์ด <span class="log-player">${c.name}</span> (${c.stars}⭐ ATK:${c.atk})`);
    playCardFromHand(true, cur, slot);
    markDirty(); emit(EV.FLUSH_BOARD); emit(EV.RENDER_HAND);
    await sleep(AUTO_THINK_MS * 0.5);
  }
  markDirty(); emit(EV.FLUSH_BOARD);
}

// ── autoPlayLoop ──────────────────────────────────────────────
async function autoPlayLoop() {
  if (_ap.autoLoopLock) return;
  _ap.autoLoopLock = true;

  while (_ap.isAutoPlay && !gs.isGameOver) {
    if (gs.turnLocked) { await sleep(150); continue; }
    await sleep(AUTO_THINK_MS);
    if (!_ap.isAutoPlay || gs.isGameOver) break;
    await autoPlayCards();
    if (!_ap.isAutoPlay || gs.isGameOver) break;
    await sleep(AUTO_THINK_MS * 0.5);
    if (!_ap.isAutoPlay || gs.isGameOver) break;
    await endTurn();
  }

  _ap.autoLoopLock = false;
  if (gs.isGameOver) setAutoPlay(false);
}

// ── setAutoPlay ───────────────────────────────────────────────
export function setAutoPlay(on) {
  _ap.isAutoPlay = on;
  _updateAutoBtn();
  if (on && !_ap.autoLoopLock) autoPlayLoop();
}

// ── UI ────────────────────────────────────────────────────────
let autoBtn = null;

export function createAutoBtn() {
  autoBtn = document.getElementById('auto-play-btn');
  if (autoBtn) {
    autoBtn.onclick = () => setAutoPlay(!_ap.isAutoPlay);
  }
}

function _updateAutoBtn() {
  if (!autoBtn) return;
  if (_ap.isAutoPlay) {
    autoBtn.innerHTML = '🤖 Auto <span style="color:#4cff4c;font-weight:900">ON</span>';
    autoBtn.classList.add('active');
  } else {
    autoBtn.innerHTML = '🤖 Auto <span style="color:#aaa">OFF</span>';
    autoBtn.classList.remove('active');
  }
}

// exported alias so main.js can call it after reset
export const updateAutoBtn = _updateAutoBtn;
