'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GarageMoto } from '@/lib/garage';
import { posizioneCameraReelGarage, REEL_GARAGE_LOOK_AT } from '@/lib/reel-garage-camera';
import { catturaESalvaVetrina } from '@/lib/garage-vetrina-client';
import { attendiFrameRender } from '@/lib/vetrina-immagine';
import { useFeedback } from '@/components/FeedbackProvider';

interface Props {
  moto: GarageMoto[];
  selezionataId: string | null;
  onSeleziona: (id: string) => void;
  modalitaViewer?: boolean;
  modalitaHero?: boolean;
  modalitaReel?: boolean;
  motoIdVetrina?: string | null;
  onVetrinaSalvata?: () => void;
}

function posizioniMoto(numero: number): THREE.Vector3[] {
  if (numero <= 1) return [new THREE.Vector3(0, 0, 0)];
  if (numero === 2) return [new THREE.Vector3(-2.2, 0, 0.25), new THREE.Vector3(2.2, 0, 0.25)];
  return [
    new THREE.Vector3(0, 0, -0.35),
    new THREE.Vector3(-3.2, 0, 1.1),
    new THREE.Vector3(3.2, 0, 1.1),
    new THREE.Vector3(-1.9, 0, 3.4),
    new THREE.Vector3(1.9, 0, 3.4),
  ].slice(0, numero);
}

function box(
  scene: THREE.Scene,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
  roughness = 0.75,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.2 }),
  );
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

function creaInsegna(testo: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '900 122px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ef1b24';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#ef1b24';
  ctx.fillText(testo, 512, 112);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6.8, 1.45, 1);
  sprite.position.set(0, 4.8, -5.82);
  return sprite;
}

function preparaModello(root: THREE.Group, index: number, posizione: THREE.Vector3, moto: GarageMoto) {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 3.2 / Math.max(size.x, size.z, 0.001);
  root.scale.setScalar(scale);
  const normalizzato = new THREE.Box3().setFromObject(root);
  const centro = normalizzato.getCenter(new THREE.Vector3());
  root.position.set(
    posizione.x - centro.x,
    posizione.y - normalizzato.min.y,
    posizione.z - centro.z,
  );
  root.rotation.y = index % 2 === 0 ? -0.14 : 0.14;
  root.name = `moto:${moto.id}`;
  root.userData.motoId = moto.id;

  root.traverse((object) => {
    object.userData.motoId = moto.id;
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materiali = Array.isArray(object.material) ? object.material : [object.material];
    materiali.forEach((materiale, materialeIndex) => {
      if (!(materiale instanceof THREE.MeshStandardMaterial)) return;
      const nome = `${object.name} ${materiale.name}`.toLowerCase();
      const escluso = /wheel|tyre|tire|glass|chrome|metal|engine|disc|chain/.test(nome);
      if (!escluso && materiale.metalness < 0.72) {
        materiale.color.set(materialeIndex % 2 === 0
          ? moto.colore_primario || '#d91414'
          : moto.colore_secondario || '#17191d');
      }
      materiale.needsUpdate = true;
    });
  });
}

