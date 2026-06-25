/**
 * Video tour Instagram: telefono che naviga l'app + mascotte con fumetto.
 * Output: social/tour-video/motogarage-mascot-tour.mp4
 *
 * npm run social:tour-video
 *
 * Richiede app in esecuzione (prod o locale):
 *   npm run build && npx next start -p 3002
 *   REEL_BASE_URL=https://motogarage.info npm run social:tour-video
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import pkg from '@next/env';
import { createClient } from '@supabase/supabase-js';
import {
  assertMascots,
  loadMascotDataUrls,
  toMp4,
  concatMp4,
} from '../social/lib/tour.mjs';
import {
  APP_TOUR_SCENES,
  captureScreenFrames,
  recordCompositeSegment,
} from '../social/lib/tour-app-video.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'social', 'tour-video');
const WORK = join(OUT_DIR, '_work');
const FINAL = join(OUT_DIR, 'motogarage-mascot-tour.mp4');

const FPS = 24;
const GARAGE_USER = process.env.REEL_GARAGE_USER ?? 'demo';

const { loadEnvConfig } = pkg;
loadEnvConfig(ROOT);

async function isCorrectApp(base) {
  try {
    const r = await fetch(base, { signal: AbortSignal.timeout(12000) });
    const html = await r.text();
    if (!r.ok) return false;
    return html.includes('MotoGarage') || html.includes('Traccia') || html.includes('/_next/');
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  for (const base of [
    process.env.REEL_BASE_URL,
    'https://motogarage.info',
    'http://127.0.0.1:3002',
    'http://localhost:3002',
  ].filter(Boolean)) {
    const normalized = String(base).replace(/\/$/, '');
    if (await isCorrectApp(normalized)) return normalized;
  }
  throw new Error(
    'App non raggiungibile. Avvia: npm run build && npx next start -p 3002\n' +
      'Oppure: REEL_BASE_URL=https://motogarage.info npm run social:tour-video',
  );
}

async function resolveGarageUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return GARAGE_USER;
  const sb = createClient(url, key);
  for (const candidate of [GARAGE_USER, 'demo', 'jacop']) {
    const { data } = await sb.from('profiles').select('username').ilike('username', candidate).maybeSingle();
    if (data?.username) return data.username;
  }
  return GARAGE_USER;
}

function fileOk(path, min = 50000) {
  return existsSync(path) && statSync(path).size >= min;
}

async function main() {
  console.log('\n🎬 MotoGarage — video tour mascotte + app\n');

  assertMascots();
  const base = await resolveBaseUrl();
  const garageUser = await resolveGarageUser();
  console.log(`▶ Base URL: ${base}`);
  console.log(`▶ Garage user: ${garageUser}\n`);

  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(WORK, { recursive: true });

  const mascotUrls = loadMascotDataUrls();
  const browser = await chromium.launch();
  const segments = [];

  try {
    for (let i = 0; i < APP_TOUR_SCENES.length; i++) {
      const scene = APP_TOUR_SCENES[i];
      const sec = scene.sec;
      console.log(`\n▶ ${scene.step} — ${scene.headline}`);

      const screenFrames = await captureScreenFrames(
        browser,
        base,
        scene,
        join(WORK, scene.id, 'screen'),
        FPS,
        sec,
        garageUser,
        ROOT,
      );
      console.log(`  ✓ ${screenFrames.length} frame schermo`);

      const compDir = join(WORK, scene.id, 'composite');
      const prefix = 'c_';
      await recordCompositeSegment(
        scene,
        i,
        mascotUrls[scene.mascot],
        screenFrames,
        compDir,
        prefix,
        FPS,
        sec,
        APP_TOUR_SCENES.length,
      );

      const seg = join(WORK, `${scene.id}.mp4`);
      const ok = toMp4(join(compDir, `${prefix}%04d.png`), seg, FPS, sec);
      if (!ok || !fileOk(seg)) throw new Error(`Segmento fallito: ${scene.id}`);
      segments.push(seg);
      console.log(`  ✓ ${seg} (${Math.round(statSync(seg).size / 1024)} KB)`);
    }
  } finally {
    await browser.close();
  }

  console.log('\n▶ Concatenazione video finale…\n');
  if (!concatMp4(segments, FINAL)) process.exit(1);

  const sizeMb = (statSync(FINAL).size / (1024 * 1024)).toFixed(1);
  console.log(`\n✅ Video pronto: ${FINAL} (${sizeMb} MB)\n`);
  console.log('   Formato: 1080×1920 · Story/Reel Instagram');
  console.log('   Telefono con app reale + mascotte con fumetto affiancato\n');

  rmSync(WORK, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
