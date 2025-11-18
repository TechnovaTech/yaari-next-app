/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#FFB5A0',
      },
      padding: {
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-left': 'var(--safe-area-left)',
        'safe-right': 'var(--safe-area-right)',
        'safe-bottom-extra': 'var(--safe-bottom-extra)',
        'statusbar': 'var(--statusbar-height)',
        'navbar': 'var(--navbar-height)',
      },
      margin: {
        'safe-top': 'var(--safe-area-top)',
        'safe-bottom': 'var(--safe-area-bottom)',
        'safe-left': 'var(--safe-area-left)',
        'safe-right': 'var(--safe-area-right)',
      },
      height: {
        'statusbar': 'var(--statusbar-height)',
        'navbar': 'var(--navbar-height)',
      },
    },
  },
  plugins: [],
  safelist: ['pb-safe-bottom', 'pt-safe-top', 'pl-safe-left', 'pr-safe-right'],
}