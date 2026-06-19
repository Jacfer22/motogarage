'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import GenerazioneProgress from '@/components/GenerazioneProgress';
import CreaGemello from '@/components/CreaGemello';
import MotoSVG from '@/components/MotoSVG';
import type { TipoMoto } from '@/components/MotoSVG';

interface Moto {
  id: string;
  marca: string;
  modello: string;
  anno: number | null;
  stato: string;
  glb_url: string | null;
  foto_sx_url: string | null;
  colore_primario: string;
  colore_secondario: string;
  task_id: string | null;
}

export default function PaginaGarage() {
  const { user, profilo, loading } = useAuth();
  const router = useRouter();
  const [moto, setMoto] = useState<Moto[]>([]);
  const [vista, setVista] = useState<'garage' | 'crea' | 'genera'>('garage');
  const [motoInElaborazione, setMotoInElaborazione] = useState<{ id: string; marca: string; modello: string; anno?: number } | null>(null);
  const [pctReale, setPctReale] = useState<number | null>(null);
  const [completato, setCompletato] = useState(false);
  const [motoSelezionata, setMotoSelezionata] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const garageRef = useRef<ReturnType<typeof avviaGarage3D> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/accedi');
  }, [loading, user, router]);

  const caricaMoto = useCallback(async () => {
    const sb = getSupabaseBrowser();
    if (!sb || !user) return;
    const { data } = await sb.from('moto').select('*').eq('utente_id', user.id).order('created_at', { ascending: false });
    setMoto((data ?? []) as Moto[]);
  }, [user]);

  useEffect(() => { caricaMoto(); }, [caricaMoto]);

  // Polling stato generazione
  useEffect(() => {
    if (!motoInElaborazione) return;
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/genera-moto?motoId=${motoInElaborazione.id}`);
      const json = await res.json();
      if (json.percentuale) setPctReale(json.percentuale);
      if (json.stato === 'pronto') {
        setCompletato(true);
        setPctReale(100);
        clearInterval(pollingRef.current!);
        caricaMoto();
      } else if (json.stato === 'errore') {
        clearInterval(pollingRef.current!);
        caricaMoto();
      }
    }, 8000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [motoInElaborazione, caricaMoto]);

  // Garage 3D Three.js
  useEffect(() => {
    if (vista !== 'garage' || !canvasRef.current) return;
    const cleanup = avviaGarage3D(canvasRef.current, moto, motoSelezionata, (id) => setMotoSelezionata(id));
    return cleanup;
  }, [vista, moto, motoSelezionata]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-14"><div className="skeleton h-8 w-48 rounded-app"/></div>;

  // Vista generazione in corso
  if (vista === 'genera' && motoInElaborazione) {
    return (
      <GenerazioneProgress
        marca={motoInElaborazione.marca}
        modello={motoInElaborazione.modello}
        anno={motoInElaborazione.anno}
        percentualeReale={pctReale}
        completato={completato}
        onApriGarage={() => { setVista('garage'); setMotoInElaborazione(null); setCompletato(false); setPctReale(null); }}
      />
    );
  }

  // Vista crea gemello
  if (vista === 'crea') {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button type="button" onClick={() => setVista('garage')}
          className="mb-6 font-mono text-sm uppercase text-asfalto/50 hover:text-asfalto">← Garage</button>
        <CreaGemello onAvviato={(id, marca, modello, anno) => {
          setMotoInElaborazione({ id, marca, modello, anno });
          setVista('genera');
        }}/>
      </div>
    );
  }

  // Vista garage principale
  const motoSelObj = moto.find(m => m.id === motoSelezionata);

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Header garage */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-segnale">{profilo?.username ?? 'Rider'}</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
            Il mio Garage
          </h1>
        </div>
        <button type="button" onClick={() => setVista('crea')}
          className="tap shrink-0 rounded-app bg-segnale px-5 py-3 font-mono text-sm font-medium uppercase text-asfalto shadow-segnale hover:bg-white">
          ➕ Gemello digitale
        </button>
      </div>

      {/* Canvas 3D garage */}
      <div className="relative mx-4 rounded-app-lg overflow-hidden" style={{ height: 360, background: '#07070e' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }}/>
        {moto.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="font-display text-3xl font-bold uppercase text-cemento/20">Garage vuoto</p>
            <p className="mt-2 font-mono text-sm text-cemento/20">Aggiungi la tua prima moto</p>
          </div>
        )}
        {/* Neon MotoGarage */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="font-display text-base font-bold uppercase tracking-widest"
            style={{ color: '#ff2222', textShadow: '0 0 10px #ff2222, 0 0 20px #ff0000, 0 0 40px #ff0000' }}>
            MOTOGARAGE
          </span>
        </div>
      </div>

      {/* Lista moto */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {moto.length === 0 ? (
          <div className="rounded-app border border-dashed border-asfalto/20 p-10 text-center">
            <p className="font-display text-2xl uppercase tracking-tight text-asfalto/30">Nessuna moto ancora</p>
            <button type="button" onClick={() => setVista('crea')}
              className="tap mt-4 inline-block rounded-app bg-segnale px-6 py-3 font-mono text-sm font-medium uppercase text-asfalto">
              Crea il primo gemello
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {moto.map(m => (
              <div key={m.id}
                onClick={() => setMotoSelezionata(motoSelezionata === m.id ? null : m.id)}
                className={`tap card-app cursor-pointer p-3 transition-all ${motoSelezionata === m.id ? 'border-segnale ring-1 ring-segnale' : ''}`}>
                {/* Preview moto */}
                <div className="rounded-app bg-asfalto p-2 mb-2" style={{ height: 80 }}>
                  {m.glb_url ? (
                    <div className="flex h-full items-center justify-center text-4xl">🏍️</div>
                  ) : (
                    <MotoSVG tipo="naked" colorePrimario={m.colore_primario} coloreSecondario={m.colore_secondario} className="h-full w-full"/>
                  )}
                </div>
                <p className="font-mono text-xs font-medium uppercase truncate">{m.marca} {m.modello}</p>
                {m.anno && <p className="font-mono text-[10px] text-asfalto/50">{m.anno}</p>}
                {/* Badge stato */}
                {m.stato === 'elaborazione' && (
                  <span className="mt-1 inline-block rounded bg-segnale/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-segnale">⏳ In creazione</span>
                )}
                {m.stato === 'pronto' && m.glb_url && (
                  <span className="mt-1 inline-block rounded bg-bosco/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-bosco">✓ 3D pronto</span>
                )}
                {m.stato === 'errore' && (
                  <span className="mt-1 inline-block rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-red-400">⚠ Errore</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dettaglio moto selezionata */}
        {motoSelObj && (
          <div className="mt-4 card-app p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-bold uppercase">{motoSelObj.marca} {motoSelObj.modello}</h3>
                {motoSelObj.anno && <p className="font-mono text-sm text-asfalto/50">{motoSelObj.anno}</p>}
              </div>
              {motoSelObj.stato === 'elaborazione' && motoInElaborazione?.id === motoSelObj.id && (
                <button type="button" onClick={() => setVista('genera')}
                  className="tap rounded-app bg-segnale/20 px-3 py-2 font-mono text-xs uppercase text-segnale hover:bg-segnale hover:text-asfalto">
                  Vedi progresso
                </button>
              )}
              {motoSelObj.glb_url && (
                <a href={motoSelObj.glb_url} download className="tap rounded-app border border-guardrail/30 px-3 py-2 font-mono text-xs uppercase text-asfalto/60 hover:border-segnale hover:text-segnale">
                  Scarica GLB
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Three.js Garage 3D ──────────────────────────────────────────────────────
function avviaGarage3D(canvas: HTMLCanvasElement, moto: Moto[], selezionata: string | null, onSelezione: (id: string) => void) {
  let animId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = (window as any).THREE;
  if (!T) {
    // Carica Three.js dinamicamente
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/three@0.155.0/build/three.min.js';
    s.onload = () => { /* re-trigger via effect */ };
    document.head.appendChild(s);
    return () => {};
  }

  const W = canvas.clientWidth, H = canvas.clientHeight || 360;
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;

  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new T.Scene();
  scene.background = new T.Color(0x07070e);
  scene.fog = new T.FogExp2(0x07070e, 0.08);

  const camera = new T.PerspectiveCamera(45, W / H, 0.1, 60);
  camera.position.set(0, 2.8, 5.5);
  camera.lookAt(0, 0.5, 0);

  // Luci garage
  scene.add(new T.AmbientLight(0x223355, 0.5));
  const key = new T.SpotLight(0xfff0dd, 3.5, 14, 0.4, 0.5);
  key.position.set(0, 6, 2); key.castShadow = true;
  scene.add(key);
  const rimL = new T.PointLight(0xff2200, 1.5, 10);
  rimL.position.set(-4, 2, -2); scene.add(rimL);
  const rimR = new T.PointLight(0x0033ff, 1.0, 10);
  rimR.position.set(4, 1.5, -1); scene.add(rimR);

  // Pavimento industriale lucido
  const floor = new T.Mesh(new T.PlaneGeometry(18, 14),
    new T.MeshStandardMaterial({ color: 0x080810, roughness: 0.06, metalness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  // Griglia pavimento
  scene.add(new T.GridHelper(18, 28, 0x1a1a33, 0x0e0e1a));

  // Pareti laterali (dark)
  const wallMat = new T.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.9 });
  [-6, 6].forEach(x => {
    const w = new T.Mesh(new T.PlaneGeometry(14, 5), wallMat);
    w.position.set(x, 2.5, -4); w.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(w);
  });
  // Parete posteriore
  const wb = new T.Mesh(new T.PlaneGeometry(18, 5), wallMat);
  wb.position.set(0, 2.5, -7); scene.add(wb);

  // Striscia LED neon rossa (sopra, posteriore)
  const ledMat = new T.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
  const led = new T.Mesh(new T.BoxGeometry(12, 0.08, 0.08), ledMat);
  led.position.set(0, 4.8, -6.8); scene.add(led);

  // Moto placeholder (SVG → canvas texture o geometria semplice)
  // Per ogni moto, crea un gruppo a posizioni calcolate
  const posizioni = moto.length === 1 ? [[0]] :
    moto.length === 2 ? [[-1.5], [1.5]] :
    moto.length >= 3 ? moto.map((_, i) => [(i - (moto.length - 1) / 2) * 2.0]) : [];

  moto.forEach((m, i) => {
    const g = new T.Group();
    const bodyMat = new T.MeshPhysicalMaterial({
      color: parseInt((m.colore_primario ?? '#CC0000').replace('#', ''), 16),
      clearcoat: 1.0, clearcoatRoughness: 0.05, metalness: 0, roughness: 0.08,
    });
    const darkMat = new T.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.4 });
    const chromeMat = new T.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.05 });

    // Sagoma moto semplice
    const body = new T.Mesh(new T.BoxGeometry(0.22, 0.16, 0.5), bodyMat);
    body.position.set(0, 0.58, 0); body.castShadow = true; g.add(body);

    // Ruote
    [0.55, -0.55].forEach(z => {
      const wg = new T.Group();
      wg.add(new T.Mesh(new T.TorusGeometry(0.28, 0.08, 8, 24), new T.MeshStandardMaterial({ color: 0x111, roughness: 0.9 })));
      wg.add(new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.055, 20), chromeMat));
      wg.rotation.y = Math.PI / 2; wg.position.set(0, 0.28, z); g.add(wg);
    });

    const px = posizioni[i]?.[0] ?? 0;
    g.position.set(px, 0, 0);

    // Highlight se selezionata
    if (m.id === selezionata) {
      const halo = new T.SpotLight(0xffaa00, 4, 6, 0.3, 0.5);
      halo.position.set(px, 4, 1);
      halo.target.position.set(px, 0, 0);
      scene.add(halo); scene.add(halo.target);
    }

    scene.add(g);
  });

  // Auto-rotate camera
  let angle = 0;
  let drag = false, prevX = 0;
  canvas.addEventListener('mousedown', e => { drag = true; prevX = e.clientX; });
  canvas.addEventListener('mouseup', () => { drag = false; });
  canvas.addEventListener('mousemove', e => { if (drag) { angle += (e.clientX - prevX) * 0.005; prevX = e.clientX; } });

  function animate() {
    animId = requestAnimationFrame(animate);
    if (!drag) angle += 0.003;
    camera.position.x = Math.sin(angle) * 5.5;
    camera.position.z = Math.cos(angle) * 5.5;
    camera.lookAt(0, 0.5, 0);
    renderer.render(scene, camera);
  }
  animate();

  return () => {
    cancelAnimationFrame(animId);
    renderer.dispose();
  };
}
