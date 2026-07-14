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
          dark: '#0B132B',
          navy: '#1C2541',
          gold: '#C5A880',
          yellow: '#FFD700',
          blue: '#1E40AF',
          accent: '#3B82F6',
          congested: '#EF4444',
          moderate: '#F59E0B',
          clear: '#10B981',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