export default function Garage3D({ moto, selezionataId, onSeleziona, modalitaViewer = false, modalitaHero = false, modalitaReel = false, motoIdVetrina = null, onVetrinaSalvata }: Props) {
  const { toast } = useFeedback();
  const contenitoreRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const ambienteRef = useRef<THREE.Object3D[]>([]);
  const controlliRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gruppiRef = useRef(new Map<string, THREE.Group>());
  const [autoRotate, setAutoRotate] = useState(false);
  const [caricati, setCaricati] = useState(0);
  const [falliti, setFalliti] = useState(0);
  const [salvaVetrina, setSalvaVetrina] = useState(false);
  const [cameraSpostata, setCameraSpostata] = useState(modalitaViewer);

  const pronte = moto.filter((item) => item.stato === 'pronto' && item.glb_url);
  const sfondoBianco = modalitaViewer;
  const mostraVetrina = (modalitaViewer || modalitaHero) && !modalitaReel && caricati > 0;

  useEffect(() => {
    const host = contenitoreRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sfondoBianco ? 0xffffff : 0x07090d);
    scene.fog = sfondoBianco ? null : new THREE.Fog(0x07090d, 12, 28);
    sceneRef.current = scene;
    ambienteRef.current = [];

    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
    camera.position.set(7.8, 4.5, 9.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = sfondoBianco ? 1.05 : 1.15;
    renderer.setClearColor(sfondoBianco ? 0xffffff : 0x07090d, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = true;
    controls.minDistance = 2.5;
    controls.maxDistance = modalitaViewer ? 14 : 22;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 1.15, 0);
    controlliRef.current = controls;
    controls.addEventListener('start', () => setCameraSpostata(true));

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e8e8, sfondoBianco ? 2.2 : 1.15));
    const key = new THREE.SpotLight(0xffffff, sfondoBianco ? 95 : 115, 32, Math.PI / 5.5, 0.55, 1.3);
    key.position.set(2.5, 8.5, 5.5);
    key.target.position.set(0, 0.8, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key, key.target);
    const red = new THREE.PointLight(0xe61c28, sfondoBianco ? 8 : 42, 13, 1.7);
    red.position.set(-5, 2.7, 0);
    scene.add(red);
    const white = new THREE.PointLight(0xdce9ff, sfondoBianco ? 12 : 22, 14, 1.7);
    white.position.set(5, 3.4, 1.5);
    scene.add(white);

    if (!sfondoBianco) {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30, 30, 30),
        new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.64, metalness: 0.22 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      ambienteRef.current.push(floor);
      const grid = new THREE.GridHelper(28, 28, 0x32363b, 0x24272b);
      grid.position.y = 0.006;
      scene.add(grid);
      ambienteRef.current.push(grid);
    }

    if (!sfondoBianco) {
      ambienteRef.current.push(
        box(scene, [15, 7, 0.3], [0, 3.35, -6], 0x101216),
        box(scene, [0.3, 7, 14], [-7.4, 3.35, 0], 0x0c0e12),
        box(scene, [5.5, 0.85, 1.05], [-3.9, 1.05, -5.2], 0x272a2e),
        box(scene, [5.8, 0.12, 1.2], [-3.9, 1.52, -5.15], 0x7c2025, 0.42),
        box(scene, [3.2, 4.3, 0.55], [4.8, 2.15, -5.45], 0x181b20),
      );
      for (let y = 0.75; y < 4; y += 1.05) {
        ambienteRef.current.push(box(scene, [3, 0.08, 0.8], [4.8, y, -5.1], 0x3d4249, 0.38));
      }
      for (let i = 0; i < 3; i += 1) {
        const tire = new THREE.Mesh(
          new THREE.TorusGeometry(0.58, 0.18, 18, 42),
          new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.94 }),
        );
        tire.rotation.y = Math.PI / 2;
        tire.position.set(5.2 + (i % 2) * 1.1, 0.76 + Math.floor(i / 2) * 1.1, -4.75);
        tire.castShadow = true;
        scene.add(tire);
        ambienteRef.current.push(tire);
      }
      const sign = creaInsegna('MOTOGARAGE');
      if (sign) {
        scene.add(sign);
        ambienteRef.current.push(sign);
      }
    }

    const loader = new GLTFLoader();
    const posizioni = posizioniMoto(pronte.length);
    let annullato = false;
    gruppiRef.current.clear();
    setCaricati(0);
    setFalliti(0);

    pronte.forEach((item, index) => {
      loader.load(
        item.glb_url!,
        (gltf) => {
          if (annullato) return;
          const root = gltf.scene;
          preparaModello(root, index, posizioni[index], item);
          scene.add(root);
          gruppiRef.current.set(item.id, root);
          setCaricati((value) => value + 1);
        },
        undefined,
        () => {
          if (!annullato) setFalliti((value) => value + 1);
        },
      );
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clicca = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...gruppiRef.current.values()], true)[0];
      const id = hit?.object.userData.motoId as string | undefined;
      if (id) onSeleziona(id);
    };
    renderer.domElement.addEventListener('pointerup', clicca);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      annullato = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerup', clicca);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      ambienteRef.current = [];
      gruppiRef.current.clear();
    };
  }, [modalitaViewer, modalitaHero, onSeleziona, moto]);

  useEffect(() => {
    const controls = controlliRef.current;
    if (!controls) return;
    controls.autoRotate = autoRotate && !modalitaReel;
    controls.autoRotateSpeed = 1.4;
  }, [autoRotate, modalitaReel]);

  /** Reel GLB: sync frame Playwright */
  useEffect(() => {
    if (!modalitaReel || !modalitaHero || caricati === 0) return;
    const controls = controlliRef.current;
    if (!controls) return;
    controls.enabled = false;
    const target = new THREE.Vector3(REEL_GARAGE_LOOK_AT.x, REEL_GARAGE_LOOK_AT.y + 0.65, REEL_GARAGE_LOOK_AT.z);
    controls.target.copy(target);

    function onFrame(e: Event) {
      const cam = cameraRef.current;
      if (!cam) return;
      const { frame, total } = (e as CustomEvent<{ frame: number; total: number }>).detail;
      const t = total <= 1 ? 0 : frame / (total - 1);
      const pos = posizioneCameraReelGarage(t);
      cam.position.set(pos.x + target.x, pos.y + target.y, pos.z + target.z);
      cam.lookAt(target);
    }

    window.addEventListener('reel-garage-frame', onFrame);
    return () => window.removeEventListener('reel-garage-frame', onFrame);
  }, [modalitaReel, modalitaHero, caricati]);

  useEffect(() => {
    const id = selezionataId;
    const controls = controlliRef.current;
    const camera = cameraRef.current;
    if (!id || !controls || !camera) return;
    const gruppo = gruppiRef.current.get(id);
    if (!gruppo) return;
    const bounds = new THREE.Box3().setFromObject(gruppo);
    const target = bounds.getCenter(new THREE.Vector3());
    target.y = Math.max(0.8, target.y);
    controls.target.copy(target);
    const direzione = new THREE.Vector3(1.2, 0.55, 1.4).normalize();
    camera.position.copy(target.clone().add(direzione.multiplyScalar(modalitaViewer ? 5.2 : 6.6)));
    controls.update();
  }, [selezionataId, caricati, modalitaViewer]);

  function resetCamera() {
    const camera = cameraRef.current;
    const controls = controlliRef.current;
    if (!camera || !controls) return;
    camera.position.set(7.8, 4.5, 9.2);
    controls.target.set(0, 1.15, 0);
    controls.update();
  }

  async function fullscreen() {
    const host = contenitoreRef.current;
    if (!host) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await host.requestFullscreen();
  }

  async function screenshotVetrina() {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlliRef.current;
    const id = motoIdVetrina ?? selezionataId;
    if (!renderer || !scene || !camera || !id || salvaVetrina) return;

    setSalvaVetrina(true);
    await attendiFrameRender();
    const prevBg = scene.background;
    const prevClear = new THREE.Color();
    renderer.getClearColor(prevClear);
    const prevAlpha = renderer.getClearAlpha();
    const ambienteVisibile = ambienteRef.current.map((oggetto) => oggetto.visible);
    try {
      if (!sfondoBianco) {
        ambienteRef.current.forEach((oggetto) => { oggetto.visible = false; });
      }
      scene.background = new THREE.Color(0xffffff);
      renderer.setClearColor(0xffffff, 1);
      controls?.update();
      renderer.render(scene, camera);

      const esito = await catturaESalvaVetrina(renderer.domElement, id);
      if (esito.ok) {
        onVetrinaSalvata?.();
        toast('Vetrina salvata — visibile nell\'hub');
      } else if (esito.messaggio) toast(esito.messaggio, 'errore');
    } finally {
      scene.background = prevBg;
      renderer.setClearColor(prevClear, prevAlpha);
      ambienteRef.current.forEach((oggetto, index) => {
        oggetto.visible = ambienteVisibile[index];
      });
      controls?.update();
      renderer.render(scene, camera);
      setSalvaVetrina(false);
    }
  }

  const idVetrina = motoIdVetrina ?? selezionataId;
  const vetrinaPronta = modalitaViewer || cameraSpostata;
  const chipClass = sfondoBianco
    ? 'rounded-full border border-black/10 bg-white/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-asfalto/70 backdrop-blur'
    : 'rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 backdrop-blur';
  const btnClass = sfondoBianco
    ? 'rounded-full border border-black/15 bg-white/90 px-3 py-2 font-mono text-[10px] font-bold uppercase text-asfalto/75 backdrop-blur'
    : 'rounded-full border border-white/15 bg-black/55 px-3 py-2 font-mono text-[10px] font-bold uppercase text-white/70 backdrop-blur';

  return (
    <div className={`relative h-full w-full overflow-hidden ${
      modalitaHero && !sfondoBianco
        ? 'min-h-0 bg-transparent'
        : sfondoBianco
          ? 'min-h-0 bg-white'
          : 'min-h-[460px] bg-black sm:min-h-[580px]'
    }`}>
      <div ref={contenitoreRef} className="absolute inset-0" aria-label="Garage virtuale 3D interattivo" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className={chipClass}>
          Trascina · zoom · pan · seleziona
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          {mostraVetrina && idVetrina && (
            <button
              type="button"
              onClick={screenshotVetrina}
              disabled={salvaVetrina}
              title={vetrinaPronta ? 'Salva screenshot vetrina' : 'Ruota la camera per sbloccare lo screenshot'}
              className={`vetrina-btn ${vetrinaPronta ? 'vetrina-btn-pronto' : 'vetrina-btn-ghost'}`}
            >
              {salvaVetrina ? 'Salvo…' : 'Screenshot Vetrina'}
            </button>
          )}
          <button type="button" onClick={() => setAutoRotate((value) => !value)} className={`${btnClass} ${autoRotate ? '!border-red-500 !bg-red-500 !text-white' : ''}`}>
            Auto
          </button>
          <button type="button" onClick={resetCamera} className={btnClass}>
            Reset
          </button>
          <button type="button" onClick={fullscreen} className={btnClass}>
            Fullscreen
          </button>
        </div>
      </div>

      {pronte.length > 0 && caricati < pronte.length && (
        <div className={`pointer-events-none absolute inset-0 grid place-items-center ${sfondoBianco ? 'bg-white/40' : 'bg-black/25'}`}>
          <div className={`rounded-full border px-5 py-3 font-mono text-xs uppercase tracking-wide backdrop-blur ${sfondoBianco ? 'border-black/10 bg-white/90 text-asfalto/70' : 'border-white/10 bg-black/70 text-white/70'}`}>
            Caricamento moto {caricati}/{pronte.length}
          </div>
        </div>
      )}

      {falliti > 0 && (
        <p className="absolute bottom-3 left-3 rounded-app bg-red-950/80 px-3 py-2 font-mono text-[10px] uppercase text-red-200">
          {falliti} modello non disponibile
        </p>
      )}
    </div>
  );
}
