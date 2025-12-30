/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita el modo oscuro manual basado en clases
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#0d1117'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}