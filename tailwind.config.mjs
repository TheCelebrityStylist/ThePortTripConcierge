import typography from '@tailwindcss/typography';
export default {
  content: ['./src/**/*.{astro,js,mjs,html}'],
  theme: {
    extend: {
      colors: { navy: '#0F2E44', fog: '#EEF2F1', mist: '#F7F9F8', sea: '#1D6A72', signal: '#F4C430', signalHover: '#E9B820', ink: '#171A20' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [typography],
};
