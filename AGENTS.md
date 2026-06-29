# AGENTS.md

## Cursor Cloud specific instructions

MotoGarage is a single Next.js 15 (App Router) + React 19 app (Italian motorcycle
itinerary / community / 3D-garage platform). There is one service: the Next.js dev
server on port 3000. Standard scripts live in `package.json`; setup/run notes the
README (`README.md`) already covers are not repeated here.

- Dependencies install with `npm install` (npm lockfile). This is handled by the
  startup update script, so you normally don't need to run it manually.
- Running with no env config is fine: when `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent the app serves built-in fallback data
  (see `src/lib/fallback.ts`), so all the itinerary/browse pages render without a
  Supabase project. `.env.local` is git-ignored and only needed to exercise
  auth/Supabase/Stripe/HuggingFace-backed features (login, garage generation, etc.).

- IMPORTANT startup caveat: `npm run dev` is currently broken with the resolved
  `next`/`@next/env` 15.5.x. `scripts/dev.mjs` does
  `import { loadEnvConfig } from '@next/env'`, but that package is CommonJS and the
  named export is not detected in raw Node ESM, so the script crashes with
  `SyntaxError: Named export 'loadEnvConfig' not found`. Run the dev server directly
  instead:

  ```bash
  npx next dev
  ```

  (`npm run build` / `scripts/build.mjs` are unaffected because they don't import
  `@next/env`.)

- Lint: there is no ESLint config or `lint` script. The type check is the
  equivalent gate: `npm run typecheck` (`tsc --noEmit`).
- Build: `npm run build` works as-is and prerenders the static itinerary pages.
