'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GarageMoto } from '@/lib/garage';
import { urlModello } from '@/lib/garage';
import { posizioneCameraReelGarage, REEL_GARAGE_LOOK_AT } from '@/lib/reel-garage-camera';
import { catturaESalvaVetrina } from '@/lib/garage-vetrina-client';

interface Props {
  moto: GarageMoto[];
  selezionataId?: string | null;
  modalitaViewer?: boolean;
  modalitaHero?: boolean;
  /** Cattura reel: camera più lontana, moto intera in frame */
  modalitaReel?: boolean;
  motoIdVetrina?: string | null;
  onVetrinaSalvata?: () => void;
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

function disabilitaTastieraViewer(viewer: import('@mkkellogg/gaussian-splats-3d').Viewer) {
  const v = viewer as import('@mkkellogg/gaussian-splats-3d').Viewer & {
    perspectiveControls?: { stopListenToKeyEvents?: () => void };
    orthographicControls?: { stopListenToKeyEvents?: () => void };
  };
  for (const ctrl of [v.perspectiveControls, v.orthographicControls]) {
    ctrl?.stopListenToKeyEvents?.();
  }
}

export default function GaussianGarage({ moto, selezionataId, modalitaViewer = false, modalitaHero = false, modalitaReel = false, motoIdVetrina = null, onVetrinaSalvata }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import('@mkkellogg/gaussian-splats-3d').Viewer | null>(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  const [salvaVetrina, setSalvaVetrina] = useState(false);

  const scene = useMemo(() => {
    const pronte = moto.filter((item) => item.stato === 'pronto' && urlModello(item));
    if ((modalitaViewer || modalitaHero) && selezionataId) {
      const scelta = pronte.find((item) => item.id === selezionataId);
      return scelta ? [scelta] : pronte.slice(0, 1);
    }
    return pronte.slice(0, 5);
  }, [moto, selezionataId, modalitaViewer, modalitaHero]);

  const sceneKey = useMemo(
    () => scene.map((item) => `${item.id}:${item.updated_at}:${urlModello(item)}`).join('|'),
    [scene],
  );

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

        const hero = modalitaHero && scene.length === 1;
        const reel = hero && modalitaReel;
        viewer = new GaussianSplats3D.Viewer({
          rootElement: host,
          cameraUp: [0, -1, -0.6],
          initialCameraPosition: reel ? [6.2, -4.35, 0.12] : hero ? [0, -2.4, 2.6] : [0, -4.2, 4.8],
          initialCameraLookAt: reel ? [0, 0.38, 0] : [0, 0, 0],
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
          const scala = reel ? 2.85 : hero ? 3.4 : scene.length === 1 ? 1.7 : 1.15;
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
        disabilitaTastieraViewer(viewer);
        viewerRef.current = viewer;
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
      viewerRef.current = null;
      viewer?.dispose();
      host.replaceChildren();
    };
  }, [sceneKey, modalitaHero, modalitaReel]);

  /** Reel: camera guidata da evento frame (sync Playwright) */
  useEffect(() => {
    if (!modalitaReel || caricamento) return;
    const target = REEL_GARAGE_LOOK_AT;

    function onFrame(e: Event) {
      const { frame, total } = (e as CustomEvent<{ frame: number; total: number }>).detail;
      const t = total <= 1 ? 0 : frame / (total - 1);
      const viewer = viewerRef.current as import('@mkkellogg/gaussian-splats-3d').Viewer & {
        camera: import('three').PerspectiveCamera;
        perspectiveControls?: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
      } | null;
      if (!viewer?.camera) return;

      const cam = viewer.camera;
      const controls = viewer.perspectiveControls;
      if (controls) {
        controls.enabled = false;
        controls.target.set(target.x, target.y, target.z);
      }

      const pos = posizioneCameraReelGarage(t);
      cam.position.set(pos.x, pos.y, pos.z);
      cam.lookAt(target.x, target.y, target.z);
      controls?.update();
    }

    window.addEventListener('reel-garage-frame', onFrame);
    return () => window.removeEventListener('reel-garage-frame', onFrame);
  }, [modalitaReel, caricamento]);

  async function fullscreen() {
    const host = hostRef.current;
    if (!host) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.requestFullscreen();
  }

  async function screenshotVetrina() {
    const canvas = hostRef.current?.querySelector('canvas');
    const id = motoIdVetrina ?? selezionataId ?? scene[0]?.id;
    if (!canvas || !id || salvaVetrina) return;
    setSalvaVetrina(true);
    try {
      const esito = await catturaESalvaVetrina(canvas, id);
      if (esito.ok) onVetrinaSalvata?.();
      else if (esito.messaggio) window.alert(esito.messaggio);
    } finally {
      setSalvaVetrina(false);
    }
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${modalitaHero ? 'min-h-0 bg-transparent' : 'min-h-[460px] bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.16),transparent_30%),#0F0B0A] sm:min-h-[580px]'}`}>
      <div ref={hostRef} className="absolute inset-0" aria-label="Viewer 3D interattivo" />
      {!modalitaHero && (
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-end gap-3 p-3">
        {modalitaViewer && (motoIdVetrina ?? selezionataId ?? scene[0]?.id) && (
          <button
            type="button"
            onClick={screenshotVetrina}
            disabled={salvaVetrina || caricamento}
            className="pointer-events-auto rounded-full border border-brand/40 bg-brand/90 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white backdrop-blur disabled:opacity-60"
          >
            {salvaVetrina ? 'Salvo…' : 'Screenshot Vetrina'}
          </button>
        )}
        <button type="button" onClick={fullscreen} className="pointer-events-auto rounded-full border border-white/15 bg-black/60 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white/75 backdrop-blur">
          Fullscreen
        </button>
      </div>
      )}
      {caricamento && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
          <p className="rounded-full border border-white/10 bg-black/70 px-5 py-3 font-mono text-xs uppercase tracking-wide text-white/70 backdrop-blur">
            Caricamento avatar 3D…
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
