import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MotoGarage — La casa digitale della tua moto',
    short_name: 'MotoGarage',
    description: 'Garage digitale, avatar moto 3D, itinerari, GPS e community per motociclisti.',
    start_url: '/traccia',
    display: 'standalone',
    background_color: '#0F0B0A',
    theme_color: '#ED2100',
    orientation: 'any',
    lang: 'it',
    categories: ['lifestyle', 'navigation', 'social'],
    icons: [
      { src: '/logo-motogarage.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
