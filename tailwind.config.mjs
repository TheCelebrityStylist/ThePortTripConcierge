import typography from '@tailwindcss/typography';
// Mirrors the app (Base44 PortDay): ink, paper, sea, plimsoll red, buoy amber, Playfair for display.
export default {
  content: ['./src/**/*.{astro,js,mjs,html}'],
  theme: {
    extend: {
      colors: {
        navy: '#12324A', ink: '#0D2436', fog: '#EEF3F1', mist: '#F6F9F8', paper: '#EEF3F1',
        sea: '#2F7F8F', seaSoft: '#CFE3E3', anchor: '#1D6A72', plimsoll: '#C8372D', buoy: '#E8A33D',
        signal: '#F4C430', signalHover: '#E9B820',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Playfair Display"', 'Georgia', 'serif'] },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [typography],
};
