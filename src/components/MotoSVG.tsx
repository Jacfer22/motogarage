'use client';

export type TipoMoto = 'naked' | 'sportiva' | 'adventure' | 'custom' | 'enduro';

export interface MotoConfig {
  tipo: TipoMoto;
  colorePrimario: string;
  coloreSecondario: string;
  accessori: string[];
}

// Costanti colori struttura
const T = '#2e2e2e'; // telaio
const M = '#1e1e1e'; // motore
const C = '#8a8a8a'; // cromo/silver

// Ruota con cerchio e raggi
function W({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const ri = Math.round(r * 0.67);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#111" />
      <circle cx={cx} cy={cy} r={ri} fill="#252525" />
      {[0, 36, 72, 108, 144].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(a) * (ri - 3)}
            y1={cy + Math.sin(a) * (ri - 3)}
            x2={cx - Math.cos(a) * (ri - 3)}
            y2={cy - Math.sin(a) * (ri - 3)}
            stroke="#383838"
            strokeWidth="2.5"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={9} fill={C} />
      <circle cx={cx} cy={cy} r={4} fill="#aaa" />
    </g>
  );
}

export default function MotoSVG({
  tipo,
  colorePrimario: p,
  coloreSecondario: s,
  accessori = [],
  className,
}: {
  tipo: TipoMoto;
  colorePrimario: string;
  coloreSecondario: string;
  accessori?: string[];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 480 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Moto ${tipo}`}
    >
      {/* ombra sotto */}
      <ellipse cx={238} cy={222} rx={195} ry={7} fill="rgba(0,0,0,0.18)" />
      {tipo === 'naked' && <Naked p={p} s={s} ac={accessori} />}
      {tipo === 'sportiva' && <Sportiva p={p} s={s} ac={accessori} />}
      {tipo === 'adventure' && <Adventure p={p} s={s} ac={accessori} />}
      {tipo === 'custom' && <Custom p={p} s={s} ac={accessori} />}
      {tipo === 'enduro' && <Enduro p={p} s={s} ac={accessori} />}
    </svg>
  );
}

// ─── NAKED (Ducati Monster / KTM Duke style) ───────────────────────────
function Naked({ p, s }: { p: string; s: string; ac: string[] }) {
  return (
    <>
      {/* scarico */}
      <path d="M 115 178 Q 138 162 165 164 L 165 174 Q 138 172 115 188 Z" fill={C} opacity="0.8" />
      {/* ruota posteriore */}
      <W cx={108} cy={185} r={50} />
      {/* catena */}
      <path d="M 108 184 Q 148 166 170 168" stroke="#333" strokeWidth="5" fill="none" />
      {/* telaio principale */}
      <path d="M 108 184 L 128 150 L 150 122 Q 200 118 265 112 L 288 148 L 315 162"
        stroke={T} strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* telaietto posteriore */}
      <path d="M 108 184 L 116 156 L 130 138 L 148 124"
        stroke={T} strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* motore */}
      <rect x="150" y="150" width="82" height="42" rx="7" fill={M} />
      <rect x="154" y="154" width="26" height="32" rx="4" fill="#191919" />
      <rect x="185" y="154" width="20" height="26" rx="3" fill="#191919" />
      {/* serbatoio (primario) */}
      <path d="M 148 122 C 158 88 198 74 250 78 C 275 81 286 98 282 116 L 268 126 C 242 132 195 128 152 130 Z" fill={p} />
      {/* striscia serbatoio (secondario) */}
      <path d="M 200 76 C 224 72 252 76 272 88 L 268 94 C 248 82 224 78 200 82 Z" fill={s} opacity="0.75" />
      {/* tappo */}
      <ellipse cx="225" cy="79" rx="15" ry="5" fill="#555" opacity="0.6" />
      {/* sella (secondario) */}
      <path d="M 108 152 C 120 138 136 126 152 122 L 152 136 C 136 140 120 150 112 165 Z" fill={s} />
      {/* codino (primario) */}
      <polygon points="108,152 108,124 120,122 128,135 126,154" fill={p} />
      {/* luce posteriore */}
      <rect x="102" y="122" width="9" height="6" rx="1" fill="#ff2222" />
      {/* forcella ~72° */}
      <line x1="288" y1="148" x2="316" y2="82" stroke={C} strokeWidth="8" strokeLinecap="round" />
      <line x1="300" y1="152" x2="328" y2="86" stroke={C} strokeWidth="8" strokeLinecap="round" />
      <rect x="310" y="78" width="22" height="16" rx="5" fill={T} />
      {/* ruota anteriore */}
      <W cx={368} cy={185} r={46} />
      {/* parafango anteriore */}
      <path d="M 323 152 Q 316 170 325 185" stroke={p} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* faro rotondo (naked) */}
      <circle cx="355" cy="130" r="24" fill="#1a1a1a" />
      <circle cx="355" cy="130" r="20" fill="#d4a820" opacity="0.88" />
      <circle cx="355" cy="130" r="11" fill="#fff" opacity="0.5" />
      {/* manubrio alto */}
      <rect x="306" y="66" width="42" height="7" rx="3" fill={C} />
      <rect x="306" y="66" width="5" height="18" rx="2.5" fill={C} />
      <rect x="343" y="66" width="5" height="18" rx="2.5" fill={C} />
    </>
  );
}

// ─── SPORTIVA (CBR / R1 / GSX-R style) ────────────────────────────────
function Sportiva({ p, s }: { p: string; s: string; ac: string[] }) {
  return (
    <>
      {/* scarico racing */}
      <path d="M 118 178 Q 138 165 164 162 L 165 170 Q 139 173 118 186 Z" fill={C} opacity="0.9" />
      <W cx={108} cy={185} r={50} />
      {/* telaio */}
      <path d="M 108 184 L 128 152 L 148 126 L 275 116 L 298 148 L 322 162"
        stroke={T} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 108 184 L 116 156 L 128 138 L 145 126"
        stroke={T} strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="148" y="150" width="88" height="42" rx="6" fill={M} />
      {/* sottopancia (secondario) */}
      <path d="M 148 192 L 150 172 L 242 164 L 282 172 L 282 192 Z" fill={s} opacity="0.85" />
      {/* carena piena (primario) */}
      <path d="M 148 124 C 155 92 198 76 254 80 C 280 83 295 100 292 118 L 278 126 C 252 134 195 130 152 132 Z" fill={p} />
      {/* carena anteriore */}
      <path d="M 278 124 C 295 128 320 140 342 152 L 335 162 C 312 148 288 134 278 130 Z" fill={p} />
      {/* cupolino (secondario) */}
      <polygon points="275,82 314,68 332,85 295,106" fill={s} opacity="0.9" />
      <polygon points="279,84 310,72 326,87 290,105" fill="rgba(120,200,255,0.35)" />
      {/* sella piccola */}
      <path d="M 108 150 C 118 138 135 126 150 122 L 150 134 C 135 138 118 148 112 162 Z" fill={s} />
      <polygon points="108,150 108,122 118,120 126,133 124,152" fill={p} />
      <rect x="102" y="116" width="8" height="6" rx="1" fill="#ff2222" />
      {/* forcella più rakeata ~60° */}
      <line x1="298" y1="148" x2="308" y2="88" stroke={C} strokeWidth="7" strokeLinecap="round" />
      <line x1="310" y1="152" x2="320" y2="92" stroke={C} strokeWidth="7" strokeLinecap="round" />
      <rect x="304" y="84" width="20" height="14" rx="4" fill={T} />
      <W cx={368} cy={185} r={46} />
      {/* carena frontale sopra ruota */}
      <path d="M 320 158 C 335 142 355 136 375 136 C 395 136 415 148 422 162 Q 408 128 382 118 Q 352 110 326 128 Z" fill={p} />
      {/* faro a fessura */}
      <rect x="390" y="130" width="30" height="10" rx="4" fill="#d4a820" opacity="0.9" />
      <rect x="390" y="143" width="22" height="5" rx="2" fill="#fff" opacity="0.4" />
      {/* clip-on bassi */}
      <rect x="306" y="90" width="34" height="6" rx="3" fill={C} />
      <rect x="306" y="90" width="4" height="14" rx="2" fill={C} />
      <rect x="336" y="90" width="4" height="14" rx="2" fill={C} />
    </>
  );
}

// ─── ADVENTURE (BMW GS / Africa Twin style) ────────────────────────────
function Adventure({ p, s, ac }: { p: string; s: string; ac: string[] }) {
  const hasBorse = ac.includes('borse');
  return (
    <>
      {/* scarico alto (laterale) */}
      <path d="M 130 178 L 130 145 L 140 140 L 142 148 L 135 178 Z" fill={C} opacity="0.8" />
      <W cx={108} cy={185} r={50} />
      {/* borse laterali se accessorio */}
      {hasBorse && (
        <>
          <rect x="58" y="140" width="52" height="42" rx="6" fill={s} opacity="0.95" />
          <rect x="60" y="142" width="48" height="38" rx="5" fill="none" stroke={p} strokeWidth="2" />
          <line x1="84" y1="142" x2="84" y2="180" stroke={p} strokeWidth="2" opacity="0.6" />
        </>
      )}
      {/* telaio verticale */}
      <path d="M 108 184 L 126 150 L 148 118 L 272 106 L 298 140 L 335 156"
        stroke={T} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 108 184 L 116 154 L 128 136 L 145 120"
        stroke={T} strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="148" y="148" width="90" height="44" rx="7" fill={M} />
      {/* serbatoio grande */}
      <path d="M 145 116 C 152 78 200 62 265 68 C 294 72 306 92 302 112 L 286 122 C 258 130 198 126 149 126 Z" fill={p} />
      <path d="M 210 64 C 240 60 272 68 292 82 L 288 88 C 268 74 240 66 210 70 Z" fill={s} opacity="0.7" />
      <path d="M 258 118 C 265 118 278 115 288 108 L 282 128 C 270 132 258 130 255 125 Z" fill={s} opacity="0.7" />
      <path d="M 108 148 C 118 135 136 120 148 116 L 148 130 C 136 134 120 146 112 160 Z" fill={s} />
      <polygon points="108,148 108,120 120,116 130,130 126,150" fill={p} />
      <rect x="102" y="114" width="10" height="7" rx="2" fill="#ff2222" />
      {/* cupolino grande adventure */}
      <polygon points="288,110 330,60 356,72 318,118" fill={p} />
      <polygon points="293,113 328,64 350,74 316,120" fill="rgba(160,220,255,0.30)" />
      {/* forcella dritta ~82° */}
      <line x1="298" y1="140" x2="332" y2="62" stroke={C} strokeWidth="9" strokeLinecap="round" />
      <line x1="310" y1="144" x2="344" y2="66" stroke={C} strokeWidth="9" strokeLinecap="round" />
      <rect x="326" y="57" width="23" height="15" rx="5" fill={T} />
      <W cx={368} cy={185} r={46} />
      <path d="M 340 148 Q 332 168 342 185" stroke={p} strokeWidth="11" fill="none" strokeLinecap="round" />
      {/* faro rettangolare */}
      <rect x="352" y="110" width="36" height="24" rx="5" fill="#1a1a1a" />
      <rect x="354" y="112" width="32" height="20" rx="4" fill="#d4a820" opacity="0.85" />
      {/* manubrio largo alto */}
      <rect x="314" y="50" width="46" height="7" rx="3" fill={C} />
      <rect x="314" y="50" width="5" height="18" rx="2.5" fill={C} />
      <rect x="355" y="50" width="5" height="18" rx="2.5" fill={C} />
    </>
  );
}

// ─── CUSTOM (Harley / Chopper style) ──────────────────────────────────
function Custom({ p, s }: { p: string; s: string; ac: string[] }) {
  return (
    <>
      {/* scarico laterale basso */}
      <path d="M 108 195 Q 215 192 295 188 L 295 196 Q 215 200 108 203 Z" fill={C} opacity="0.8" />
      {/* ruota posteriore più grossa */}
      <W cx={108} cy={185} r={52} />
      {/* parafango posteriore largo */}
      <path d="M 80 146 Q 72 164 80 185" stroke={p} strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* telaio basso lungo */}
      <path d="M 108 184 L 132 168 L 158 162 L 308 152 L 335 164"
        stroke={T} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* motore V-twin */}
      <rect x="158" y="162" width="98" height="30" rx="6" fill={M} />
      <polygon points="180,162 195,128 208,128 192,162" fill={M} />
      <polygon points="228,162 243,128 256,128 240,162" fill={M} />
      <rect x="180" y="122" width="32" height="12" rx="5" fill="#2a2a2a" />
      <rect x="228" y="122" width="32" height="12" rx="5" fill="#2a2a2a" />
      {/* serbatoio lungo basso (primario) */}
      <path d="M 158 162 C 162 140 195 130 295 128 C 322 128 340 140 338 158 L 322 165 C 295 168 200 165 162 168 Z" fill={p} />
      <path d="M 220 128 C 260 126 308 130 330 142 L 326 148 C 305 136 260 132 220 134 Z" fill={s} opacity="0.65" />
      {/* sella lunga bassa */}
      <path d="M 108 168 C 122 158 142 152 162 150 L 162 162 C 142 164 124 170 112 178 Z" fill={s} />
      <polygon points="108,168 108,142 125,138 132,152 128,168" fill={p} />
      <rect x="102" y="136" width="10" height="7" rx="2" fill="#ff2222" />
      {/* forcella rakeata ~45° */}
      <line x1="335" y1="160" x2="295" y2="108" stroke={C} strokeWidth="9" strokeLinecap="round" />
      <line x1="347" y1="163" x2="307" y2="111" stroke={C} strokeWidth="9" strokeLinecap="round" />
      <rect x="292" y="103" width="20" height="14" rx="4" fill={T} />
      <W cx={368} cy={185} r={46} />
      {/* parafango anteriore lungo */}
      <path d="M 308 138 Q 294 158 300 185" stroke={p} strokeWidth="11" fill="none" strokeLinecap="round" />
      {/* faro rotondo classico */}
      <circle cx="354" cy="142" r="24" fill="#1a1a1a" />
      <circle cx="354" cy="142" r="20" fill="#d4a820" opacity="0.88" />
      <circle cx="354" cy="142" r="12" fill="#fff" opacity="0.5" />
      {/* manubrio ape-hanger alto */}
      <line x1="296" y1="106" x2="296" y2="62" stroke={C} strokeWidth="7" strokeLinecap="round" />
      <line x1="296" y1="62" x2="345" y2="58" stroke={C} strokeWidth="7" strokeLinecap="round" />
      <line x1="345" y1="58" x2="345" y2="106" stroke={C} strokeWidth="7" strokeLinecap="round" />
    </>
  );
}

// ─── ENDURO (KTM EXC / WR style) ──────────────────────────────────────
function Enduro({ p, s, ac }: { p: string; s: string; ac: string[] }) {
  const haParamani = ac.includes('paramani');
  return (
    <>
      {/* scarico alto */}
      <path d="M 132 148 L 138 115 L 146 112 L 148 148 Z" fill={C} opacity="0.85" />
      <path d="M 136 115 L 140 90 L 148 88 L 148 115 Z" fill={C} opacity="0.65" />
      {/* ruota posteriore con effetto knobby */}
      <W cx={108} cy={185} r={50} />
      {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 252, 270, 288, 306, 324, 342].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={108 + Math.cos(a) * 46} y1={185 + Math.sin(a) * 46}
            x2={108 + Math.cos(a) * 52} y2={185 + Math.sin(a) * 52}
            stroke="#0d0d0d" strokeWidth="4" />
        );
      })}
      {/* telaio alto stretto */}
      <path d="M 108 184 L 126 152 L 145 122 L 258 110 L 282 145 L 320 162"
        stroke={T} strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M 108 184 L 116 154 L 128 134 L 144 122"
        stroke={T} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="145" y="152" width="76" height="38" rx="6" fill={M} />
      {/* serbatoio stretto (primario) */}
      <path d="M 142 120 C 150 82 186 68 238 70 C 264 72 276 90 272 110 L 258 118 C 235 125 188 122 146 126 Z" fill={p} />
      <path d="M 204 68 C 226 64 250 70 268 82 L 264 88 C 246 76 226 70 204 74 Z" fill={s} opacity="0.85" />
      {/* pannello laterale airbox */}
      <path d="M 258 118 C 265 118 278 115 288 108 L 282 128 C 270 132 258 130 255 125 Z" fill={s} opacity="0.75" />
      <path d="M 108 152 C 118 138 134 124 145 120 L 145 132 C 134 136 118 148 112 162 Z" fill={s} />
      <polygon points="108,152 108,126 118,123 125,136 122,154" fill={p} />
      <rect x="102" y="120" width="9" height="6" rx="1" fill="#ff2222" />
      {/* forcella lunghissima quasi verticale */}
      <line x1="282" y1="145" x2="320" y2="52" stroke={C} strokeWidth="10" strokeLinecap="round" />
      <line x1="294" y1="148" x2="332" y2="55" stroke={C} strokeWidth="10" strokeLinecap="round" />
      {/* soffietto forcella */}
      <rect x="312" y="88" width="25" height="22" rx="4" fill="#2e2e2e" />
      <rect x="316" y="46" width="22" height="16" rx="5" fill={T} />
      {/* ruota anteriore knobby */}
      <W cx={368} cy={185} r={46} />
      {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 252, 270, 288, 306, 324, 342].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line key={`f${deg}`}
            x1={368 + Math.cos(a) * 42} y1={185 + Math.sin(a) * 42}
            x2={368 + Math.cos(a) * 48} y2={185 + Math.sin(a) * 48}
            stroke="#0d0d0d" strokeWidth="3.5" />
        );
      })}
      {/* parafango plastico alto */}
      <path d="M 328 148 Q 320 168 330 185" stroke={p} strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* tabella portanumero */}
      <rect x="350" y="112" width="28" height="22" rx="4" fill={s} />
      <rect x="352" y="114" width="24" height="18" rx="3" fill="#fff" opacity="0.88" />
      <rect x="354" y="118" width="20" height="6" rx="2" fill="#d4a820" opacity="0.8" />
      {/* manubrio largo con traversino */}
      <rect x="298" y="40" width="56" height="7" rx="3" fill={C} />
      <rect x="316" y="40" width="20" height="5" rx="2" fill={C} opacity="0.7" />
      <rect x="298" y="40" width="5" height="15" rx="2.5" fill={C} />
      <rect x="349" y="40" width="5" height="15" rx="2.5" fill={C} />
      {/* paramani se accessorio */}
      {haParamani && (
        <>
          <ellipse cx={291} cy={45} rx={17} ry={10} fill={p} opacity="0.9" />
          <ellipse cx={361} cy={45} rx={17} ry={10} fill={p} opacity="0.9" />
        </>
      )}
    </>
  );
}
