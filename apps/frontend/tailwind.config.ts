import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          dark: 'var(--surface-base)',
          navy: 'var(--surface-panel)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
          gold: 'var(--fifa-moderate)',
          yellow: 'var(--fifa-moderate)',
          blue: 'var(--fifa-clear)',
          accent: 'var(--fifa-clear)',
          congested: 'var(--fifa-congested)',
          moderate: 'var(--fifa-moderate)',
          clear: 'var(--fifa-clear)',
        }
      },
      fontSize: {
        xs: ['var(--text-size-secondary)', { lineHeight: '1.4' }],
        sm: ['var(--text-size-secondary)', { lineHeight: '1.4' }],
        base: ['var(--text-size-body)', { lineHeight: '1.5' }],
        'map-label': ['var(--text-size-map-label)', { lineHeight: '1.3' }],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
