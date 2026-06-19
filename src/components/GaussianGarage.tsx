'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GarageMoto } from '@/lib/garage';
import { urlModello } from '@/lib/garage';

interface Props {
  moto: GarageMoto[];
  selezionataId?: string | null;
  modalitaViewer?: boolean;
}

function posizione(index: number, totale: number): [number, number, number] {
  if (totale === 1) return [0, 0, 0];
  if (totale === 2) return index === 0 ? [-1.45, 0, 0] : [1.45, 0, 0];
  const posizioni: Array<[number, number, number]> = [
    [0, 0, -0.6],
    [-2.6, 0, 1],
    [2.6, 0, 1],
    [-1.4, 0, 3],
    [1.4, 0, 3],
  ];
  return posizioni[index] ?? [0, 0, index * 1.8];
}

export default function GaussianGarage({ moto, selezionataId, modalitaViewer = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);

  const scene = useMemo(() => {
    const pronte = moto.filter((item) => item.stato === 'pronto' && urlModello(item));
    if (modalitaViewer && selezionataId) {
      const scelta = pronte.find((item) => item.id === selezionataId);
      return scelta ? [scelta] : pronte.slice(0, 1);
    }
    return pronte.slice(0, 5);
  }, [moto, selezionataId, modalitaViewer]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || scene.length === 0) return;
    let annullato = false;
    let viewer: import('@mkkellogg/gaussian-splats-3d').Viewer | null = null;

    async function avvia() {
      try {
        setCaricamento(true);
        setErrore(null);
        const GaussianSplats3D = await import('@mkkellogg/gaussian-splats-3d');
        if (annullato || !host) return;

        viewer = new GaussianSplats3D.Viewer({
          rootElement: host,
          cameraUp: [0, -1, -0.6],
          initialCameraPosition: [0, -4.2, 4.8],
          initialCameraLookAt: [0, 0, 0],
          sharedMemoryForWorkers: false,
          gpuAcceleratedSort: false,
          ignoreDevicePixelRatio: window.devicePixelRatio > 1.5,
          integerBasedSort: false,
          halfPrecisionCovariancesOnGPU: true,
          sphericalHarmonicsDegree: 0,
          inMemoryCompressionLevel: 1,
          dynamicScene: scene.length > 1,
        });

        await viewer.addSplatScenes(scene.map((item, index) => {
          const format = item.model_format === 'ksplat'
            ? GaussianSplats3D.SceneFormat.KSplat
            : item.model_format === 'splat'
              ? GaussianSplats3D.SceneFormat.Splat
              : GaussianSplats3D.SceneFormat.Ply;
          const [x, y, z] = posizione(index, scene.length);
          const scala = scene.length === 1 ? 1.7 : 1.15;
          return {
            path: urlModello(item)!,
            format,
            splatAlphaRemovalThreshold: 5,
            showLoadingUI: false,
            progressiveLoad: false,
            position: [x, y, z],
            rotation: [0, 0, 0, 1],
            scale: [scala, scala, scala],
          };
        }));
        if (annullato) return;
        viewer.start();
        setCaricamento(false);
      } catch (error) {
        if (!annullato) {
          setCaricamento(false);
          setErrore(error instanceof Error ? error.message : 'Non riesco a caricare il Gaussian Splat.');
        }
      }
    }

    avvia();
    return () => {
      annullato = true;
      viewer?.dispose();
      host.replaceChildren();
    };
  }, [scene]);

  async function fullscreen() {
    const host = hostRef.current;
    if (!host) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.requestFullscreen();
  }

  return (
    <div className="relative h-full min-h-[460px] w-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.16),transparent_30%),#030405] sm:min-h-[580px]">
      <div ref={hostRef} className="absolute inset-0" aria-label="Viewer Gaussian Splat 3D interattivo" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <span className="rounded-full border border-white/10 bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/65 backdrop-blur">
          Gaussian Splat · trascina · zoom · pan
        </span>
        <button type="button" onClick={fullscreen} className="pointer-events-auto rounded-full border border-white/15 bg-black/60 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white/75 backdrop-blur">
          Fullscreen
        </button>
      </div>
      {caricamento && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
          <p className="rounded-full border border-white/10 bg-black/70 px-5 py-3 font-mono text-xs uppercase tracking-wide text-white/70 backdrop-blur">
            Caricamento gemello digitale…
          </p>
        </div>
      )}
      {errore && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <p className="max-w-md rounded-app border border-red-500/30 bg-red-950/80 p-4 text-sm text-red-100">{errore}</p>
        </div>
      )}
    </div>
  );
}
