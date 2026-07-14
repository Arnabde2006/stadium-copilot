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
          dark: '#0A0F1A',
          navy: '#121826',
          gold: '#F2B441',
          yellow: '#F2B441',
          blue: '#1B6E4A',
          accent: '#1B6E4A',
          congested: '#E23B3B',
          moderate: '#F2B441',
          clear: '#1B6E4A',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
