/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dae6',
          300: '#a7bbd2',
          400: '#7798b9',
          500: '#53789f',
          600: '#415f83',
          700: '#354d6b',
          800: '#2f425b',
          900: '#2b394e',
          950: '#1c2534',
        }
      }
    },
  },
  plugins: [],
}
