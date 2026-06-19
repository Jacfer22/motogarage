import type { Metadata } from 'next';
import { Barlow_Condensed, Archivo, IBM_Plex_Mono, Caveat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/components/AuthProvider';
import { TemaProvider } from '@/components/TemaProvider';

const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600','700'], variable: '--font-display' });
const body = Archivo({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-mono' });
const hand = Caveat({ subsets: ['latin'], weight: ['500','600'], variable: '--font-hand' });

export const metadata: Metadata = {
  title: 'MotoGarage — La casa digitale della tua moto',
  description: 'Crea il gemello digitale della tua moto, personalizza il tuo garage, scopri itinerari e connettiti con la community di motociclisti italiani.',
  keywords: 'moto, garage digitale, gemello digitale, itinerari moto, motociclisti, personalizzazione moto, 3D',
  openGraph: {
    title: 'MotoGarage',
    description: 'La casa digitale della tua moto',
    siteName: 'MotoGarage',
    locale: 'it_IT',
    type: 'website',
  },
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${display.variable} ${body.variable} ${mono.variable} ${hand.variable}`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin=""/>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('motogarage-tema');var s=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='scuro'||(!t&&s)){document.documentElement.classList.add('dark');}}catch(e){}})();`
        }}/>
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col con-bottomnav">
        <TemaProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
          </AuthProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
