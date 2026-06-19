import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ risultati: [] });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'it');
  url.searchParams.set('addressdetails', '0');

  try {
    const risposta = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MotoGarage/1.0 (navigazione moto; info@motogarage.it)',
      },
      next: { revalidate: 0 },
    });
    if (!risposta.ok) {
      return NextResponse.json({ errore: 'Geocoding non disponibile.' }, { status: 502 });
    }

    const dati = await risposta.json() as { lat: string; lon: string; display_name: string }[];
    const risultati = dati.map((item) => ({
      lat: Number(item.lat),
      lng: Number(item.lon),
      nome: item.display_name.split(',').slice(0, 3).join(',').trim(),
    }));

    return NextResponse.json({ risultati });
  } catch {
    return NextResponse.json({ errore: 'Ricerca luoghi non riuscita.' }, { status: 502 });
  }
}
