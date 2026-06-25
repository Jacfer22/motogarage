import { chromium } from 'playwright';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fillTemplate } from './render-social.mjs';
import { MASCOTS, mascotFrameState } from './tour.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE = join(__dirname, '..', 'templates', 'tour-app-video-scene.html');

/** Scene del video: cattura app reale + mascotte */
export const APP_TOUR_SCENES = [
  {
    id: '01-landing',
    step: '1 di 7',
    mascot: 'rosso',
    feature: 'Benvenuto',
    headline: 'Parti forte',
    caption: 'Siamo <strong>Rosso, Blu e Nero</strong>. Ti facciamo vedere l\'app mentre navighi — swipe e scopri tutto.',
    path: '/',
    lato: 'destra',
    sec: 4.5,
    setup: async (page) => {
      await page.waitForSelector('h1', { timeout: 30000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(600);
    },
    animate: async (page, frame, total) => {
      const scrollMax = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
      const y = (frame / Math.max(total - 1, 1)) * Math.min(scrollMax, 420);
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    },
  },
  {
    id: '02-itinerari',
    step: '2 di 7',
    mascot: 'blu',
    feature: 'Itinerari',
    headline: 'Route pronte',
    caption: 'Dolomiti, mare, Appennino. <strong>Itinerari verificati</strong> — tu metti il casco, noi la mappa.',
    path: '/itinerari',
    lato: 'sinistra',
    sec: 4,
    setup: async (page) => {
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(800);
    },
    animate: async (page, frame, total) => {
      const y = (frame / Math.max(total - 1, 1)) * 380;
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    },
  },
  {
    id: '03-naviga',
    step: '3 di 7',
    mascot: 'blu',
    feature: 'Navigatore',
    headline: 'Naviga in moto',
    caption: 'Destinazione inserita, <strong>prossima manovra</strong> chiara. Pensato per chi guida, non per l\'auto.',
    path: '/reel/nav',
    lato: 'destra',
    sec: 5,
    waitFor: '[data-reel-nav-ready="true"]',
    setup: async (page) => {
      await page.waitForSelector('[data-reel-nav-ready="true"]', { timeout: 90000 });
      await page.waitForTimeout(500);
    },
    animate: async (page, frame, total) => {
      await page.evaluate(
        ({ f, t }) => window.dispatchEvent(new CustomEvent('reel-nav-frame', { detail: { frame: f, total: t } })),
        { f: frame, t: total },
      );
    },
  },
  {
    id: '04-garage',
    step: '4 di 7',
    mascot: 'nero',
    feature: 'Garage 3D',
    headline: 'La tua moto in 3D',
    caption: 'Avatar <strong>3D personalizzato</strong> nel garage. Ruota, screenshot vetrina, flex in hub.',
    path: '/reel/garage',
    proof: '/reels/scenes/04-garage-3d-proof.png',
    proofFallback: '/reels/scenes/03-garage-3d-proof.png',
    lato: 'sinistra',
    sec: 5,
    waitFor: '[aria-label="Viewer 3D interattivo"]',
    setup: async (page) => {
      await page.waitForSelector('[aria-label="Viewer 3D interattivo"]', { timeout: 45000 });
      await page.waitForFunction(() => !document.body.innerText.includes('Caricamento avatar'), { timeout: 45000 }).catch(() => {});
      await page.waitForTimeout(500);
    },
    animate: async (page, frame, total) => {
      await page.evaluate(
        ({ f, t }) => window.dispatchEvent(new CustomEvent('reel-garage-frame', { detail: { frame: f, total: t } })),
        { f: frame, t: total },
      );
    },
  },
  {
    id: '05-traccia',
    step: '5 di 7',
    mascot: 'rosso',
    feature: 'Traccia GPS',
    headline: 'Registra il giro',
    caption: 'Accendi, parti, chiudi. <strong>Km, curve e tracciato</strong> live — poi card TikTok pronta.',
    path: '/traccia',
    proof: '/reels/scenes/03-traccia-proof.png',
    lato: 'destra',
    sec: 4,
    setup: async (page) => {
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(600);
    },
    animate: async (page, frame, total) => {
      const y = (frame / Math.max(total - 1, 1)) * 80;
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    },
  },
  {
    id: '06-community',
    step: '6 di 7',
    mascot: 'nero',
    feature: 'Community',
    headline: 'Community moto',
    caption: 'Giri pubblici, <strong>classifica km</strong>, profili moto. Chi capisce perché hai la tua in garage.',
    path: '/community',
    lato: 'sinistra',
    sec: 4,
    setup: async (page) => {
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(900);
    },
    animate: async (page, frame, total) => {
      const y = (frame / Math.max(total - 1, 1)) * 320;
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    },
  },
  {
    id: '07-cta',
    step: '7 di 7',
    mascot: 'blu',
    feature: 'Gratis',
    headline: 'Provalo ora',
    caption: 'Account <strong>gratis</strong>, primo giro in 5 minuti. Link in bio — ci vediamo in curva.',
    path: '/',
    lato: 'destra',
    sec: 4,
    setup: async (page) => {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('h2')].find((n) => n.textContent?.includes('Pronto a partire'));
        el?.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(700);
    },
    animate: async () => {},
  },
];

function dotsHtml(activeIndex, total) {
  return Array.from({ length: total }, (_, i) =>
    `<span class="dot${i === activeIndex ? ' on' : ''}"></span>`,
  ).join('');
}

export function renderAppVideoFrame(step, index, mascotDataUrl, screenDataUrl, progress, totalScenes) {
  const mascot = MASCOTS[step.mascot];
  const state = mascotFrameState(step.mascot, progress);
  const destra = step.lato === 'destra';
  const phoneFloat = Math.sin(progress * Math.PI * 4) * 4;

  const html = readFileSync(TEMPLATE, 'utf8');
  return fillTemplate(html, {
    STEP_LABEL: step.step,
    HEADLINE: step.headline,
    CAPTION: step.caption,
    FEATURE: step.feature,
    MASCOT_IMG: mascotDataUrl,
    MASCOT_NAME: mascot.name,
    SCREEN_IMG: screenDataUrl,
    DOTS: dotsHtml(index, totalScenes),
    ACCENT_COLOR: mascot.accent,
    ACCENT_DARK: mascot.accentDark,
    GLOW_COLOR: mascot.glow,
    MASCOT_TRANSFORM: `translateX(${state.x * 0.35}px) translateY(${state.y}px) rotate(${state.rotate}deg) scale(${state.scale})`,
    MOTION_BLUR: state.blur > 0.1 ? `blur(${state.blur}px)` : 'blur(0)',
    PHONE_FLOAT: String(phoneFloat),
    BUBBLE_SIDE: destra ? 'destra' : 'sinistra',
    COMIC_ALIGN: destra ? 'flex-start' : 'flex-end',
    COMIC_MARGIN: destra ? '-12px' : '0',
    COMIC_MARGIN_R: destra ? '0' : '-12px',
  });
}

function proofToFrames(root, proofPath, frameCount) {
  const full = join(root, 'public', proofPath.replace(/^\//, ''));
  const buf = readFileSync(full);
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  return Array.from({ length: frameCount }, () => dataUrl);
}

export async function captureScreenFrames(browser, base, scene, framesDir, fps, sec, garageUser, root) {
  mkdirSync(framesDir, { recursive: true });
  const frameCount = Math.ceil(sec * fps);

  if (scene.proof && !scene.path) {
    return proofToFrames(root, scene.proof, frameCount);
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'it-IT',
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  let url = `${base}${scene.path}`;
  if (scene.id === '04-garage') url = `${base}/reel/garage?user=${garageUser}`;
  console.log(`  capture ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (scene.waitFor) await page.waitForSelector(scene.waitFor, { timeout: 60000 });
    if (scene.setup) await scene.setup(page, garageUser);
    await page.waitForTimeout(400);

    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      if (scene.animate) await scene.animate(page, i, frameCount);
      const png = await page.screenshot({ type: 'png' });
      frames.push(`data:image/png;base64,${png.toString('base64')}`);
      await page.waitForTimeout(1000 / fps);
    }
    await context.close();
    return frames;
  } catch (err) {
    await context.close();
    const fallback = scene.proofFallback ?? scene.proof;
    if (fallback) {
      console.warn(`  ⚠ live fallita (${err.message?.slice(0, 60)}…) — uso screenshot ${fallback}`);
      return proofToFrames(root, fallback, frameCount);
    }
    throw err;
  }
}

export async function recordCompositeSegment(step, index, mascotDataUrl, screenFrames, outDir, prefix, fps, sec, totalScenes) {
  mkdirSync(outDir, { recursive: true });
  const total = Math.ceil(sec * fps);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  for (let i = 0; i < total; i++) {
    const progress = i / total;
    const screenIdx = Math.min(Math.floor((i / total) * screenFrames.length), screenFrames.length - 1);
    const html = renderAppVideoFrame(step, index, mascotDataUrl, screenFrames[screenIdx], progress, totalScenes);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mascot-wrap img', { state: 'visible' });
    await page.screenshot({ path: join(outDir, `${prefix}${String(i).padStart(4, '0')}.png`), type: 'png' });
  }

  await browser.close();
}

export function listFrameFiles(dir, prefix) {
  return readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.png'))
    .sort();
}
