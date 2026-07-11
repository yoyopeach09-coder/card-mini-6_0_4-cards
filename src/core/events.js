// ============================================================
//  events.js — Game Event Bus
//  ไม่ขึ้นกับไฟล์ใด · โหลดได้ทุกที่
//
//  แนวคิด: Logic emit event → vfx-handlers.js (และ subscriber อื่น) react
//  ทำให้ src/game/* ไม่ import จาก src/ui/* หรือ src/vfx/* เลย
//  — ทุกจุดที่ game logic ต้องการ sync UI หรือเล่น VFX ต้อง emit() เท่านั้น
//  — vfx-handlers.js เป็นจุดเดียวที่ subscribe แล้วเรียกฟังก์ชันจริงใน ui/ · vfx/
//
//  Event types:
//    float          {msg, el?, loc?, type, delayMS}        → showFloat
//                     el = DOM element ตรง ๆ (จาก ui/* เอง)
//                     loc = location descriptor (จาก game/* — ดูด้านล่าง)
//    impact         {isPlayer, idx?, target}                → spawnImpactClaw
//    hit-shake      {el}                                    → hit-shake class
//    card-swing/
//    card-unswing   {isPlayer, idx, animClass}               → attack swing animation
//    shatter        {isPlayer, idx}                          → shatterCard + เคลียร์ innerHTML ช่อง
//    screen-shake   (none)                                   → (reserved, currently no-op)
//
//    location descriptor { isPlayer, idx, target } (Phase 3.4/3.5):
//      game/* ไม่รู้จัก dom.* เลย จึงส่งพิกัดแทน element ตรง ๆ
//      convention: isPlayer=true → ฝั่งผู้เล่น (ตรงกับ dom.playerXxx)
//      target: 'slot' (ต้องมี idx) หรือ 'hero' (ไม่ต้องมี idx)
//      vfx-handlers.js (resolveEl) เป็นจุดเดียวที่แปลง descriptor → dom element จริง
//
//  UI-sync events (no payload) — เดิมเคยเรียก ui.js ตรง ๆ จาก game/*:
//    flush-board        → flushBoard()
//    update-hero-hp      → updateHeroHP()
//    update-grave        → updateGrave()
//    render-hand         → renderHand()
//    render-enemy-hand   → renderEnemyHand()
//    update-deck-count   → updateDeckCount()
//
//  Phase 3 — ตัดสาย game → dom โดยตรง:
//    log          string                   → addLog(msg)
//    lock-turn    (none)                    → disable end-turn button
//    unlock-turn  (none)                    → enable end-turn button
//    clear-slot   {slotEl}                  → เคลียร์ innerHTML ของช่อง (reserved, ยังไม่มีจุด emit ใช้จริง)
//
//  Phase A1 — win/lose check (game/win-check.js เป็นคน emit เท่านั้น):
//    game-over    {winner, reason}          → alert + addLog + เปิด stats panel
// ============================================================

const _handlers = new Map();   // eventName → Set<fn>

// ── subscribe ─────────────────────────────────────────────────
export function on(event, fn) {
  if (!_handlers.has(event)) _handlers.set(event, new Set());
  _handlers.get(event).add(fn);
  return () => off(event, fn);   // returns unsubscribe fn
}

// ── subscribe once ────────────────────────────────────────────
export function once(event, fn) {
  const wrapper = (data) => { fn(data); off(event, wrapper); };
  return on(event, wrapper);
}

// ── unsubscribe ───────────────────────────────────────────────
export function off(event, fn) {
  _handlers.get(event)?.delete(fn);
}

// ── emit ──────────────────────────────────────────────────────
export function emit(event, data) {
  _handlers.get(event)?.forEach(fn => {
    try { fn(data); }
    catch (e) { console.error(`[EventBus] ${event}:`, e); }
  });
}

// Phase B2: clearAllHandlers() ถูกลบออก — โค้ดเดิมมีฟังก์ชันนี้พร้อมคอมเมนต์
// "เรียกตอน initGame" แต่ไม่มีจุดไหนเรียกจริง และถ้าเรียกจริงจะพัง VFX
// handlers ทันที (setupVFXHandlers() subscribe ครั้งเดียวตอน boot ใน
// main.js ไม่ได้ re-subscribe ทุก initGame) ถ้าต้องการ per-game event
// scope ในอนาคต ให้ทำ subscribe/unsubscribe เฉพาะจุดผ่าน on()/off() แทน
// อย่าฟื้น clearAllHandlers() แบบ global เพราะจะเผลอลบ VFX handlers ทิ้งได้ง่าย

// ── EVENT_TYPE constants — ใช้แทน magic string ───────────────
export const EV = Object.freeze({
  FLOAT:        'float',
  IMPACT:       'impact',
  HIT_SHAKE:    'hit-shake',
  CARD_SWING:   'card-swing',
  CARD_UNSWING: 'card-unswing',
  SHATTER:      'shatter',
  SCREEN_SHAKE: 'screen-shake',

  // ── UI sync (formerly game/* importing ui/ui.js directly) — no payload ──
  FLUSH_BOARD:       'flush-board',
  UPDATE_HERO_HP:    'update-hero-hp',
  UPDATE_GRAVE:      'update-grave',
  RENDER_HAND:       'render-hand',
  RENDER_ENEMY_HAND: 'render-enemy-hand',
  UPDATE_DECK_COUNT: 'update-deck-count',

  // ── Phase 3: cut game → dom direct access ────────────────────
  LOG:          'log',            // payload: string (msg)
  LOCK_TURN:    'lock-turn',      // payload: none — disable end-turn button
  UNLOCK_TURN:  'unlock-turn',    // payload: none — enable end-turn button
  CLEAR_SLOT:   'clear-slot',     // payload: { slotEl } — เคลียร์ innerHTML ของช่อง

  // ── Phase A1: win/lose check ย้ายมาอยู่ใน game/win-check.js ──
  // payload: { winner: 'player'|'enemy'|'draw', reason: string }
  // vfx-handlers.js เป็นคน subscribe แล้วทำ alert + log + เปิด stats panel
  GAME_OVER:    'game-over',
});
