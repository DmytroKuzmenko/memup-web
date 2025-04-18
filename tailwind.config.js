/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}"
    ],
    theme: {
      extend: {
        height: {
          'screen-dynamic': '100dvh',
        },
      },
    },
    plugins: [],
  }