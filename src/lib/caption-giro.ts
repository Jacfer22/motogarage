import { formattaDurata, formattaKmDisplay } from '@/lib/geo';
import type { GiroUtente } from '@/lib/giri-store';
import { BRAND_DOMAIN } from '@/lib/brand-display';

export function generaDidascaliaGiro(
  giro: Pick<GiroUtente, 'nome' | 'km' | 'durataSec' | 'curve' | 'dislivelloM' | 'velMediaKmh'>,
  luogo?: string,
): string {
  const km = formattaKmDisplay(giro.km);
  const durata = formattaDurata(giro.durataSec);
  const righe = [
    giro.nome?.trim() || 'Giro in moto',
    luogo?.trim() ? `📍 ${luogo.trim()}` : null,
    `${km} km · ${durata}${giro.curve > 0 ? ` · ${giro.curve} curve` : ''}${giro.dislivelloM > 0 ? ` · ${giro.dislivelloM} m` : ''}`,
    giro.velMediaKmh > 0 ? `Vel. media ${Math.round(giro.velMediaKmh)} km/h` : null,
    '',
    `Tracciato con MotoGarage · ${BRAND_DOMAIN}`,
    '#motogarage #passionemoto #motoviaggi #instamoto #motorcyclelife',
  ];
  return righe.filter((r) => r !== null).join('\n');
}
