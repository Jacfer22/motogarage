/**
 * MotoGarage marketing reel — mobile capture, iPhone frame, NO destructive motion.
 * npm run reel
 */
import { chromium, devices } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import pkg from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, readFileSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'reels');
const SCENES_DIR = join(OUT_DIR, 'scenes');
const ASSETS_DIR = join(OUT_DIR, 'assets');
const FINAL = join(OUT_DIR, 'motogarage-instagram-reel-v2.mp4');
const FRAME_SVG = join(ASSETS_DIR, 'iphone-17-pro-frame.svg');
const FRAME_PNG = join(ASSETS_DIR, 'iphone-17-pro-frame.png');
const LOGO_SPLASH = join(ASSETS_DIR, 'logo-splash.html');
const LOGO_OUTRO = join(ASSETS_DIR, 'logo-outro.html');

const W = 1080;
const H = 1920;
const FPS = 30;
const SCENE_SEC_DEFAULT = 6;

/** Ritmo ~30s */
const SCENE_DURATIONS = {
  '00-logo': 3,
  '01-landing': 3.5,
  '02-navigator': 15,
  '03-garage-3d': 5.5,
  '06-logo-outro': 2.5,
};

/** Transizioni morbide, più lunghe sul passaggio nav → garage → outro */
const SCENE_CUTS = [
  { type: 'fade', dur: 0.35 },
  { type: 'smoothleft', dur: 0.4 },
  { type: 'distance', dur: 0.55 },
  { type: 'fadeblack', dur: 0.48 },
];

const HERO_SCENES = new Set(['02-navigator', '03-garage-3d']);
const NO_POSTFX_SCENES = new Set(['00-logo', '01-landing', '02-navigator', '03-garage-3d', '06-logo-outro']);

function sceneSec(id) {
  return SCENE_DURATIONS[id] ?? SCENE_SEC_DEFAULT;
}

const FRAME_SRC_W = 1000;
const FRAME_SRC_H = 1920;
const FRAME_SCALE = 0.96;
const FRAME_W = Math.round(FRAME_SRC_W * FRAME_SCALE);
const FRAME_H = Math.round(FRAME_SRC_H * FRAME_SCALE);
const FRAME_X = Math.round((W - FRAME_W) / 2);
const FRAME_Y = Math.round((H - FRAME_H) / 2);
const SCREEN_INSET_X = Math.round(22 * FRAME_SCALE);
const SCREEN_INSET_Y = Math.round(22 * FRAME_SCALE);
const SCREEN_W = Math.round(956 * FRAME_SCALE);
const SCREEN_H = Math.round(1876 * FRAME_SCALE) - (Math.round(1876 * FRAME_SCALE) % 2);
const SCREEN_X = FRAME_X + SCREEN_INSET_X;
const SCREEN_Y = FRAME_Y + SCREEN_INSET_Y;

/** Viewport logico × DPR3 = area schermo del frame (918×1801 px) */
const VIEWPORT_W = Math.round(SCREEN_W / 3);
const VIEWPORT_H = Math.round(SCREEN_H / 3);

