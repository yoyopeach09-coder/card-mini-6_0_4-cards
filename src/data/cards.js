// ============================================================
//  cards.js — Card Database
//  ไม่ขึ้นกับไฟล์ใด · เพิ่มการ์ดใหม่ที่นี่เท่านั้น
//
//  รูปแบบ: การ์ดแต่ละใบแยกบรรทัด stat กับบรรทัด image ออกจากกัน
//  เพื่อให้ diff เห็นชัดเวลามีคนแก้แค่ stat หรือแค่ image อย่างเดียว
//  จัดกลุ่มตาม stars (⭐ ยิ่งเยอะยิ่งแรง, 6 ดาว = UR)
// ============================================================

export const cardDB = [

  // ── ⭐1–5 — การ์ดทั่วไป ──────────────────────────────────────
  {
    id: 1, name: 'Goblin',
    hp: 300, atk: 150, waitTime: 2, stars: 1,
    image: 'https://i.postimg.cc/tCkDpygS/b699f533da1b9c729a446f7521186312.webp',
  },
  {
    id: 2, name: 'Hellhound',
    hp: 450, atk: 250, waitTime: 2, stars: 2,
    image: 'https://i.postimg.cc/pXs7kKKf/9d17994d-4035-4cf3-8493-bf4412b9d28d.jpg',
  },
  {
    id: 3, name: 'Artemis',
    hp: 600, atk: 350, waitTime: 3, stars: 3,
    image: 'https://i.postimg.cc/Gpdy2TSg/a475e71e-0f52-42ec-bff2-6b2b81fad58a.jpg',
  },
  {
    id: 4, name: 'Ares',
    hp: 800, atk: 400, waitTime: 4, stars: 4,
    image: 'https://i.postimg.cc/Px1PhXd8/1966f728-8f4c-4bf8-b436-f214325d3a6c.jpg',
  },
  {
    id: 5, name: 'Titan',
    hp: 1200, atk: 500, waitTime: 6, stars: 5,
    image: 'https://i.postimg.cc/Rhf1k5YZ/42e365f9-ad0d-4f18-a1d2-10af673a512f.jpg',
  },

  // ── ⭐6 — UR (Ultra Rare) ────────────────────────────────────
  {
    id: 97, name: 'Chrono Arbiter',
    hp: 880, atk: 390, waitTime: 5, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/kGTRNFMP/8cc2d32e-471d-4222-b59e-d978217ae905.jpg',
  },
  {
    id: 98, name: 'Chronovex Rift Conductor',
    hp: 800, atk: 400, waitTime: 5, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/zfvWgthR/2c78b3fd-d165-46a2-b035-7eb71d6d7d28.jpg',
  },
  {
    id: 99, name: 'Abyssal Lord',
    hp: 500, atk: 500, waitTime: 5, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/KvkDTLcP/e3d314c0-5428-4f01-bad7-06d25ab6f4fa.jpg',
  },
  {
    id: 100, name: 'Aeternus of Undying',
    hp: 1500, atk: 300, waitTime: 6, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/C17hNmYH/82f3cd3d-3bd1-46af-8d29-16f82bb24167.jpg',
  },
  {
    id: 101, name: 'Ghost Zero',
    hp: 950, atk: 420, waitTime: 6, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/qvRq32d8/732c2394-755d-43d5-af08-578719af29c4.jpg',
  },
  {
    id: 102, name: 'Tyrant of the Fallen',
    hp: 900, atk: 450, waitTime: 6, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/BbkckYvb/1aaf4207-c764-481c-b88d-92575a364df1.jpg',
  },
  {
    id: 103, name: 'Void Dragon',
    hp: 1300, atk: 360, waitTime: 6, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/3rjb2yXk/4c3cfe66-67a1-49c9-b4e6-67500d0ca177.jpg',
  },
  {
    id: 104, name: "Kael'thuz",
    hp: 1100, atk: 444, waitTime: 6, stars: 6, isUR: true,
    image: 'https://i.postimg.cc/Wb5TMGVW/c885d521-ba6d-4138-89e2-c886c0728494.jpg',
  },

];
