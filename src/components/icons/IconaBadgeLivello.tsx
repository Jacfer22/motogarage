import type { Badge } from '@/lib/badge';

/** Badge SVG unici — cornice e complessità crescono col rango (0 → 6). */
export default function IconaBadgeLivello({
  badge,
  size = 72,
  className = '',
}: {
  badge: Pick<Badge, 'id' | 'rango'>;
  size?: number;
  className?: string;
}) {
  const r = badge.rango;
  const uid = badge.id.replace(/[^a-z0-9]/gi, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5f5f4" />
          <stop offset="45%" stopColor="#a8a29e" />
          <stop offset="100%" stopColor="#57534e" />
        </linearGradient>
        <linearGradient id={`${uid}-brand`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d2e" />
          <stop offset="100%" stopColor="#b81800" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ED2100" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ED2100" stopOpacity="0" />
        </radialGradient>
        {r >= 6 && (
          <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        )}
      </defs>

      {/* Raggio 6 — raggi + alone */}
      {r >= 6 && (
        <>
          <circle cx="32" cy="34" r="28" fill={`url(#${uid}-glow)`} filter={`url(#${uid}-blur)`} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="34"
              x2={32 + 26 * Math.cos((deg * Math.PI) / 180)}
              y2={34 + 26 * Math.sin((deg * Math.PI) / 180)}
              stroke="#ED2100"
              strokeWidth="0.6"
              opacity="0.35"
            />
          ))}
        </>
      )}

      {/* Rango 5–6 — corona */}
      {r >= 5 && (
        <g transform="translate(0,-2)">
          <path
            d="M18 14 L22 8 L26 13 L32 6 L38 13 L42 8 L46 14 L44 18 L20 18 Z"
            fill={`url(#${uid}-brand)`}
            stroke="#fecaca"
            strokeWidth="0.6"
          />
          <circle cx="22" cy="10" r="1" fill="#fde68a" />
          <circle cx="32" cy="8" r="1.2" fill="#fde68a" />
          <circle cx="42" cy="10" r="1" fill="#fde68a" />
        </g>
      )}

      {/* Rango 4–6 — strato esterno esagonale */}
      {r >= 4 && (
        <path
          d="M32 6 L50 16 V38 L32 52 L14 38 V16 Z"
          fill="none"
          stroke={`url(#${uid}-metal)`}
          strokeWidth="1.4"
          opacity="0.85"
        />
      )}

      {/* Rango 3–6 — strato medio scudo */}
      {r >= 3 && (
        <path
          d="M32 10 C42 10 48 16 48 26 C48 38 32 50 32 50 C32 50 16 38 16 26 C16 16 22 10 32 10 Z"
          fill="rgba(15,11,10,0.92)"
          stroke={`url(#${uid}-brand)`}
          strokeWidth={r >= 5 ? 1.6 : 1.2}
        />
      )}

      {/* Rango 2–6 — scudo base */}
      {r >= 2 && (
        <path
          d="M32 14 C40 14 44 19 44 27 C44 36 32 46 32 46 C32 46 20 36 20 27 C20 19 24 14 32 14 Z"
          fill={r >= 4 ? 'rgba(237,33,0,0.12)' : 'rgba(255,255,255,0.04)'}
          stroke={r >= 2 ? '#78716c' : 'none'}
          strokeWidth="0.8"
        />
      )}

      {/* Rango 1 — anello esterno */}
      {r >= 1 && (
        <>
          <circle cx="32" cy="32" r="26" fill="none" stroke={`url(#${uid}-metal)`} strokeWidth="1.2" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(237,33,0,0.35)" strokeWidth="0.6" strokeDasharray="3 2" />
        </>
      )}

      {/* Rango 0 — cornice tonda semplice */}
      {r === 0 && (
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="rgba(255,255,255,0.04)"
          stroke="#78716c"
          strokeWidth="1.4"
        />
      )}

      {/* Rango 5–6 — terzo strato interno */}
      {r >= 5 && (
        <path
          d="M32 18 C38 18 41 22 41 28 C41 35 32 42 32 42 C32 42 23 35 23 28 C23 22 26 18 32 18 Z"
          fill="none"
          stroke="#fecaca"
          strokeWidth="0.7"
          opacity="0.7"
        />
      )}

      {/* Icone interne uniche per badge */}
      {badge.id === 'chiave-in-mano' && (
        <g transform="translate(32 33)">
          {/* Chiave classica da moto — centrata, pulita */}
          <circle cx="0" cy="-9" r="8" fill="none" stroke="#d6d3d1" strokeWidth="2" />
          <circle cx="0" cy="-9" r="3" fill="none" stroke="#78716c" strokeWidth="1.2" />
          <rect x="-2" y="-1" width="4" height="16" rx="1.5" fill="#d6d3d1" />
          <rect x="-6" y="10" width="5" height="2.5" rx="0.8" fill="#d6d3d1" />
          <rect x="-6" y="14.5" width="4" height="2.5" rx="0.8" fill="#d6d3d1" />
        </g>
      )}

      {badge.id === 'strada-aperta' && (
        <g>
          {/* Strada in prospettiva — due cigli + tratto centrale */}
          <path
            d="M16 44 L32 24 L48 44 Z"
            fill="#1c1917"
            stroke="#57534e"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M22 44 L32 28 L42 44"
            fill="none"
            stroke="#78716c"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M32 28 L32 44"
            stroke="#f2b705"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="2.5 2.5"
          />
          <circle cx="32" cy="22" r="2.5" fill="#f2b705" opacity="0.85" />
        </g>
      )}

      {badge.id === 'centauro-asfalto' && (
        <g className="text-brand">
          <circle cx="32" cy="34" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="34" r="2" fill="currentColor" />
          <path d="M22 34 H18 M46 34 H42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 22 C32 22 36 24 36 28" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M28 40 C30 38 34 38 36 40" stroke="#f0f1f2" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {badge.id === 'conquistatore-passi' && (
        <g>
          <path d="M18 38 L24 30 L30 34 L36 26 L42 32 L46 38 Z" fill="rgba(120,113,108,0.5)" stroke="#a8a29e" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M36 26 L36 20" stroke="#f2b705" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M34 20 H38 L36 17 Z" fill="#f2b705" />
          <circle cx="24" cy="30" r="1" fill="#fff" opacity="0.6" />
        </g>
      )}

      {badge.id === 're-delle-curve' && (
        <g className="text-brand">
          <path
            d="M20 38 C20 38 22 28 32 28 C42 28 44 20 44 20"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M18 40 C24 36 28 36 32 38 C36 40 40 40 46 36"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="44" cy="20" r="2" fill="#f2b705" />
        </g>
      )}

      {badge.id === 'leggenda-in-sella' && (
        <g>
          <path d="M22 36 C26 30 38 30 42 36" stroke="#ED2100" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="32" rx="8" ry="5" stroke="#a8a29e" strokeWidth="1.2" fill="rgba(237,33,0,0.15)" />
          <path d="M24 28 C28 24 36 24 40 28" stroke="#f0f1f2" strokeWidth="1.2" fill="none" />
          {[22, 42].map((x) => (
            <path key={x} d={`M${x} 30 C${x} 34 ${x} 34 ${x} 38`} stroke="#78716c" strokeWidth="0.8" fill="none" />
          ))}
        </g>
      )}

      {badge.id === 'divinita-bitume' && (
        <g className="text-brand">
          <path
            d="M32 18 L36 28 H44 L38 34 L40 44 L32 38 L24 44 L26 34 L20 28 H28 Z"
            fill="rgba(237,33,0,0.25)"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M32 14 V18 M32 44 V48" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M16 32 H20 M44 32 H48" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}

      {/* Rango 4+ — borchie angolari */}
      {r >= 4 && (
        <>
          {[
            [14, 16],
            [50, 16],
            [14, 46],
            [50, 46],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="#d6d3d1" />
          ))}
        </>
      )}
    </svg>
  );
}