/** Custom iPhone profile — viewport allineato al foro del frame */
const MOBILE_DEVICE = {
  ...(devices['iPhone 14 Pro'] ?? devices['iPhone 13 Pro']),
  viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

const { loadEnvConfig } = pkg;
loadEnvConfig(ROOT);

const GARAGE_USER = process.env.REEL_GARAGE_USER ?? 'jacfer22';
let BASE = process.env.REEL_BASE_URL ?? '';

/** Piazzale Clodio / Via Trionfale */
const GEO_PARTENZA = { latitude: 41.90785, longitude: 12.45605 };

/** @type {import('playwright').BrowserContext} */
let sharedContext = null;

/** @type {{ id: string; label: string; path?: string; html?: string; waitFor?: string; setup: (page: import('playwright').Page, ctx: import('playwright').BrowserContext) => Promise<void> }[]} */
const SCENES = [
  {
    id: '00-logo',
    label: 'Logo MotoGarage — phone intro',
    html: 'logo-splash',
    waitFor: 'img.logo',
    setup: async (page) => {
      await page.waitForSelector('img.logo', { timeout: 15000 });
      await page.waitForTimeout(600);
    },
  },
  {
    id: '01-landing',
    label: 'Landing mobile',
    path: '/',
    waitFor: 'h1',
    setup: async (page) => {
      await page.waitForSelector('h1', { timeout: 30000 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(1000);
    },
  },
  {
    id: '02-navigator',
    label: 'Navigatore — puntino neon sul tragitto',
    path: '/reel/nav',
    waitFor: '[data-reel-nav-ready="true"]',
    setup: async (page) => {
      await page.waitForSelector('[data-reel-nav-ready="true"]', { timeout: 90000 });
      await page.waitForTimeout(800);
    },
  },
  {
    id: '03-garage-3d',
    label: 'Garage 3D jacfer22 — hero fullscreen',
    path: `/reel/garage?user=${GARAGE_USER}`,
    waitFor: 'canvas, [aria-label="Viewer 3D interattivo"]',
    setup: async (page) => {
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
      await page.waitForSelector('[aria-label="Viewer 3D interattivo"]', { timeout: 120000 });
      await page.waitForFunction(
        () => !document.body.innerText.includes('Caricamento avatar'),
        { timeout: 120000 },
      ).catch(() => {});
      await page.waitForTimeout(600);
    },
  },
  {
    id: '04-community',
    label: 'Community feed',
    path: '/community',
    waitFor: 'main',
    setup: async (page) => {
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1200);
    },
  },
  {
    id: '06-logo-outro',
    label: 'Logo outro — Moto Garage',
    html: 'logo-outro',
    fullBleed: true,
    waitFor: 'img.logo',
    setup: async (page) => {
      await page.waitForSelector('img.logo', { timeout: 15000 });
      await page.waitForTimeout(200);
    },
  },
  {
    id: '05-cta',
    label: 'CTA finale',
    path: '/',
    waitFor: 'h2',
    setup: async (page) => {
      await page.evaluate(() => {
        const el = [...document.querySelectorAll('h2')].find((n) =>
          n.textContent?.includes('Pronto a partire'),
        );
        el?.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await page.waitForTimeout(900);
    },
  },
];

/** Scene incluse nel reel finale */
const REEL_SCENES = SCENES.filter((s) => !['04-community', '05-cta'].includes(s.id));

const XFADE_TRANSITIONS = SCENE_CUTS.map((c) => c.type);

function ffmpeg(args, label) {
  const r = spawnSync(ffmpegPath, args, { encoding: 'utf8', maxBuffer: 80 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`ffmpeg failed (${label}):\n`, r.stderr?.slice(-5000));
    process.exit(1);
  }
}

function heroPushFilter() {
  return null;
}

function introPhoneFilter() {
  return null;
}

function fileSizeOk(path, minBytes = 50000) {
  return existsSync(path) && statSync(path).size >= minBytes;
}

async function ensurePhoneFrame(browser) {
  mkdirSync(ASSETS_DIR, { recursive: true });
  if (fileSizeOk(FRAME_PNG, 15000)) return FRAME_PNG;

  const svg = readFileSync(FRAME_SVG, 'utf8');
  const page = await browser.newPage();
  await page.setViewportSize({ width: FRAME_SRC_W, height: FRAME_SRC_H });
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;background:transparent">${svg}</body></html>`,
    { waitUntil: 'load' },
  );
  await page.screenshot({ path: FRAME_PNG, omitBackground: true, type: 'png' });
  await page.close();
  return FRAME_PNG;
}

function compositePhoneFrame(rawClip, framedClip, framePath, sec) {
  const bg = '0x121218';
  const filter = [
    `[0:v]scale=${SCREEN_W}:${SCREEN_H}[scr]`,
    `color=c=${bg}:s=${W}x${H}:d=${sec}[bg]`,
    `[bg][scr]overlay=${SCREEN_X}:${SCREEN_Y}[base]`,
    `[1:v]scale=${FRAME_W}:${FRAME_H}[fr]`,
    `[base][fr]overlay=${FRAME_X}:${FRAME_Y}[out]`,
  ].join(';');

  ffmpeg(
    [
      '-y',
      '-i',
      rawClip,
      '-i',
      framePath,
      '-filter_complex',
      filter,
      '-map',
      '[out]',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '17',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-t',
      String(sec),
      framedClip,
    ],
    'phone-frame',
  );
}

function introPhoneFilterLegacy(frames) {
  return (
    `zoompan=z='if(lte(on,1),0.86,min(zoom+0.00055,1))':` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
    `d=${frames}:s=${W}x${H}:fps=${FPS}`
  );
}

function composeVideo(clips, sceneIds) {
  const work = join(SCENES_DIR, 'compose');
  mkdirSync(work, { recursive: true });

  const durations = sceneIds.map((id) => sceneSec(id));
  const cuts = SCENE_CUTS.slice(0, sceneIds.length - 1);

  const prepared = clips.map((clip, i) => {
    const out = join(work, `s${i}.mp4`);
    const sec = durations[i];
    const id = sceneIds[i];
    let vf = null;
    if (i === 0 && !NO_POSTFX_SCENES.has(id)) vf = introPhoneFilterLegacy(Math.ceil(sec * FPS));
    else if (HERO_SCENES.has(id)) vf = heroPushFilter();

    if (vf) {
      ffmpeg(
        [
          '-y',
          '-i',
          clip,
          '-vf',
          vf,
          '-an',
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '16',
          '-pix_fmt',
          'yuv420p',
          '-t',
          String(sec),
          out,
        ],
        `prep-${i}`,
      );
    } else {
      ffmpeg(['-y', '-i', clip, '-c:v', 'copy', '-an', '-t', String(sec), out], `copy-${i}`);
    }
    return out;
  });

  const n = prepared.length;
  const xfadeTotal = cuts.reduce((s, c) => s + c.dur, 0);
  const totalDuration = durations.reduce((a, b) => a + b, 0) - xfadeTotal;

  let filter = '';
  let prev = '[0:v]';
  let elapsed = 0;
  for (let i = 1; i < n; i++) {
    elapsed += durations[i - 1];
    const cut = cuts[i - 1] ?? { type: 'fade', dur: 0.5 };
    const offset = elapsed - cuts.slice(0, i).reduce((s, c) => s + c.dur, 0);
    const outLabel = i === n - 1 ? '[vout]' : `[v${i}]`;
    filter += `${prev}[${i}:v]xfade=transition=${cut.type}:duration=${cut.dur}:offset=${offset.toFixed(3)}${outLabel};`;
    prev = outLabel;
  }
  filter = filter.replace(/;$/, '');

  const xfadeOut = join(work, 'xfaded.mp4');
  ffmpeg(
    [
      ...prepared.flatMap((c) => ['-i', c]),
      '-y',
      '-filter_complex',
      filter,
      '-map',
      '[vout]',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '15',
      '-pix_fmt',
      'yuv420p',
      '-t',
      String(totalDuration),
      xfadeOut,
    ],
    'xfade',
  );

  ffmpeg(
    [
      '-y',
      '-i',
      xfadeOut,
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '15',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      FINAL,
    ],
    'finish',
  );

  return totalDuration;
}

async function resolveGarageUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return GARAGE_USER;
  const sb = createClient(url, key);
  for (const candidate of [GARAGE_USER, 'jacfer22']) {
    const { data } = await sb.from('profiles').select('username').ilike('username', candidate).maybeSingle();
    if (data?.username) return data.username;
  }
  return GARAGE_USER;
}

async function isCorrectApp(base) {
  try {
    const r = await fetch(base, { signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    if (!r.ok) return false;
    if (html.includes('Stock Management')) return false;
    return html.includes('Traccia') || html.includes('MotoGarage') || html.includes('/_next/');
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  for (const base of [
    process.env.REEL_BASE_URL,
    'http://127.0.0.1:3002',
    'http://localhost:3002',
  ].filter(Boolean)) {
    const normalized = base.replace(/\/$/, '');
    if (await isCorrectApp(normalized)) return normalized;
  }
  throw new Error('Avvia il server: npm run build && npx next start -p 3002');
}

async function waitForServer(base, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    if (await isCorrectApp(base)) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Server non pronto: ${base}`);
}

async function waitForCanvasReady(page, maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const avg = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c || c.width < 10) return 0;
      try {
        const ctx = c.getContext('2d');
        if (ctx) {
          const d = ctx.getImageData(0, 0, Math.min(64, c.width), Math.min(64, c.height)).data;
          let s = 0;
          for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
          return s / (d.length / 4);
        }
      } catch {
        /* WebGL canvas */
      }
      return c.width > 100 ? 40 : 0;
    });
    if (avg > 15) return;
    await page.waitForTimeout(800);
  }
  console.warn('  ⚠ canvas loading slow — continuing');
}

async function dragRotateCanvas(page, { gentle = false } = {}) {
  const target = page.locator('[aria-label="Viewer 3D interattivo"], canvas').first();
  const box = await target.boundingBox({ timeout: 15000 }).catch(() => null);
  if (!box) return;
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * 0.48;
  const steps = gentle ? 14 : 20;
  const stepPx = gentle ? 6 : 10;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < steps; i++) {
    await page.mouse.move(cx + i * stepPx, cy - i * 0.3, { steps: 4 });
    await page.waitForTimeout(gentle ? 55 : 35);
  }
  await page.mouse.up();
}

async function captureScene(browser, scene, framePath) {
  const framesDir = join(SCENES_DIR, scene.id, 'frames');
  const proof = join(SCENES_DIR, `${scene.id}-proof.png`);
  const rawMp4 = join(SCENES_DIR, `${scene.id}-raw.mp4`);
  const mp4 = join(SCENES_DIR, `${scene.id}.mp4`);

  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const context = await browser.newContext({
    ...MOBILE_DEVICE,
    colorScheme: 'dark',
    locale: 'it-IT',
    geolocation: GEO_PARTENZA,
    permissions: ['geolocation'],
  });

  const page = await context.newPage();

  console.log(`\n▶ ${scene.label}`);

  if (scene.html === 'logo-splash') {
    const html = readFileSync(LOGO_SPLASH, 'utf8').replace(
      'src="/logo-motogarage.png"',
      `src="${BASE}/logo-motogarage.png"`,
    );
    await page.setContent(html, { waitUntil: 'load' });
  } else if (scene.html === 'logo-outro') {
    const html = readFileSync(LOGO_OUTRO, 'utf8').replace(
      'src="/logo-motogarage.png"',
      `src="${BASE}/logo-motogarage.png"`,
    );
    await page.setContent(html, { waitUntil: 'load' });
  } else {
    const url = `${BASE}${scene.path}`;
    console.log(`  ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {});
  }

  if (scene.waitFor) await page.waitForSelector(scene.waitFor, { timeout: 45000 });
  await scene.setup(page, context);

  await page.screenshot({ path: proof, fullPage: false, type: 'png' });
  if (!fileSizeOk(proof, 8000)) {
    await context.close();
    throw new Error(`Screenshot vuoto: ${scene.id}`);
  }
  console.log(`  ✓ proof ${proof} (${Math.round(statSync(proof).size / 1024)} KB)`);

  const sec = sceneSec(scene.id);
  const frameCount = Math.ceil(sec * FPS);
  for (let i = 0; i < frameCount; i++) {
    if (scene.id === '02-navigator') {
      await page.evaluate(
        ({ frame, total }) => {
          window.dispatchEvent(new CustomEvent('reel-nav-frame', { detail: { frame, total } }));
        },
        { frame: i, total: frameCount },
      );
    } else if (scene.id === '03-garage-3d') {
      await page.evaluate(
        ({ frame, total }) => {
          window.dispatchEvent(new CustomEvent('reel-garage-frame', { detail: { frame, total } }));
        },
        { frame: i, total: frameCount },
      );
    }
    await page.screenshot({
      path: join(framesDir, `f_${String(i).padStart(5, '0')}.png`),
      type: 'png',
    });
    await page.waitForTimeout(1000 / FPS);
  }

  await context.close();

  ffmpeg(
    [
      '-y',
      '-framerate',
      String(FPS),
      '-i',
      join(framesDir, 'f_%05d.png'),
      '-vf',
      `scale=${SCREEN_W}:${SCREEN_H},setsar=1`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '16',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-t',
      String(sec),
      rawMp4,
    ],
    `${scene.id}-raw`,
  );

  if (scene.fullBleed) {
    ffmpeg(
      [
        '-y',
        '-i',
        rawMp4,
        '-vf',
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x000000,setsar=1`,
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '15',
        '-pix_fmt',
        'yuv420p',
        '-t',
        String(sec),
        mp4,
      ],
      `${scene.id}-fullbleed`,
    );
  } else {
    compositePhoneFrame(rawMp4, mp4, framePath, sec);
  }

  const minClip = scene.fullBleed ? 12000 : 80000;
  if (!fileSizeOk(mp4, minClip)) {
    throw new Error(`Clip troppo piccola / nera: ${scene.id}`);
  }

  rmSync(framesDir, { recursive: true, force: true });
  try {
    rmSync(rawMp4);
  } catch {
    /* ignore */
  }

  return { mp4, proof };
}

async function main() {
  console.log('MotoGarage Reel — mobile marketing capture\n');

  const onlyScene = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
  const composeOnly = process.argv.includes('--compose-only');

  mkdirSync(SCENES_DIR, { recursive: true });
  mkdirSync(ASSETS_DIR, { recursive: true });

  BASE = await resolveBaseUrl();
  if (!composeOnly) await waitForServer(BASE);
  else BASE = process.env.REEL_BASE_URL ?? 'http://127.0.0.1:3002';

  const garageUser = await resolveGarageUser();
  const garageScene = SCENES.find((s) => s.id === '03-garage-3d');
  if (garageScene) {
    garageScene.path = `/reel/garage?user=${garageUser}`;
    garageScene.label = `Garage 3D — ${garageUser} hero`;
  }

  console.log(`Base: ${BASE} | Garage: ${garageUser}`);

  let clips;
  if (composeOnly) {
    clips = REEL_SCENES.map((s) => join(SCENES_DIR, `${s.id}.mp4`)).filter((p) => existsSync(p));
    if (clips.length < REEL_SCENES.length) throw new Error('--compose-only but missing scene clips');
  } else {
    const browser = await chromium.launch({
      headless: true,
      args: ['--enable-webgl', '--use-gl=angle', '--ignore-gpu-blocklist', '--no-sandbox'],
    });
    clips = [];
    try {
      const framePath = await ensurePhoneFrame(browser);
      const scenesToRun = onlyScene ? REEL_SCENES.filter((s) => s.id === onlyScene) : REEL_SCENES;
      for (const scene of scenesToRun) {
        const { mp4 } = await captureScene(browser, scene, framePath);
        clips.push(mp4);
        console.log(`  → ${mp4}`);
      }
      if (onlyScene) {
        clips = REEL_SCENES.map((s) => join(SCENES_DIR, `${s.id}.mp4`)).filter((p) => existsSync(p));
      }
    } finally {
      await browser.close();
    }
  }

  console.log('\nCompose (hero nav+garage, transizioni pro, no audio)…');
  const sceneIds = REEL_SCENES.map((s) => s.id);
  const duration = composeVideo(clips, sceneIds);

  writeFileSync(
    join(OUT_DIR, 'README.md'),
    `# MotoGarage Instagram Reel

\`\`\`bash
npm run build && npx next start -p 3002
REEL_BASE_URL=http://127.0.0.1:3002 npm run reel
\`\`\`

- **Output:** \`motogarage-instagram-reel.mp4\` (~${duration.toFixed(0)}s, silent)
- **Scenes:** logo → landing → navigatore (Trionfale→Olimpico) → garage 3D → community → CTA
- **Proof PNGs:** \`scenes/*-proof.png\` — verifica visibilità prima del compose
- Aggiungi musica in post (CapCut, Premiere, Instagram)
`,
  );

  console.log(`\n✓ ${FINAL} (~${duration.toFixed(1)}s)`);
  try {
    copyFileSync(FINAL, join(OUT_DIR, 'motogarage-instagram-reel.mp4'));
    console.log(`  ✓ copiato anche in motogarage-instagram-reel.mp4`);
  } catch {
    console.log('  (chiudi il file mp4 aperto per sovrascrivere la copia principale)');
  }
  console.log('  Controlla scenes/*-proof.png se qualcosa non si vede.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
