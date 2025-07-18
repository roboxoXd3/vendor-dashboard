/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-theme)',
      },
    },
  },
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './shared/**/*.{js,jsx}',
  ],
}
