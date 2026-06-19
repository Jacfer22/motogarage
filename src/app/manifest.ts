import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MotoGarage — La casa digitale della tua moto',
    short_name: 'MotoGarage',
    description: 'Garage digitale, gemello 3D, itinerari, GPS e community per motociclisti.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08090b',
    theme_color: '#d91414',
    orientation: 'any',
    lang: 'it',
    categories: ['lifestyle', 'navigation', 'social'],
    icons: [
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
