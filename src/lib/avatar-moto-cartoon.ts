/** SVG cartoon TRK502X — vista laterale, stile avatar mappa. */
export function svgAvatarTrk502x(primario = '#c8102e', secondario = '#ececec', accento = '#1a1a1a') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" width="64" height="40" aria-hidden="true">
    <ellipse cx="32" cy="36" rx="22" ry="3" fill="rgba(0,0,0,0.22)"/>
    <circle cx="17" cy="30" r="7" fill="${accento}" stroke="${secondario}" stroke-width="1.5"/>
    <circle cx="17" cy="30" r="3" fill="${secondario}"/>
    <circle cx="47" cy="30" r="7" fill="${accento}" stroke="${secondario}" stroke-width="1.5"/>
    <circle cx="47" cy="30" r="3" fill="${secondario}"/>
    <path d="M12 28 Q14 22 22 20 L38 18 Q46 17 50 20 L54 24" fill="none" stroke="${accento}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M18 26 L24 14 Q26 10 32 9 Q38 8 42 12 L46 20 L50 24 L52 26" fill="${primario}" stroke="${accento}" stroke-width="0.8"/>
    <path d="M24 14 L28 8 Q30 6 34 6 Q38 6 40 9 L42 14" fill="${secondario}" stroke="${accento}" stroke-width="0.6"/>
    <rect x="30" y="7" width="10" height="5" rx="1" fill="${accento}" opacity="0.35"/>
    <path d="M20 22 L26 20 L30 24 L22 26 Z" fill="${secondario}" opacity="0.9"/>
    <ellipse cx="36" cy="19" rx="5" ry="3" fill="${accento}" opacity="0.25"/>
    <circle cx="52" cy="23" r="2" fill="#fbbf24"/>
  </svg>`;
}

export function htmlMarkerAvatarMoto(rotazioneGradi: number, primario?: string, secondario?: string) {
  const svg = svgAvatarTrk502x(primario, secondario);
  return `<div style="transform:rotate(${rotazioneGradi}deg);width:52px;height:36px;margin:-18px 0 0 -26px;"><div class="reel-avatar-moto-inner">${svg}</div></div>`;
}
