/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        bengali: ['var(--font-noto-bengali)', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        devanagari: ['var(--font-noto-devanagari)', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '360px',
      },
    },
  },
  plugins: [],
};
