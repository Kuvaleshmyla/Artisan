/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#a38068', // Earthy tone
          600: '#8b6b58',
          700: '#695042',
          800: '#47362c',
          900: '#241b16',
        }
      }
    },
  },
  plugins: [],
}
