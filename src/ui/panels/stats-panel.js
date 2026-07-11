// ============================================================
//  stats-panel.js — end-game combat stats panel
// ============================================================
import { $, OWNER } from '../../core/config.js';
import { gs } from '../../core/state.js';

export function renderStatsUI() {
  const statVal = (s, f) => Math.max(0, Math.floor(Number(s?.[f] || 0)));
  const activity = (s) => ['dmg','taken','heal','buffAtk','buffHP','hpLoss','maxHpLost','shieldBlocked','kills']
    .reduce((sum, f) => sum + statVal(s, f), 0);
  const sorted = Object.values(gs.combatStats).sort((a, b) => activity(b) - activity(a));
  const active = sorted.filter(activity);
  const maxOf = (field) => Math.max(...active.map(s => statVal(s, field)), 1);
  const max = {
    dmg: maxOf('dmg'), taken: maxOf('taken'), heal: maxOf('heal'),
    buffAtk: maxOf('buffAtk'), buffHP: maxOf('buffHP'), hpLoss: maxOf('hpLoss'),
    maxHpLost: maxOf('maxHpLost'), shieldBlocked: maxOf('shieldBlocked'), kills: maxOf('kills'),
  };
  const bar = (s, field, cls, label, extra = '') => {
    const v = statVal(s, field);
    return v ? `<div class="stat-bar-bg"><div class="stat-bar-fill ${cls}" style="width:${v / max[field] * 100}%;${extra}">${label} ${v}</div></div>` : '';
  };
  $('stats-content').innerHTML = active
    .map(s => `
      <div class="stat-card-row">
        <div class="stat-name"><span class="${s.owner === OWNER.PLAYER ? 'log-player' : 'log-enemy'}">${s.owner}</span> — ${s.name}${s.isClone ? ' (โคลน)' : ''}</div>
        ${bar(s, 'kills', 'fill-kill', '☠️ Kills')}
        ${bar(s, 'dmg', 'fill-dmg', '⚔️ DMG')}
        ${bar(s, 'taken', 'fill-tank', '🛡️ Taken', 'color:#fff')}
        ${bar(s, 'heal', 'fill-heal', '💚 Heal')}
        ${bar(s, 'buffAtk', 'fill-buff-atk', '🔵 ATK Buff')}
        ${bar(s, 'buffHP', 'fill-buff-hp', '💙 HP Buff')}
        ${bar(s, 'maxHpLost', 'fill-loss', '💀 MaxHP Lost', 'color:#fff')}
        ${bar(s, 'hpLoss', 'fill-loss', '🩸 HP Loss', 'color:#fff')}
        ${bar(s, 'shieldBlocked', 'fill-block', '🛡️ Blocked')}
      </div>`)
    .join('') || "<div style='text-align:center;color:#888'>ยังไม่มีสถิติ</div>";
}
