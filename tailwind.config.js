/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'purple': '#2D0A4E',
          'dark': '#1A052E',
          'neon-green': '#39FF14',
          'accent-green': '#00F5FF',
        },
        'navy-dark': '#0F172A',
        'purple-glow': 'rgba(139, 92, 246, 0.5)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top right, #3B0764, #1E1B4B)',
      },
      animation: {
        'orbit': 'orbit linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(150px) rotate(-360deg)' },
        }
      }
    },
  },
  plugins: [],
}
