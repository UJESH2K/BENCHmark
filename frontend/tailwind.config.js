/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#020b07',
        darker: '#010503',
        panel: '#0a1a12',
        'panel-hover': '#0e261a',
        primary: '#9ffe6a',
        primaryDark: '#79c74d',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(159, 254, 106, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(159, 254, 106, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
