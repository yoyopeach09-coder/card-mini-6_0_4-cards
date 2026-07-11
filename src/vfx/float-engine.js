// ============================================================
//  float-engine.js — floating combat text pool + RAF loop
// ============================================================
import { cfg } from '../core/config.js';
import { dom } from '../core/state.js';
import { getEffectRect } from './dom-utils.js';

const FLOAT_CFG = {
  dmg:   { color: '#ff3333', size: '2.2rem' },
  heal:  { color: '#33ff33', size: '2.2rem' },
  skill: { color: '#ffcc00', size: '1.6rem' },
  drain: { color: '#ffd700', size: '2.2rem' },
};
const FLOAT_DURATION = 900;
const FLOAT_POOL_SIZE = 40;
const MAX_SPAWN_PER_FRAME = 8;

const floatPool = [];
const floatQueue = [];
const activeFloats = [];

let battlefieldRect = null;
let rectCache = new Map();
let lastFloatTime = new WeakMap();
let globalFloatOrder = 0;
let _lastTime = performance.now();

for (let i = 0; i < FLOAT_POOL_SIZE; i++) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.style.cssText = 'position:absolute;pointer-events:none;font-weight:bold;' +
    'text-shadow:2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,' +
    '4px 4px 10px rgba(0,0,0,0.8);will-change:transform,opacity;z-index:9999;';
  floatPool.push(el);
}

export function showFloat(msg, cardEl, type = 'dmg', delayMS = 0) {
  if (!cardEl) return;
  const data = { msg, type, cardEl, order: globalFloatOrder++ };
  if (delayMS > 0) setTimeout(() => floatQueue.push(data), delayMS / cfg.gameSpeed);
  else floatQueue.push(data);
}

function getCardRect(el) {
  if (rectCache.has(el)) return rectCache.get(el);
  const r = el.getBoundingClientRect();
  rectCache.set(el, r);
  return r;
}

function acquireFloat() {
  if (floatPool.length) return floatPool.pop();
  if (activeFloats.length) {
    const oldest = activeFloats.shift();
    releaseFloat(oldest.el);
    return floatPool.pop();
  }
  return null;
}
function releaseFloat(el) { el.remove(); floatPool.push(el); }

function spawnFloat(data) {
  const el = acquireFloat(); if (!el || !battlefieldRect) return;
  const cfg2 = FLOAT_CFG[data.type] ?? FLOAT_CFG.dmg;
  const rect = getCardRect(data.cardEl);
  const startX = rect.left - battlefieldRect.left + rect.width / 2 + (Math.random() - 0.5) * 22;
  const startY = rect.top - battlefieldRect.top + rect.height / 2 - 10;
  el.textContent = data.msg;
  el.style.color = cfg2.color;
  el.style.fontSize = cfg2.size;
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';
  el.style.opacity = '1';
  el.style.transform = 'translate(0,0)';
  dom.battlefieldEl.appendChild(el);
  activeFloats.push({ el, time: 0 });
}

export function updateFloats(now) {
  const dt = now - _lastTime; _lastTime = now;
  const duration = FLOAT_DURATION / cfg.gameSpeed;
  battlefieldRect = getEffectRect(dom.battlefieldEl);
  rectCache.clear();

  let budget = MAX_SPAWN_PER_FRAME;
  const staggerTime = 500 / cfg.gameSpeed;
  if (floatQueue.length > 1) floatQueue.sort((a, b) => b.order - a.order);

  let qIdx = 0;
  while (qIdx < floatQueue.length && budget > 0) {
    const itemIdx = floatQueue.length - 1 - qIdx;
    const data = floatQueue[itemIdx];
    const last = lastFloatTime.get(data.cardEl) || 0;
    if (now - last > staggerTime) {
      lastFloatTime.set(data.cardEl, now);
      spawnFloat(data); floatQueue.splice(itemIdx, 1); budget--;
    } else { qIdx++; }
  }

  for (let i = activeFloats.length - 1; i >= 0; i--) {
    const f = activeFloats[i]; f.time += dt;
    const t = Math.min(f.time / duration, 1);
    if (t >= 1) { releaseFloat(f.el); activeFloats.splice(i, 1); continue; }
    f.el.style.transform = `translate(${Math.sin(t * Math.PI) * 8}px,${-65 * t}px)`;
    f.el.style.opacity = String(1 - t * t);
  }
  requestAnimationFrame(updateFloats);
}
