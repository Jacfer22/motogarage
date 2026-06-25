# Video tour Instagram

Genera un **Reel/Story 1080×1920** (~30 s): telefono con navigazione reale nell'app + mascotte (Rosso, Blu, Nero) con fumetto affiancato.

## Comando

```bash
npm run social:tour-video
```

Usa `https://motogarage.info` se online, altrimenti avvia in locale:

```bash
npm run build && npx next start -p 3002
REEL_BASE_URL=http://127.0.0.1:3002 npm run social:tour-video
```

Garage 3D live (opzionale):

```bash
REEL_GARAGE_USER=tuo_username npm run social:tour-video
```

## Output

`social/tour-video/motogarage-mascot-tour.mp4`

Pronto per Instagram Reels / Stories / sponsorizzate.
