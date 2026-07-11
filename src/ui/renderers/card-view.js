// ============================================================
//  card-view.js — card HTML + stat color helpers
// ============================================================

const STAT_COLORS = Object.freeze({
  neutral: '#eee',
  atkUp:   '#4fc3ff',
  hpUp:    '#4cff4c',
  down:    '#ff4c4c',
});

function getOriginalATK(card) {
  return Number(card?.printedBaseATK ?? card?.baseATK ?? card?.atk ?? 0);
}

function getOriginalHP(card) {
  return Number(card?.printedBaseHP ?? card?.baseHP ?? card?.maxHP ?? card?.hp ?? 0);
}

export function getATKColor(card) {
  const base = getOriginalATK(card);
  const cur  = Number(card?.atk ?? base);
  return cur > base ? STAT_COLORS.atkUp : cur < base ? STAT_COLORS.down : STAT_COLORS.neutral;
}

export function getHPColor(card) {
  const base = getOriginalHP(card);
  const cur  = Number(card?.hp ?? base);
  return cur > base ? STAT_COLORS.hpUp : cur < base ? STAT_COLORS.down : STAT_COLORS.neutral;
}

export function applyStatColors(root, card) {
  const atkEl = root?.querySelector?.('.card-atk-val');
  if (atkEl?.parentElement) atkEl.parentElement.style.color = getATKColor(card);
  const hpEl = root?.querySelector?.('.card-hp-val');
  if (hpEl?.parentElement) hpEl.parentElement.style.color = getHPColor(card);
}

export function cardRenderSig(c) {
  return `${c.hp}|${c.atk}`;
}

export function createCardHTML(card, ctx) {
  const isEH = ctx === 'enemyHand', isG = ctx === 'grave', isB = ctx === 'board';
  const ac = getATKColor(card);
  const hc = getHPColor(card);
  const filt = isEH ? 'filter:brightness(0.6);' : (isG ? 'filter:grayscale(100%) opacity(70%);' : '');

  return `
    ${isB ? '' : `<div class="wait-time ${card.waitTime <= 0 ? 'ready' : ''}">${card.waitTime <= 0 ? '🔥 0' : '⏱️ ' + card.waitTime}</div>`}
    <div class="card-stars">${'⭐'.repeat(card.stars || 0)}</div>
    <div class="card ${card.isUR ? 'card-ur' : ''}" style="width:100%;height:100%;border:none;margin:0;position:static;">
      <div class="card-image-bg" style="background-image:url('${card.image}');${filt}"></div>
      <div class="card-data-overlay" style="${isB ? 'background:rgba(0,0,0,.85);padding-top:5px;' : ''}">
        ${isB ? '' : `<div style="font-size:.8rem">${card.name}</div>`}
        ${isG ? `<div style="font-size:.7rem;color:#aaa;margin-top:3px">💀 วิญญาณ</div>` : !isEH ? `
          <div style="font-size:.7rem;text-align:left;padding:${isB?'4px':'2px'};margin-top:${isB?'0':'5px'}">
            <div style="color:${ac};font-weight:bold;display:flex;justify-content:space-between"><span>⚔️ATK</span><span class="card-atk-val">${card.atk}</span></div>
            <hr style="border:0;border-top:1px solid #777;margin:3px 0">
            <div style="color:${hc};font-weight:bold;display:flex;justify-content:space-between"><span>❤️HP</span><span class="card-hp-val">${card.hp}</span></div>
          </div>` : ''}
      </div>
    </div>`;
}
