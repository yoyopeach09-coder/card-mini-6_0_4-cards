// ============================================================
//  queue.js — Effect Queue กลาง (Rule 7 + Rule 8)
//  ขึ้นกับ: ไม่มี (pure, ไม่แตะ gs/dom/event-bus โดยตรง)
//
//  ปัญหาที่กฎ ARCHITECTURE_RULES เตือนไว้:
//    - ข้อ 7: หลายสกิล/หลาย effect เกิดพร้อมกัน ต้อง resolve ตามลำดับ
//      ตายตัว (priority แล้วตามด้วย stable id) ไม่ใช่ตามลำดับที่ใคร
//      เรียกก่อน-หลังแบบสุ่ม
//    - ข้อ 8: ห้าม resolve สกิลแบบเรียกซ้อนลึกมั่ว ๆ (handler เรียก
//      handler เรียก handler ...) เพราะกัน stack ระเบิดยาก ให้ push
//      effect เข้า queue ก่อน แล้วมี loop กลางดึงออกมา resolve ทีละตัว
//
//  วิธีใช้:
//    1. ที่จุด setup (ครั้งเดียวตอน boot) — register handler ต่อ effect
//       type ด้วย onEffect(FX.DAMAGE, handlerFn)
//    2. ที่จุด game logic / สกิลในอนาคต — queueEffect(FX.DAMAGE, payload)
//       แทนการเรียกฟังก์ชัน apply ตรง ๆ
//    3. เรียก await resolveEffectQueue() เพื่อ drain คิวทั้งหมด
//       (handler ที่ resolve อยู่สามารถ queueEffect() effect ใหม่เพิ่ม
//       เข้าคิวได้ระหว่างทาง — เช่น on-hit trigger สกิลอื่นต่อ — เพราะ
//       loop กลางจะดึงมาต่อเองโดยไม่ต้องเรียกซ้อนฟังก์ชัน)
//
//  handler แต่ละตัว: (payload, effect) => any — return ค่าอะไรก็ได้
//  (ปกติคือ "amount ที่ apply ได้จริง" ตาม pattern เดิมของ applyDamage
//  ฯลฯ) resolveEffectQueue() จะรวบผลลัพธ์ทั้งหมดเป็น array คืนกลับ
// ============================================================

// ── Effect type constants (ใช้แทน magic string) ────────────────
// รายการปัจจุบันครอบ engine พื้นฐาน (damage) ไว้แล้ว ที่เหลือ (heal/buff/
// debuff/draw/shield/summon/add-status) จองไว้ให้ระบบสกิลเรียกใช้ได้เลย
// โดยไม่ต้องแก้ queue.js อีก — แค่ onEffect(FX.HEAL, ...) ตอน setup
export const FX = Object.freeze({
  DAMAGE:      'damage',       // การ์ด → การ์ด
  HERO_DAMAGE: 'hero-damage',  // การ์ด → ฮีโร่
  HEAL:        'heal',
  BUFF:        'buff',
  DEBUFF:      'debuff',
  DRAW:        'draw',
  SHIELD:      'shield',
  SUMMON:      'summon',
  ADD_STATUS:  'add-status',
});

// ── Priority tiers ──────────────────────────────────────────────
// ตัวเลขน้อย = resolve ก่อน ใช้เทียบกันตรง ๆ ได้ (ไม่ต้องใช้ค่าตายตัว
// จาก enum นี้เป๊ะ ๆ — สกิลในอนาคตส่ง priority เป็นตัวเลขเองได้ เช่น
// "priority ก่อน NORMAL นิดหน่อย" = NORMAL - 1)
export const PRIORITY = Object.freeze({
  IMMEDIATE: 0,     // ผลที่ต้อง apply ก่อนสิ่งอื่นเสมอ (เช่น shield ดักไว้ก่อนโดนดาเมจ)
  HIGH:      50,
  NORMAL:    100,   // ค่า default — attack ปกติของ engine พื้นฐานอยู่ระดับนี้
  LOW:       200,   // เช่น on-death trigger ที่ควรเกิดหลังทุกอย่างในรอบนิ่งแล้ว
});

const _handlers = new Map();   // type → handler fn
let _queue = [];               // effect ที่ยังไม่ resolve
let _idCounter = 0;            // stable id ตัวนับขึ้นเรื่อย ๆ ไม่รีเซ็ตระหว่าง run

// ── onEffect / offEffect ─────────────────────────────────────
// register/unregister handler สำหรับ effect type หนึ่ง ๆ (1 type = 1 handler
// เพื่อกันของสองที่ apply effect เดียวกันซ้ำกันโดยไม่ตั้งใจ)
export function onEffect(type, handler) {
  if (_handlers.has(type)) {
    console.warn(`[EffectQueue] handler for "${type}" ถูกเขียนทับ`);
  }
  _handlers.set(type, handler);
}

export function offEffect(type) {
  _handlers.delete(type);
}

// ── queueEffect ───────────────────────────────────────────────
// push effect เข้าคิว คืน stable id ของ effect นั้น (ไว้ debug/trace)
export function queueEffect(type, payload = {}, priority = PRIORITY.NORMAL) {
  const effect = { id: ++_idCounter, type, priority, payload };
  _queue.push(effect);
  return effect.id;
}

// ── resolveEffectQueue ───────────────────────────────────────
// ดึง effect ออกมาทีละตัวตาม priority (น้อยไปมาก) แล้วตามด้วย stable id
// (กันเคส priority เท่ากันแล้วลำดับเดายาก) — เรียก handler แบบ await
// ทีละตัวใน loop เดียว (ไม่เรียกซ้อนฟังก์ชัน) จนกว่าคิวจะว่าง
// handler ที่กำลัง resolve สามารถ queueEffect() เพิ่มระหว่างทางได้
// (เช่น on-hit trigger สกิลอื่นต่อ) — loop นี้จะดึงมาต่อให้เอง
export async function resolveEffectQueue() {
  const results = [];
  while (_queue.length) {
    _queue.sort((a, b) => (a.priority - b.priority) || (a.id - b.id));
    const effect = _queue.shift();
    const handler = _handlers.get(effect.type);
    if (!handler) {
      console.warn(`[EffectQueue] ไม่มี handler สำหรับ "${effect.type}" — ข้าม effect นี้`, effect);
      continue;
    }
    try {
      results.push(await handler(effect.payload, effect));
    } catch (e) {
      console.error(`[EffectQueue] handler พังตอน resolve "${effect.type}":`, e);
    }
  }
  return results;
}

// ── utils ────────────────────────────────────────────────────
export function clearEffectQueue() { _queue = []; }
export function queueLength() { return _queue.length; }
