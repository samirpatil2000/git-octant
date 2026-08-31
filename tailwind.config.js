/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './popup.html',
    './newtab.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Cascadia Mono',
          'monospace',
        ],
      },
      colors: {
        canvas: {
          light: '#fbfbfd',
          dark: '#0a0c10',
        },
        surface: {
          light: '#ffffff',
          'light-hover': '#f4f5f8',
          'light-subtle': '#f0f2f5',
          dark: '#12151c',
          'dark-hover': '#191d26',
          'dark-subtle': '#161922',
        },
        border: {
          light: '#e2e5eb',
          'light-subtle': '#eceef2',
          dark: '#232834',
          'dark-subtle': '#1b1f29',
        },
        fg: {
          light: '#111318',
          'light-muted': '#5c6475',
          'light-subtle': '#8b93a4',
          dark: '#f1f3f7',
          'dark-muted': '#969eb2',
          'dark-subtle': '#5e677c',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0071e3',
          600: '#0062c4',
          700: '#0051a3',
        },
        attention: {
          amber: '#f59e0b',
          'amber-subtle': '#78350f25',
          rose: '#f43f5e',
          'rose-subtle': '#88133725',
          emerald: '#10b981',
          'emerald-subtle': '#064e3b25',
          violet: '#8b5cf6',
          'violet-subtle': '#4c1d9525',
          blue: '#38bdf8',
          'blue-subtle': '#0c4a6e25',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 8px 30px -4px rgba(0, 0, 0, 0.4)',
        popover: '0 12px 36px -4px rgba(0, 0, 0, 0.15)',
        'popover-dark': '0 20px 45px -8px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
