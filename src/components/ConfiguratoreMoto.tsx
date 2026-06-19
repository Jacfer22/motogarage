'use client';

import { useState } from 'react';
import MotoSVG, { TipoMoto, MotoConfig } from './MotoSVG';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

const TIPI: { id: TipoMoto; label: string; emoji: string; desc: string }[] = [
  { id: 'naked', label: 'Naked', emoji: '🏍️', desc: 'Agile, esposta, pura' },
  { id: 'sportiva', label: 'Sportiva', emoji: '🔴', desc: 'Carena, velocità, adrenalina' },
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', desc: 'Tutto terreno, gravel, libertà' },
  { id: 'custom', label: 'Custom', emoji: '⭐', desc: 'Chopper, stile, strada lunga' },
  { id: 'enduro', label: 'Enduro', emoji: '🌿', desc: 'Off-road, sterrato, fango' },
];

const ACCESSORI_PER_TIPO: Record<TipoMoto, { id: string; label: string; emoji: string }[]> = {
  naked:    [{ id: 'cupolino', label: 'Cupolino', emoji: '💨' }, { id: 'scarico', label: 'Scarico racing', emoji: '🔥' }],
  sportiva: [{ id: 'scarico', label: 'Scarico Akrapovic', emoji: '🔥' }],
  adventure:[{ id: 'borse', label: 'Borse laterali', emoji: '👜' }, { id: 'cupolino', label: 'Cupolino alto', emoji: '💨' }, { id: 'paramani', label: 'Paramani', emoji: '🖐️' }],
  custom:   [{ id: 'scarico', label: 'Scarico custom', emoji: '🔥' }],
  enduro:   [{ id: 'paramani', label: 'Paramani', emoji: '🖐️' }, { id: 'scarico', label: 'Scarico racing', emoji: '🔥' }],
};

interface Props {
  configIniziale: MotoConfig;
  onSalvato?: (config: MotoConfig) => void;
}

export default function ConfiguratoreMoto({ configIniziale, onSalvato }: Props) {
  const { user } = useAuth();
  const [config, setConfig] = useState<MotoConfig>(configIniziale);
  const [salvato, setSalvato] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function cambiaTipo(tipo: TipoMoto) {
    const validi = ACCESSORI_PER_TIPO[tipo].map((a) => a.id);
    setConfig((c) => ({ ...c, tipo, accessori: c.accessori.filter((a) => validi.includes(a)) }));
    setSalvato(false);
  }

  function toggleAccessorio(id: string) {
    setConfig((c) => ({
      ...c,
      accessori: c.accessori.includes(id)
        ? c.accessori.filter((a) => a !== id)
        : [...c.accessori, id],
    }));
    setSalvato(false);
  }

  async function salva() {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    setSalvando(true);
    try {
      await supabase.from('profiles').update({
        moto_tipo: config.tipo,
        moto_colore_primario: config.colorePrimario,
        moto_colore_secondario: config.coloreSecondario,
        moto_accessori: config.accessori,
      }).eq('id', user.id);
      setSalvato(true);
      onSalvato?.(config);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Preview moto su sfondo scuro */}
      <div className="flex items-center justify-center rounded-app-lg bg-asfalto py-4 px-6 shadow-app">
        <MotoSVG
          tipo={config.tipo}
          colorePrimario={config.colorePrimario}
          coloreSecondario={config.coloreSecondario}
          accessori={config.accessori}
          className="w-full max-w-sm"
        />
      </div>

      {/* Selezione tipo */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Tipo di moto</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TIPI.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => cambiaTipo(t.id)}
              className={`tap rounded-app border-2 p-2.5 text-left transition-colors ${
                config.tipo === t.id
                  ? 'border-segnale bg-segnale/10'
                  : 'border-asfalto/12 hover:border-asfalto/25'
              }`}
            >
              <span className="text-lg">{t.emoji}</span>
              <p className="mt-0.5 font-mono text-xs font-medium uppercase">{t.label}</p>
              <p className="font-mono text-[10px] text-asfalto/50 leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Colori */}
      <div className="flex flex-wrap gap-5">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Colore principale</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.colorePrimario}
              onChange={(e) => { setConfig((c) => ({ ...c, colorePrimario: e.target.value })); setSalvato(false); }}
              className="h-10 w-10 cursor-pointer rounded-app border border-asfalto/20"
            />
            <span className="font-mono text-xs uppercase text-asfalto/60">{config.colorePrimario}</span>
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Colore dettagli</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.coloreSecondario}
              onChange={(e) => { setConfig((c) => ({ ...c, coloreSecondario: e.target.value })); setSalvato(false); }}
              className="h-10 w-10 cursor-pointer rounded-app border border-asfalto/20"
            />
            <span className="font-mono text-xs uppercase text-asfalto/60">{config.coloreSecondario}</span>
          </div>
        </div>
      </div>

      {/* Accessori */}
      {ACCESSORI_PER_TIPO[config.tipo].length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-asfalto/50">Accessori</p>
          <div className="flex flex-wrap gap-2">
            {ACCESSORI_PER_TIPO[config.tipo].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAccessorio(a.id)}
                className={`tap rounded-app border px-3 py-1.5 font-mono text-xs font-medium uppercase ${
                  config.accessori.includes(a.id)
                    ? 'border-bosco bg-bosco/10 text-bosco'
                    : 'border-asfalto/15 text-asfalto/50 hover:border-asfalto/30'
                }`}
              >
                {a.emoji} {config.accessori.includes(a.id) ? '✓ ' : ''}{a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tasto salva */}
      <button
        type="button"
        onClick={salva}
        disabled={salvando || salvato}
        className={`tap w-full rounded-app py-3 font-mono font-medium uppercase transition-colors ${
          salvato
            ? 'bg-bosco/15 text-bosco'
            : 'bg-segnale text-asfalto hover:bg-asfalto hover:text-cemento disabled:opacity-60'
        }`}
      >
        {salvato ? '✓ Moto salvata nel garage' : salvando ? 'Salvo…' : 'Salva la mia moto'}
      </button>
    </div>
  );
}
