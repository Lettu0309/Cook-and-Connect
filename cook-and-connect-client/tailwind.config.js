/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Importante para el switch de temas
  theme: {
    extend: {
      colors: {
        // Paleta Fuego y Tierra
        brand: {
          cream: '#FFFAF0',   // 60% Claro (Fondo)
          peach: '#FFE5D9',   // 30% Claro (Secundario)
          brick: '#D35400',   // 10% Acento (Botones/Links)
          
          dark: '#1C1917',    // 60% Oscuro (Fondo)
          warmGray: '#292524',// 30% Oscuro (Secundario)
          amber: '#FB923C',   // 10% Acento Oscuro (Botones/Links)
        }
      },
      fontFamily: {
        // Fuentes elegidas para el proyecto
        serif: ['Merriweather', 'serif'],
        sans: ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}