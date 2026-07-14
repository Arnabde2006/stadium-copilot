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
          dark: '#0B0F19',
          navy: '#121826',
          card: '#1B2236',
          elevated: '#242D47',
          gold: '#D99B26',
          yellow: '#D99B26',
          blue: '#228557',
          accent: '#228557',
          congested: '#C93B3B',
          moderate: '#D99B26',
          clear: '#228557',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
