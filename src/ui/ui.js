// ============================================================
//  ui.js — facade for split UI modules
// ============================================================
export { createCardHTML } from './renderers/card-view.js';
export { flushBoard, resetSlotCache, realRenderBoard } from './renderers/board-renderer.js';
export { renderHand, renderEnemyHand } from './renderers/hand-renderer.js';
export { updateDeckCount, updateGrave } from './panels/misc-panels.js';
export { resetHPDisplays, animateHP, updateHeroHP } from './panels/hero-hp.js';
export { renderStatsUI } from './panels/stats-panel.js';
export { openDetail, playCard } from './modals/detail-modal.js';
export { addLog } from './panels/log-panel.js';
