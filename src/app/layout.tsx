import type { Metadata, Viewport } from 'next';
import { Archivo, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import InstallaPwa from '@/components/InstallaPwa';
import MainShell from '@/components/MainShell';
import FeedbackProvider from '@/components/FeedbackProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { TemaProvider } from '@/components/TemaProvider';

const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });
const body = Archivo({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://motogarage.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'MotoGarage',
  title: {
    default: 'MotoGarage — La casa digitale della tua moto',
    template: '%s | MotoGarage',
  },
  description: 'Crea l\'avatar 3D della tua moto, costruisci il tuo garage, traccia i giri e condividi itinerari con la community.',
  keywords: ['moto', 'garage digitale', 'avatar moto 3D', 'itinerari moto', 'GPS moto', 'community motociclisti'],
  authors: [{ name: 'MotoGarage' }],
  creator: 'MotoGarage',
  publisher: 'MotoGarage',
  category: 'motorcycles',
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'MotoGarage — La casa digitale della tua moto',
    description: 'Il garage digitale per creare l\'avatar 3D della tua moto, tracciare giri e condividere esperienze.',
    siteName: 'MotoGarage',
    url: '/',
    locale: 'it_IT',
    type: 'website',
    images: [{
      url: '/og-motogarage.png',
      width: 1728,
      height: 912,
      alt: 'MotoGarage, la casa digitale della tua moto',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoGarage — La casa digitale della tua moto',
    description: 'Garage digitale, avatar moto 3D, itinerari e community per motociclisti.',
    images: ['/og-motogarage.png'],
  },
  icons: {
    icon: [
      { url: '/logo-motogarage.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-motogarage.png', type: 'image/png' },
    ],
    apple: [{ url: '/logo-motogarage.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'MotoGarage',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f1f2' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0B0A' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`dark ${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark');`,
        }} />
      </head>
      <body className="con-bottomnav flex min-h-screen flex-col font-body antialiased">
        <TemaProvider>
          <AuthProvider>
            <FeedbackProvider>
              <Header />
              <MainShell>{children}</MainShell>
              <Footer />
              <InstallaPwa />
              <BottomNav />
            </FeedbackProvider>
          </AuthProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
