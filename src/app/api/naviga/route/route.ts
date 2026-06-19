import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OSRM_BASE = process.env.OSRM_URL?.replace(/\/$/, '') ?? 'https://router.project-osrm.org';

export async function GET(req: NextRequest) {
  const daLat = Number(req.nextUrl.searchParams.get('daLat'));
  const daLng = Number(req.nextUrl.searchParams.get('daLng'));
  const aLat = Number(req.nextUrl.searchParams.get('aLat'));
  const aLng = Number(req.nextUrl.searchParams.get('aLng'));

  if (![daLat, daLng, aLat, aLng].every(Number.isFinite)) {
    return NextResponse.json({ errore: 'Coordinate non valide.' }, { status: 400 });
  }

  const url =
    `${OSRM_BASE}/route/v1/driving/${daLng},${daLat};${aLng},${aLat}` +
    '?overview=full&geometries=geojson&steps=true&alternatives=false';

  try {
    const risposta = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 0 } });
    const json = await risposta.json() as {
      code?: string;
      routes?: unknown[];
      message?: string;
    };

    if (!risposta.ok || json.code !== 'Ok' || !json.routes?.[0]) {
      return NextResponse.json(
        { errore: json.message ?? 'OSRM non ha trovato un percorso.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ route: json.routes[0] });
  } catch {
    return NextResponse.json({ errore: 'Servizio di routing non raggiungibile.' }, { status: 502 });
  }
}
