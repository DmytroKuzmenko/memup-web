/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      height: {
        'screen-dynamic': '100dvh',
      },
      keyframes: {
        popHeart: {
          '0%': { transform: 'scale(0.5)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
      },
      animation: {
        popHeart: 'popHeart 1s ease-out',
      }
    },
  },
  plugins: [],
}