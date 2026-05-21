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
        'brand': {
          'cobalt': '#000B2E',
          'navy': '#001242',
          'luminous-cyan': 'var(--cyan-primary)',
          'accent-cyan': 'var(--cyan-accent)',
        },
        'navy-dark': '#000820',
        'cyan-glow': 'rgba(0, 229, 255, 0.5)',
        // Semantic Tokens
        'primary': 'var(--bg-primary)',
        'sidebar': 'var(--sidebar-bg)',
        'card': 'var(--bg-card)',
        'card-border': 'var(--card-border)',
        'sidebar-border': 'var(--sidebar-border)',
        'text-main': 'var(--text-main)',
        'sidebar-text': 'var(--sidebar-text)',
        'sidebar-text-muted': 'var(--sidebar-text-muted)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top right, #001242, #000B2E)',
        'blur-glow-primary': 'var(--blur-glow-primary)',
        'blur-glow-secondary': 'var(--blur-glow-secondary)',
      },
      animation: {
        'orbit': 'orbit linear infinite',
        'pulse-slow': 'pulse 6s infinite',
        'clinical-scan': 'scan 3s linear infinite',
        'bounce-slow': 'bounce 4s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(150px) rotate(-360deg)' },
        },
        scan: {
          '0%': { top: '-100%' },
          '100%': { top: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
