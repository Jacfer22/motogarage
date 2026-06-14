import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        asfalto: '#15181A',
        // superfici per dare profondità (dal più scuro al più chiaro)
        notte: '#0E1012',
        carbone: '#1C2024',
        cemento: '#F0F1F2',
        nebbia: '#FBFBFC',
        segnale: '#F2B705',
        'segnale-scuro': '#D99F04',
        cartello: '#8A5A2B',
        bosco: '#3E5C45',
        guardrail: '#C6CACD',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
        hand: ['var(--font-hand)'],
      },
      borderRadius: {
        app: '14px',
        'app-lg': '20px',
      },
      boxShadow: {
        // ombre stratificate, morbide, da interfaccia app
        'app-sm': '0 1px 2px rgba(21,24,26,0.06), 0 1px 3px rgba(21,24,26,0.08)',
        app: '0 2px 4px rgba(21,24,26,0.06), 0 4px 12px rgba(21,24,26,0.08)',
        'app-md': '0 4px 8px rgba(21,24,26,0.07), 0 8px 24px rgba(21,24,26,0.10)',
        'app-lg': '0 8px 16px rgba(21,24,26,0.08), 0 16px 40px rgba(21,24,26,0.14)',
        'app-up': '0 -4px 16px rgba(21,24,26,0.10)',
        segnale: '0 4px 16px rgba(242,183,5,0.35)',
      },
      transitionTimingFunction: {
        app: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
